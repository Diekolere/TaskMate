import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

    const body = await req.json();
    const { action, jobId } = body;

    await supabaseClient.from("edge_function_logs").insert({
      function_name: "matching",
      status: "success",
      metadata: { action, jobId }
    });

    if (action === "auto-match") {
      if (!jobId) throw new Error("jobId is required");

      // 1. Fetch Job Details (including geography point)
      const { data: job, error: jobError } = await supabaseClient
        .from("jobs")
        .select("*, location_coords")
        .eq("id", jobId)
        .single();
      
      if (jobError || !job) throw new Error("Job not found");

      // 2. Fetch Active Providers within proximity or in same category
      // We use ST_DWithin or simply fetch with distance for ranking
      let query = supabaseClient
        .from("provider_profiles")
        .select(`
          id, business_name, bio, trade_category, average_rating, completed_jobs_count, service_radius_meters,
          distance:location_coords.dist( ${job.location_coords} )
        `)
        .eq("verification_status", "verified");
      
      // If job has coords, we can use them to filter
      if (job.location_coords) {
        // Find providers where distance is within their service radius
        // For simplicity in SQL via Supabase-js, we'll fetch and then refine, 
        // or use an RPC if complex. Let's use a raw query for distance.
        const { data: pData, error: pError } = await supabaseClient.rpc('get_nearby_providers', {
          job_lat: job.coordinates?.lat,
          job_lng: job.coordinates?.lng,
          category_name: job.category
        });
        
        if (pError) {
          console.warn("RPC failed, falling back to basic category filter", pError);
        } else if (pData) {
          // relevantProviders already filtered by RPC
          var relevantProviders = pData;
        }
      }

      if (!relevantProviders) {
        const { data: providers, error: provError } = await supabaseClient
          .from("provider_profiles")
          .select("id, business_name, bio, trade_category, average_rating, completed_jobs_count")
          .eq("verification_status", "verified");
        
        if (provError || !providers) throw new Error("Could not fetch providers");

        relevantProviders = providers.filter(p => 
          p.trade_category && p.trade_category.map((t: string) => t.toLowerCase()).includes(job.category.toLowerCase())
        );
      }

      if (relevantProviders.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No providers in this category." }), { headers: corsHeaders });
      }

      // 3. Ask Gemini to score them
      const providerDescriptions = relevantProviders.map((p: any) => 
        `ID: ${p.id}\nName: ${p.business_name}\nBio: ${p.bio}\nRating: ${p.average_rating}\nJobs Done: ${p.completed_jobs_count}\nDistance: ${p.distance_meters ? (p.distance_meters/1000).toFixed(1) + 'km' : 'Unknown'}`
      ).join("\n\n---\n\n");

      const prompt = `You are a matching algorithm for a service marketplace.
I have a new job request:
Title: ${job.title}
Description: ${job.enhanced_description || job.description}
Urgency: ${job.urgency}
Category: ${job.category}

And I have the following relevant providers (proximity taken into account):
${providerDescriptions}

For each provider, calculate a match_score (0-100) based on how well their Bio, Rating, and Experience aligns with the job description. Give extra points to those within 10km. Also provide a 1-sentence ai_rationale explaining why.
Output ONLY a JSON array of objects, like this:
[
  { "provider_id": "UUID-HERE", "match_score": 85, "ai_rationale": "Strong experience in this exact issue and very close to your location." }
]
Do not include markdown tags.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Gemini API Error");

      let textOutput = data.candidates[0].content.parts[0].text;
      textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const matches = JSON.parse(textOutput);

      // 4. Save Matches to Database
      const insertData = matches.map((m: any) => ({
        job_id: jobId,
        provider_id: m.provider_id,
        match_score: m.match_score,
        ai_rationale: m.ai_rationale
      }));

      await supabaseClient.from("job_matches").insert(insertData);
      
      // Update job matched_providers_count
      await supabaseClient.from("jobs").update({ matched_providers_count: insertData.length }).eq("id", jobId);

      // 5. Send Notifications (Push/Email) to the matched providers
      // Calling the notifications edge function could be done here, or via DB Triggers.
      // We will let the DB Trigger or realtime handle it for now to keep it decoupled.

      return new Response(JSON.stringify({ success: true, matches: insertData.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Matching Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
