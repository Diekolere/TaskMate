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

    const body = await req.json();
    const { action } = body;

    await supabaseClient.from("edge_function_logs").insert({
      function_name: "moderation",
      status: "success",
      metadata: { action }
    });

    // ── 1. MODERATE TEXT ───────────────────────────────────
    if (action === "check-text") {
      const { text, context } = body;
      if (!text) throw new Error("text is required");

      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiKey) {
        // If no API key, allow through
        return new Response(JSON.stringify({ success: true, is_safe: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const prompt = `You are a content moderator for TaskMate, a service marketplace in Nigeria.
Context: ${context || "User-generated content"}
Text: "${text}"

Check for: explicit/sexual content, violence, hate speech, scams, sharing of sensitive personal data (credit card numbers, passwords), or spam.

Respond with ONLY a JSON object:
{
  "is_safe": true/false,
  "reason": "Brief explanation if unsafe, empty string if safe",
  "severity": "none" | "low" | "medium" | "high"
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
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
      const parsed = JSON.parse(textOutput);

      return new Response(JSON.stringify({ success: true, ...parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 2. MODERATE IMAGE (via Sightengine) ────────────────
    if (action === "check-image") {
      const { imageUrl } = body;
      if (!imageUrl) throw new Error("imageUrl is required");

      const sightUser = Deno.env.get("SIGHTENGINE_API_USER");
      const sightSecret = Deno.env.get("SIGHTENGINE_API_SECRET");

      if (!sightUser || !sightSecret) {
        return new Response(JSON.stringify({ success: true, is_safe: true, reason: "Moderation keys not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const seRes = await fetch(
        `https://api.sightengine.com/1.0/check.json?url=${encodeURIComponent(imageUrl)}&models=nudity-2.1,wad,offensive,scam&api_user=${sightUser}&api_secret=${sightSecret}`
      );
      const seData = await seRes.json();

      const isUnsafe =
        seData.nudity?.safe < 0.5 ||
        seData.weapon > 0.5 ||
        seData.alcohol > 0.5 ||
        seData.drugs > 0.5 ||
        seData.offensive?.prob > 0.7 ||
        seData.scam?.prob > 0.7;

      return new Response(JSON.stringify({
        success: true,
        is_safe: !isUnsafe,
        reason: isUnsafe ? "Image violates community safety standards." : "",
        details: { nudity: seData.nudity?.safe, scam: seData.scam?.prob }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action: " + action }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Moderation Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
