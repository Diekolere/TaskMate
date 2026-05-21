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
    const { action } = body;

    // Log the request
    await supabaseClient.from("edge_function_logs").insert({
      function_name: "ai",
      status: "success",
      metadata: { action }
    });

    // Helper for OpenRouter calls
    const callAI = async (messages: any[], jsonMode = false) => {
      if (!openRouterKey) throw new Error("OPENROUTER_API_KEY is missing");
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://taskmate.ng", // Required by OpenRouter
          "X-Title": "TaskMate"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          response_format: jsonMode ? { type: "json_object" } : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenRouter API Error");
      return data.choices[0].message.content;
    };

    if (action === "check-image-sensitivity") {
      const { base64Image, mimeType } = body;
      // Using Sightengine as primary for speed, falling back to AI if needed
      const sightUser = Deno.env.get("SIGHTENGINE_API_USER");
      const sightSecret = Deno.env.get("SIGHTENGINE_API_SECRET");

      if (sightUser && sightSecret) {
        try {
          const binary = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));
          const formData = new FormData();
          formData.append("media", new Blob([binary], { type: mimeType || "image/jpeg" }));
          formData.append("models", "nudity-2.1,wad,offensive,scam");
          formData.append("api_user", sightUser);
          formData.append("api_secret", sightSecret);

          const seRes = await fetch("https://api.sightengine.com/1.0/check.json", { method: "POST", body: formData });
          const seData = await seRes.json();
          const isUnsafe = seData.nudity?.safe < 0.5 || seData.offensive?.prob > 0.7 || seData.scam?.prob > 0.7;
          
          return new Response(JSON.stringify({ success: true, is_safe: !isUnsafe }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (e) { console.error("Sightengine fail", e); }
      }
      return new Response(JSON.stringify({ success: true, is_safe: true }), { headers: corsHeaders });
    }

    if (action === "enhance-description") {
      const { title, description, category, urgency } = body;
      try {
        const prompt = `Task: You are an editor for TaskMate. Your job is to improve the grammar, spelling, and clarity of the user's task description.
        CRITICAL RULES:
        1. DO NOT add any new details, assumptions, or tools that the user did not explicitly mention.
        2. Keep it natural and sounding like a real human wrote it.
        3. Just fix typos and improve sentence structure.
        
        Data: Title: ${title}, Desc: ${description}, Category: ${category}, Urgency: ${urgency}.
        Return JSON ONLY: { "enhanced_description": "string", "suggested_price": number }`;
        
        const result = await callAI([{ role: "user", content: prompt }], true);
        return new Response(JSON.stringify({ success: true, ...JSON.parse(result) }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, enhanced_description: description || title, suggested_price: 0 }), { headers: corsHeaders });
      }
    }

    if (action === "chat") {
      const { systemPrompt, userMessage, history } = body;
      try {
        const messages = [];
        if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
        if (history) {
            history.forEach((h: any) => {
                messages.push({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text });
            });
        }
        messages.push({ role: "user", content: userMessage });

        const reply = await callAI(messages);
        return new Response(JSON.stringify({ success: true, reply }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: true, reply: "I'm experiencing a temporary connection issue. How else can I assist you?" }), { headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});
