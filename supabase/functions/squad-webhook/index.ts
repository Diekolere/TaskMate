import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.182.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-squad-signature",
};

// ── Helper: Verify Squad Webhook Signature ──────────────────
async function verifyWebhookSignature(rawBody: string, signature: string, secretKey: string, payload: any): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    // Method 1: HMAC-SHA512 of Raw Body (Standard Squad)
    const bodyBuffer = encoder.encode(rawBody);
    const bodySigBuffer = await crypto.subtle.sign("HMAC", key, bodyBuffer);
    const bodySignature = Array.from(new Uint8Array(bodySigBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Method 2: Piped string format (Older Squad)
    const pipedString = `${payload.transaction_reference}|${payload.virtual_account_number}|${payload.currency}|${payload.principal_amount}|${payload.settled_amount}|${payload.customer_identifier}`;
    const pipedBuffer = encoder.encode(pipedString);
    const pipedSigBuffer = await crypto.subtle.sign("HMAC", key, pipedBuffer);
    const pipedSignature = Array.from(new Uint8Array(pipedSigBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    console.log(`[SIG] Received: ${signature}`);
    console.log(`[SIG] Raw Body Calculated: ${bodySignature}`);
    console.log(`[SIG] Piped Calculated: ${pipedSignature}`);

    return bodySignature === signature || pipedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Allow manual testing via browser (GET)
  if (req.method === "GET") {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    await supabaseClient.from("webhook_logs").insert({
      event_type: "manual_test",
      payload: { info: "Manual test from browser" },
      signature_valid: true,
      processed: true
    });
    return new Response("Webhook function is active and logging!", { status: 200 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Webhook hit! Method:", req.method);
    
    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
      console.log("Payload received:", JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to parse webhook JSON:", e);
      // Log the failure
      await supabaseClient.from("webhook_logs").insert({
        event_type: "parse_error",
        payload: { error: "Invalid JSON", raw: rawBody },
        signature_valid: false,
        processed: false
      });
      throw new Error("Invalid JSON payload");
    }

    const signature = req.headers.get("x-squad-signature");
    const squadSecretKey = Deno.env.get("SQUAD_SECRET_KEY") || Deno.env.get("SQUAD_API_KEY");

    console.log(`Debug - Signature present: ${!!signature}, Secret Key present: ${!!squadSecretKey}`);

    // VERIFY WEBHOOK SIGNATURE
    if (!signature || !squadSecretKey) {
      const missing = !signature ? "Signature Header" : "SQUAD_SECRET_KEY/SQUAD_API_KEY";
      console.warn(`Webhook blocked: Missing ${missing}`);
      
      return new Response(JSON.stringify({
        success: false,
        message: `Authentication failed: Missing ${missing}`
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const isValidSignature = await verifyWebhookSignature(rawBody, signature, squadSecretKey, payload);

    if (!isValidSignature) {
      console.warn("Invalid webhook signature");
      // Update log as invalid
      await supabaseClient
        .from("webhook_logs")
        .update({ signature_valid: false })
        .match({ payload });

      return new Response(JSON.stringify({
        success: false,
        message: "Invalid signature"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // SIGNATURE VALID - Process based on event type
    const eventType = payload.event || payload.event_type;
    console.log(`Processing event: ${eventType}`);

    // ── CASE 1: INCOMING TRANSFER (PAYMENT IN) ──────────────────
    if (eventType === "virtual-account.incoming_transfer" || !eventType) {
      // Check for IDEMPOTENCY
      const { data: existingTransaction } = await supabaseClient
        .from("transactions")
        .select("id")
        .eq("reference", payload.transaction_reference)
        .single();

      if (existingTransaction) {
        return new Response(JSON.stringify({ success: true, message: "Transaction already processed" }), { headers: corsHeaders });
      }

      const { data: vaRecord } = await supabaseClient
        .from("virtual_accounts")
        .select("provider_id")
        .eq("customer_identifier", payload.customer_identifier)
        .single();

      if (!vaRecord) throw new Error(`No VA found for customer: ${payload.customer_identifier}`);

      const providerId = vaRecord.provider_id;
      const settledAmount = parseFloat(payload.settled_amount);

      const { data: tx, error: txError } = await supabaseClient.from("transactions").insert({
        reference: payload.transaction_reference,
        provider_id: providerId,
        virtual_account_number: payload.virtual_account_number,
        principal_amount: parseFloat(payload.principal_amount),
        settled_amount: settledAmount,
        currency: payload.currency,
        channel: payload.channel,
        squad_response: payload,
        status: "completed"
      }).select("id").single();

      if (txError) throw txError;

      const { data: profile } = await supabaseClient.from("provider_profiles").select("wallet_balance").eq("id", providerId).single();
      const newBalance = (profile?.wallet_balance || 0) + settledAmount;

      await supabaseClient.from("wallet_ledger").insert({
        provider_id: providerId,
        transaction_id: tx.id,
        entry_type: "credit",
        amount: settledAmount,
        description: `Payment from ${payload.sender_name || "Customer"}`,
        balance_after: newBalance
      });

      return new Response(JSON.stringify({ success: true, message: "Credit processed" }), { headers: corsHeaders });
    }

    // ── CASE 2: PAYOUT FAILURE (WITHDRAWAL FAILED) ───────────────
    if (eventType === "payout.failed" || eventType === "payout.reversed") {
      const reference = payload.transaction_reference || payload.reference;
      
      // 1. Find the original withdrawal
      const { data: withdrawal, error: wError } = await supabaseClient
        .from("withdrawals")
        .select("*")
        .eq("reference", reference)
        .single();

      if (wError || !withdrawal) {
        console.warn(`No withdrawal found for reference: ${reference}`);
        return new Response(JSON.stringify({ success: true, message: "Failure event ignored (no record)" }), { headers: corsHeaders });
      }

      if (withdrawal.status === "failed") {
        return new Response(JSON.stringify({ success: true, message: "Already marked as failed" }), { headers: corsHeaders });
      }

      // 2. Update withdrawal status
      await supabaseClient.from("withdrawals").update({ 
        status: "failed", 
        metadata: { ...withdrawal.metadata, failure_event: payload } 
      }).eq("id", withdrawal.id);

      // 3. REFUND THE WALLET (Credit it back)
      const { data: profile } = await supabaseClient.from("provider_profiles").select("wallet_balance").eq("id", withdrawal.provider_id).single();
      const refundAmount = Number(withdrawal.amount);
      const newBalance = (profile?.wallet_balance || 0) + refundAmount;

      await supabaseClient.from("wallet_ledger").insert({
        provider_id: withdrawal.provider_id,
        entry_type: "credit", // Refunding is a credit
        amount: refundAmount,
        description: `Refund: Withdrawal to ${withdrawal.bank_code} failed`,
        metadata: { original_withdrawal_id: withdrawal.id, reason: payload.reason || "Bank rejection" },
        balance_after: newBalance
      });

      console.log(`Successfully refunded ₦${refundAmount} to provider ${withdrawal.provider_id}`);
      return new Response(JSON.stringify({ success: true, message: "Refund processed successfully" }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, message: "Event ignored" }), { headers: corsHeaders });

  } catch (error) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 200, headers: corsHeaders });
  }
});
