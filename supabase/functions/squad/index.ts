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

    const squadApiKey = Deno.env.get("SQUAD_API_KEY");
    const squadBaseUrl = Deno.env.get("SQUAD_BASE_URL") || "https://sandbox-api-d.squadco.com";

    const body = await req.json();
    const { action } = body;

    // ── 1. ACCOUNT LOOKUP (Verify Bank Details) ──────────────
    if (action === "account-lookup") {
      const { bankCode, accountNumber } = body;
      
      const response = await fetch(`${squadBaseUrl}/payout/account/lookup`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber })
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 2. FUND TRANSFER (Payouts) ───────────────────────────
    if (action === "initiate-payout") {
      const { bankCode, accountNumber, amount, accountName, remark } = body;
      
      // Format reference: MERCHANT_ID_TIMESTAMP
      const merchantId = Deno.env.get("SQUAD_MERCHANT_ID") || "TASKMATE";
      const transactionRef = `${merchantId}_${Date.now()}`;

      const response = await fetch(`${squadBaseUrl}/payout/transfer`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
          amount: amount.toString(),
          account_name: accountName,
          transaction_reference: transactionRef,
          currency_id: "NGN",
          remark: remark || "TaskMate Payout"
        })
      });

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 3. RE-QUERY TRANSFER ────────────────────────────────
    if (action === "requery-transfer") {
      const { transactionRef } = body;
      const response = await fetch(`${squadBaseUrl}/payout/requery`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transaction_reference: transactionRef })
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 4. SQUAD WEBHOOK (Standard Charges) ──────────────────
    if (action === "webhook") {
        // ... existing webhook logic for charge.completed ...
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});
