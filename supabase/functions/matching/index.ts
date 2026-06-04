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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

      if (relevantProviders.length > 0) {
        const finalMatches = relevantProviders.slice(0, 10).map((p: any) => {
          // Proximity Score (0 to 100), closer is better. Max 50km
          const distKm = (p.distance_meters || 0) / 1000;
          const proximityScore = Math.max(0, 100 - (distKm * 2)); // 0km = 100, 50km = 0

          // Rating Score (0 to 100)
          const ratingScore = ((p.average_rating || 0) / 5) * 100;

          // Completion Score (0 to 100), cap at 50 jobs for 100 points
          const completionScore = Math.min(100, ((p.completed_jobs_count || 0) / 50) * 100);

          // Blended Score without AI
          const finalScore = Math.round(
            (proximityScore * 0.4) +
            (ratingScore * 0.4) +
            (completionScore * 0.2)
          );

          return {
            job_id: jobId,
            provider_id: p.id,
            match_score: finalScore,
            ai_rationale: 'Matched based on skills, location, and rating.'
          };
        }).filter(Boolean);

        if (finalMatches.length > 0) {
          // Upsert Matches
          await supabaseClient.from("job_matches").upsert(finalMatches, { onConflict: 'job_id,provider_id' });
          await supabaseClient.from("jobs").update({ matched_providers_count: finalMatches.length }).eq("id", jobId);

          // Trigger In-App Notifications
          const notifications = finalMatches.map((m: any) => ({
            user_id: m.provider_id,
            type: 'system',
            title: 'New AI Matched Job',
            body: `AI found a new ${job.category} job that matches your expertise!`,
            icon: 'auto_awesome',
            icon_bg: 'bg-purple-100',
            icon_color: 'text-purple-600',
            cta_path: `/provider/requests/${jobId}`,
            is_read: false
          }));

          await supabaseClient.from("notifications").insert(notifications);
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
