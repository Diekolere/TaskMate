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

    const dojahApiKey = Deno.env.get("DOJAH_API_KEY")?.trim();
    const dojahAppId = Deno.env.get("DOJAH_APP_ID")?.trim();
    const dojahBaseUrl = (Deno.env.get("DOJAH_BASE_URL") || "https://sandbox.dojah.io").trim();

    const body = await req.json();
    const { action } = body;

    // ── 1. VERIFY IDENTITY (BVN/NIN via Dojah) ──────────────
    if (action === "verify-identity") {
      const { type, value, providerId } = body; // type: 'bvn' | 'nin'
      
      const endpoint = type === 'bvn' 
        ? `${dojahBaseUrl}/api/v1/kyc/bvn/full?bvn=${value}`
        : `${dojahBaseUrl}/api/v1/kyc/nin?nin=${value}`;

      console.log(`Dojah Request [${type}]:`, endpoint);
      console.log(`Dojah Auth: AppId=${dojahAppId} (trimmed), Key=${dojahApiKey?.substring(0, 8)}...`);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": dojahApiKey ?? "",
          "AppId": dojahAppId ?? "",
          "Content-Type": "application/json",
          "User-Agent": "TaskMate-App/1.0"
        }
      });

      const data = await response.json();
      console.log(`Dojah Response [${type}]:`, JSON.stringify(data));
      
      // If verification is successful (Dojah usually returns data.entity)
      if (response.ok && data.entity) {
          console.log(`Verification success for provider ${providerId}`);
          await supabaseClient.from("provider_profiles").update({
              [`${type}_verified`]: true,
              metadata: { dojah_data: data.entity }
          }).eq("id", providerId);
      } else {
          console.error(`Verification failed or entity missing:`, data.error || data);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 3. INTEGRATED VERIFICATION (ID + Selfie) ───────────
    if (action === "verify-with-selfie") {
      const { type, value, selfie_image, providerId } = body;
      
      const endpoint = type === 'bvn'
        ? `${dojahBaseUrl}/api/v1/kyc/bvn/verify`
        : `${dojahBaseUrl}/api/v1/kyc/nin/verify`;

      console.log(`Dojah Integrated Verify [${type}]:`, endpoint);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": dojahApiKey ?? "",
          "AppId": dojahAppId ?? "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
            [type]: value,
            selfie_image: selfie_image // Frontend handles base64 cleaning
        })
      });

      const data = await response.json();
      console.log(`Dojah Integrated Response:`, JSON.stringify(data));
      
      // Dojah integrated verify returns confidence in data.entity.selfie_verification
      const isMatch = data.entity?.selfie_verification?.match || data.entity?.selfie_verification?.confidence_value >= 90;

      if (response.ok && isMatch) {
          console.log(`Integrated verification SUCCESS for provider ${providerId}`);
          await supabaseClient.from("provider_profiles").update({
              [`${type}_verified`]: true,
              kyc_completed: true,
              verification_status: "verified",
              is_verified: true,
              metadata: { dojah_data: data.entity }
          }).eq("id", providerId);
          
          await supabaseClient.from("profiles").update({ is_active: true }).eq("id", providerId);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});
