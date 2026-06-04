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

    const body = await req.json();
    console.log("Received webhook payload:", body);

    // Only process UPDATE events
    if (body.type !== "UPDATE") {
      return new Response(JSON.stringify({ success: true, message: "Ignored non-UPDATE event" }), { headers: corsHeaders });
    }

    const oldRecord = body.old_record || {};
    const newRecord = body.record || {};

    // Check if the provider just became verified
    if (oldRecord.verification_status !== "verified" && newRecord.verification_status === "verified") {
      const providerId = newRecord.id;
      const tradeCategories = newRecord.trade_category || [];

      if (!tradeCategories || tradeCategories.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "Provider has no trade categories, nothing to match." }), { headers: corsHeaders });
      }

      // Fetch all open public jobs that match any of the provider's trade categories
      const { data: openJobs, error: jobsError } = await supabaseClient
        .from("jobs")
        .select("id, category")
        .eq("status", "open")
        .eq("request_type", "public");

      if (jobsError) throw jobsError;

      if (!openJobs || openJobs.length === 0) {
         return new Response(JSON.stringify({ success: true, message: "No open public jobs found." }), { headers: corsHeaders });
      }

      // Filter jobs where the job category is in the provider's trade categories
      const matchingJobs = openJobs.filter(job => 
        job.category && tradeCategories.map((t: string) => t.toLowerCase()).includes(job.category.toLowerCase())
      );

      console.log(`Found ${matchingJobs.length} open jobs matching provider's categories.`);

      // For each matching job, invoke the matching edge function to re-evaluate it
      // Since we updated matching to use upsert, this is safe and will just refresh matches.
      for (const job of matchingJobs) {
        try {
          console.log(`Invoking auto-match for job ID: ${job.id}`);
          await supabaseClient.functions.invoke('matching', {
            body: { action: 'auto-match', jobId: job.id }
          });
        } catch (err) {
          console.error(`Failed to invoke matching for job ${job.id}:`, err);
        }
      }

      return new Response(JSON.stringify({ success: true, matches_triggered: matchingJobs.length }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, message: "Provider was not just verified. Ignored." }), { headers: corsHeaders });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
