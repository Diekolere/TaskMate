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
    const { action } = body;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    // ── 1. SEND IN-APP NOTIFICATION ────────────────────────
    if (action === "send") {
      const { userId, title, body: notifBody, type, icon, iconBg, iconColor, ctaPath, ctaLabel, secondaryLabel } = body;
      if (!userId || !title) throw new Error("userId and title are required");

      const { error } = await supabaseClient.from("notifications").insert({
        user_id: userId,
        title,
        body: notifBody || "",
        type: type || "system",
        icon: icon || "info",
        icon_bg: iconBg || "bg-gray-100",
        icon_color: iconColor || "text-gray-400",
        cta_path: ctaPath || null,
        cta_label: ctaLabel || null,
        secondary_label: secondaryLabel || "Later"
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, message: "Notification sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 2. SEND BULK NOTIFICATIONS ─────────────────────────
    if (action === "send-bulk") {
      const { userIds, title, body: notifBody, type, icon, iconBg, iconColor, ctaPath, ctaLabel, secondaryLabel } = body;
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("userIds array is required");
      }

      const notifications = userIds.map((uid: string) => ({
        user_id: uid,
        title,
        body: notifBody || "",
        type: type || "system",
        icon: icon || "info",
        icon_bg: iconBg || "bg-gray-100",
        icon_color: iconColor || "text-gray-400",
        cta_path: ctaPath || null,
        cta_label: ctaLabel || null,
        secondary_label: secondaryLabel || "Later"
      }));

      const { error } = await supabaseClient.from("notifications").insert(notifications);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, sent: userIds.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 3. MARK ALL READ ───────────────────────────────────
    if (action === "mark-all-read") {
      const { userId } = body;
      if (!userId) throw new Error("userId is required");

      if (user.id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error } = await supabaseClient
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 4. GET NOTIFICATION PREFERENCES ────────────────────
    if (action === "get-preferences") {
      const { userId } = body;
      if (!userId) throw new Error("userId is required");

      if (user.id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data, error } = await supabaseClient
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      // Return defaults if no preferences exist
      const prefs = data || {
        email_on_interest: true,
        email_on_message: true,
        email_on_match: true,
        push_on_message: true,
        digest_frequency: "immediate"
      };

      return new Response(JSON.stringify({ success: true, preferences: prefs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action: " + action }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Notifications Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
