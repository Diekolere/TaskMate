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
    const { action } = body;

    // Log the request
    await supabaseClient.from("edge_function_logs").insert({
      function_name: "ai",
      status: "success",
      metadata: { action }
    });

    if (action === "check-image-sensitivity") {
      const { base64Image, mimeType } = body;
      if (!base64Image) throw new Error("base64Image is required");

      const sightUser = Deno.env.get("SIGHTENGINE_API_USER");
      const sightSecret = Deno.env.get("SIGHTENGINE_API_SECRET");

      if (!sightUser || !sightSecret) {
        console.warn("Sightengine keys missing, falling back to PASS");
        return new Response(JSON.stringify({ success: true, is_safe: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Convert base64 to binary for Sightengine
      const binary = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
      const blob = new Blob([binary], { type: mimeType || "image/jpeg" });
      
      const formData = new FormData();
      formData.append("media", blob);
      formData.append("models", "nudity-2.1,wad,offensive,text-content,qr-code");
      formData.append("api_user", sightUser);
      formData.append("api_secret", sightSecret);

      const response = await fetch("https://api.sightengine.com/1.0/check.json", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Sightengine API Error");

      // Logic to determine safety
      const isUnsafe = 
        data.nudity?.safe < 0.5 || 
        data.weapon > 0.5 || 
        data.alcohol > 0.5 || 
        data.drugs > 0.5 ||
        data.offensive?.prob > 0.7;

      return new Response(JSON.stringify({ 
        success: true, 
        is_safe: !isUnsafe, 
        reason: isUnsafe ? "Image violates our community safety standards." : "" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "enhance-description") {
      const { title, description, category, urgency } = body;
      
      const prompt = `You are a professional task estimator and description writer for a service marketplace called TaskMate in Nigeria (currency: NGN).
I have a job request from a customer.
Title: ${title}
Description: ${description || "None provided"}
Category: ${category}
Urgency: ${urgency}

1. Write a clear, professional, and detailed "Enhanced Description" that a service provider will understand easily. Include what needs to be done, materials likely needed, and specific questions the provider might ask.
2. Estimate a fair market price (in NGN, numbers only, no commas) for this job.

Format your output EXACTLY as a JSON object:
{
  "enhanced_description": "...",
  "suggested_price": 5000
}
Do not include markdown blocks, just the JSON.`;

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
      
      // Clean up markdown block if Gemini adds it
      textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(textOutput);

      return new Response(JSON.stringify({ 
        success: true, 
        enhanced_description: parsed.enhanced_description,
        suggested_price: parsed.suggested_price
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "check-sensitivity") {
      const { text } = body;
      
      const prompt = `You are an AI content moderator. Analyze the following text and determine if it is safe for a public marketplace.
Check for: explicit content, violence, hate speech, or sharing sensitive personal information (like full credit card numbers).
Text: "${text}"

Respond with ONLY a JSON object:
{
  "is_safe": true/false,
  "reason": "Explain briefly if false, otherwise empty string"
}`;

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
      const parsed = JSON.parse(textOutput);

      return new Response(JSON.stringify({ success: true, ...parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("AI Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
