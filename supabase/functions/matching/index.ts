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

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const model = Deno.env.get("AI_MODEL") || "google/gemini-2.0-flash-001";
    
    const body = await req.json();
    const { action, jobId } = body;

    if (action === "auto-match") {
      if (!jobId) throw new Error("jobId is required");

      const { data: job } = await supabaseClient.from("jobs").select("*, location_coords").eq("id", jobId).single();
      if (!job) throw new Error("Job not found");

      let relevantProviders = null;
      if (job.coordinates?.lat && job.coordinates?.lng) {
        const { data } = await supabaseClient.rpc('get_nearby_providers', {
          job_lat: job.coordinates.lat, job_lng: job.coordinates.lng, category_name: job.category
        });
        relevantProviders = data;
      }

      if (!relevantProviders || relevantProviders.length === 0) {
        const { data } = await supabaseClient.from("provider_profiles").select("*").eq("verification_status", "verified");
        relevantProviders = (data || []).filter((p: any) => 
          p.trade_category?.map((t: string) => t.toLowerCase()).includes(job.category.toLowerCase())
        );
      }

      if (relevantProviders.length > 0 && openRouterKey) {
        const providersText = relevantProviders.slice(0, 10).map((p: any) => 
          `ID: ${p.id}, Bio: ${p.bio}, Rating: ${p.average_rating}`
        ).join("\n");

        const prompt = `Match job "${job.title}" to these providers. Return JSON array: [{ "provider_id": "UUID", "match_score": 0-100, "ai_rationale": "string" }]. Providers:\n${providersText}`;

        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${openRouterKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });

        const aiData = await aiRes.json();
        const matches = JSON.parse(aiData.choices[0].message.content);

        await supabaseClient.from("job_matches").insert(matches.map((m: any) => ({ ...m, job_id: jobId })));
        await supabaseClient.from("jobs").update({ matched_providers_count: matches.length }).eq("id", jobId);
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
