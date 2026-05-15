import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.182.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-squad-signature",
};

// ── Helper: Verify Squad Webhook Signature ──────────────────
async function verifyWebhookSignature(payload: any, signature: string, secretKey: string): Promise<boolean> {
  try {
    const signatureString = `${payload.transaction_reference}|${payload.virtual_account_number}|${payload.currency}|${payload.principal_amount}|${payload.settled_amount}|${payload.customer_identifier}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    
    const messageBuffer = encoder.encode(signatureString);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageBuffer);
    
    // Convert to hex string
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    return computedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

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
    const squadMerchantId = Deno.env.get("SQUAD_MERCHANT_ID") || "SQTASKMATE";

    const body = await req.json();
    const { action } = body;

    console.log(`[SQUAD FUNCTION] Received request: Action=${action}`, { body });

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
      console.log("[Squad Function] initiate-payout action triggered");
      const { providerId } = body;
      const amount = Number(body.amount);
      const bankCode = body.bankCode;

      console.log(`[Squad Function] Inputs: providerId=${providerId}, amount=${amount}, bankCode=${bankCode}`);

      if (!amount || isNaN(amount)) {
        console.error("[Squad Function] Invalid amount error");
        return new Response(JSON.stringify({ success: false, message: `Invalid amount: ${body.amount}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      if (!bankCode) {
        console.error("[Squad Function] Missing bank code error");
        return new Response(JSON.stringify({ success: false, message: 'Missing bank code. Please update your payout account.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 1. Check current balance
      console.log("[Squad Function] Fetching provider profile...");
      const { data: provider, error: fetchError } = await supabaseClient
        .from('provider_profiles')
        .select('wallet_balance, account_number, account_name, bank_name')
        .eq('id', providerId)
        .single();

      if (fetchError || !provider) {
        console.error("[Squad Function] Profile fetch error:", fetchError);
        return new Response(JSON.stringify({ success: false, message: 'Could not find provider profile' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const currentBalance = Number(provider.wallet_balance || 0);
      console.log(`[Squad Function] Provider Balance: ${currentBalance}`);

      if (currentBalance < amount) {
        console.error("[Squad Function] Insufficient balance error");
        return new Response(JSON.stringify({ 
          success: false, 
          message: `Insufficient balance. Database has ₦${currentBalance}, you requested ₦${amount}.` 
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (!provider.account_number || !provider.account_name) {
        console.error("[Squad Function] Incomplete bank details error");
        return new Response(JSON.stringify({ success: false, message: "Bank account details are incomplete in your profile." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const reference = `${squadMerchantId}_TM${Date.now()}${Math.floor(Math.random() * 100)}`;

      // 2. Log withdrawal record
      console.log("[Squad Function] Logging withdrawal record...");
      const { data: withdrawal, error: withdrawError } = await supabaseClient
        .from('withdrawals')
        .insert({
          provider_id: providerId,
          amount,
          bank_code: bankCode,
          account_number: provider.account_number,
          account_name: provider.account_name,
          reference,
          status: 'pending',
          metadata: { bank_name: provider.bank_name }
        })
        .select()
        .single();

      if (withdrawError) {
        console.error("[Squad Function] Withdrawal log error:", withdrawError);
        return new Response(JSON.stringify({ success: false, message: "Failed to log withdrawal request." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // 3. Initiate Transfer with Squad
      console.log(`[Squad Function] Payout Request - Base URL: ${squadBaseUrl}`);
      const isSandbox = squadBaseUrl.includes("sandbox") || squadBaseUrl.includes("test");
      let squadResult;

      if (isSandbox) {
        console.log("[Squad Function] SANDBOX MODE DETECTED: Simulating success for testing.");
        // We simulate a successful response so the TaskMate ledger can actually update
        squadResult = {
          status: 200,
          success: true,
          message: "Success (SIMULATED FOR SANDBOX)",
          data: { payout_id: `SIM-${Date.now()}`, reference: reference }
        };
      } else {
        const squadPayload = {
          amount: (Number(amount) * 100).toString(), // Squad expects amount in Kobo
          bank_code: bankCode,
          account_number: provider.account_number,
          account_name: provider.account_name,
          transaction_reference: reference,
          currency_id: 'NGN',
          remark: `TaskMate Withdrawal for ${provider.account_name}`
        };

        try {
          const squadResponse = await fetch(`${squadBaseUrl}/payout/transfer`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${squadApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(squadPayload)
          });

          squadResult = await squadResponse.json();
          console.log("[Squad Function] Squad API Result:", squadResult);
        } catch (err) {
          console.error("[Squad Function] Squad API Execution Error:", err);
          return new Response(JSON.stringify({ success: false, message: "Connection to Squad failed" }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      // 4. Handle Result
      if (squadResult.status === 200 || (isSandbox && squadResult.success)) {
        // 4. Update Ledger (DEBIT)
        const balanceAfter = Number(currentBalance) - Number(amount);
        console.log(`[Squad Function] Updating ledger. Balance After: ${balanceAfter}`);
        
        const { error: ledgerError } = await supabaseClient
          .from('wallet_ledger')
          .insert({
            provider_id: providerId,
            amount: -Number(amount),
            entry_type: 'withdrawal',
            description: `Withdrawal to ${provider.bank_name || 'Bank'} (${provider.account_number})`,
            balance_after: balanceAfter,
            metadata: { 
              withdrawal_id: withdrawal.id, 
              squad_payout_id: squadResult.data?.payout_id, 
              reference: reference,
              simulated: isSandbox
            }
          });

        if (ledgerError) {
            console.error("[Squad Function] Ledger error:", ledgerError);
        }

        // 5. Force update the wallet balance directly
        await supabaseClient
          .from('provider_profiles')
          .update({ wallet_balance: balanceAfter })
          .eq('id', providerId);

        await supabaseClient
          .from('withdrawals')
          .update({ 
            status: 'success', 
            metadata: { ...withdrawal.metadata, squad_payout_id: squadResult.data?.payout_id, squad_response: squadResult, simulated: isSandbox } 
          })
          .eq('id', withdrawal.id);

        return new Response(JSON.stringify({ 
          success: true, 
          message: isSandbox ? "Withdrawal simulated successfully" : "Withdrawal initiated successfully", 
          data: squadResult.data,
          newBalance: balanceAfter
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        console.error("[Squad Function] Squad API Rejection:", squadResult);
        await supabaseClient.from('withdrawals').update({ 
          status: 'failed',
          metadata: { ...withdrawal.metadata, squad_response: squadResult }
        }).eq('id', withdrawal.id);
        
        return new Response(JSON.stringify({ success: false, message: squadResult.message || "Squad API error" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // ── 3. PAYOUT RE-QUERY ──────────────────────────────────
    if (action === "payout-requery") {
      const { transaction_reference } = body;

      const response = await fetch(`${squadBaseUrl}/payout/requery`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transaction_reference })
      });

      const data = await response.json();

      // If status changed to success/failed, update our records
      if (data.success && data.data) {
        const squadStatus = data.data.status; // success, failed, reversed, pending
        
        await supabaseClient
          .from("withdrawals")
          .update({ status: squadStatus, metadata: data })
          .eq("reference", transaction_reference);

        // If it failed/reversed, we should CREDIT the wallet back
        if (squadStatus === "failed" || squadStatus === "reversed") {
          // Logic for reversal would go here
        }
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 4. INITIALIZE PAYMENT (Checkout) ────────────────────
    if (action === "initialize-payment") {
      const { jobId, amount, customerEmail } = body;
      const transactionRef = `TM_CHK_${jobId}_${Date.now()}`;

      const response = await fetch(`${squadBaseUrl}/transaction/initiate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Squad expects kobo
          email: customerEmail,
          currency: "NGN",
          initiate_type: "inline",
          transaction_ref: transactionRef,
          callback_url: `${req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL") || "https://localhost:5173"}/payment-callback`
        })
      });

      const resData = await response.json();
      if (!resData.success) throw new Error(resData.message || "Failed to initiate payment");

      return new Response(JSON.stringify({ 
          paymentUrl: resData.data.checkout_url,
          transactionRef 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 5. GENERATE DYNAMIC VIRTUAL ACCOUNT ──────────────────
    if (action === "generate-dynamic-virtual-account") {
      const { amount, email, firstName, lastName, phone } = body;
      
      const response = await fetch(`${squadBaseUrl}/virtual-account/business/customer/generate-dynamic`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          email: email,
          first_name: firstName || "Customer",
          last_name: lastName || "TaskMate",
          phone: phone || "0000000000",
          account_name: "TaskMate Payment"
        })
      });

      const resData = await response.json();
      if (!resData.success) throw new Error(resData.message || "Failed to generate virtual account");

      return new Response(JSON.stringify(resData.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 6. VERIFY PAYMENT ───────────────────────────────────
    if (action === "verify-payment") {
        const { transactionRef } = body;
        const response = await fetch(`${squadBaseUrl}/transaction/verify/${transactionRef}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${squadApiKey}`,
                "Content-Type": "application/json"
            }
        });
        const resData = await response.json();
        return new Response(JSON.stringify(resData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // ── 7. SIMULATE VIRTUAL ACCOUNT PAYMENT (Sandbox Only) ──
    if (action === "simulate-va-payment") {
      const { virtual_account_number, amount } = body;
      
      const response = await fetch(`${squadBaseUrl}/virtual-account/simulate/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${squadApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          virtual_account_number,
          amount: String(amount),
        }),
      });

      const resData = await response.json();
      return new Response(JSON.stringify(resData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    // ── 8. CREATE STATIC VIRTUAL ACCOUNT ──────────────────────
    if (action === "create-static-virtual-account") {
      const { providerId, providerEmail, providerFirstName, providerLastName, providerPhone } = body;

      // Check if VA already exists for this provider
      const { data: existingVA } = await supabaseClient
        .from("virtual_accounts")
        .select("*")
        .eq("provider_id", providerId)
        .single();

      if (existingVA) {
        return new Response(JSON.stringify({
          success: true,
          message: "VA already exists",
          data: existingVA
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Create static VA via Squad API
      const response = await fetch(`${squadBaseUrl}/virtual-account`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer_identifier: providerId,
          first_name: providerFirstName || "Provider",
          last_name: providerLastName || "",
          mobile_num: providerPhone || "08012345678",
          email: providerEmail,
          bvn: "22" + Math.floor(100000000 + Math.random() * 900000000).toString(),
          dob: "01/01/1990",
          address: "123 TaskMate Street, Lagos",
          gender: "1"
        })
      });

      const resData = await response.json();
      if (!resData.success) throw new Error(resData.message || "Squad VA creation failed");

      // Store in database
      await supabaseClient
        .from("virtual_accounts")
        .insert({
          provider_id: providerId,
          customer_identifier: providerId,
          virtual_account_number: resData.data.virtual_account_number,
          account_name: resData.data.account_name,
          squad_response: resData.data
        });

      return new Response(JSON.stringify(resData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 9. SQUAD WEBHOOK ─────────────────────────────────────
    if (action === "webhook") {
      const payload = body;
      const signature = req.headers.get("x-squad-signature");
      const squadSecretKey = Deno.env.get("SQUAD_SECRET_KEY");

      // Log webhook
      await supabaseClient.from("webhook_logs").insert({
        event_type: payload.event_type || "unknown",
        payload: payload,
        headers: { "x-squad-signature": signature }
      });

      // VERIFY SIGNATURE
      if (signature && squadSecretKey) {
        const isValid = await verifyWebhookSignature(payload, signature, squadSecretKey);
        if (!isValid) return new Response(JSON.stringify({ success: false, message: "Invalid signature" }), { status: 401, headers: corsHeaders });
      }

      // Process based on event type
      if (payload.event_type === "virtual-account.incoming_transfer") {
        // Find provider
        const { data: vaRecord } = await supabaseClient
          .from("virtual_accounts")
          .select("provider_id")
          .eq("customer_identifier", payload.customer_identifier)
          .single();

        if (vaRecord) {
          const providerId = vaRecord.provider_id;
          const amount = parseFloat(payload.settled_amount);

          // Create transaction & ledger entry
          const { data: tx } = await supabaseClient.from("transactions").insert({
            reference: payload.transaction_reference,
            provider_id: providerId,
            settled_amount: amount,
            status: "completed",
            squad_response: payload
          }).select().single();

          if (tx) {
            await supabaseClient.from("wallet_ledger").insert({
              provider_id: providerId,
              transaction_id: tx.id,
              entry_type: "credit",
              amount: amount,
              description: `Payment received via VA ${payload.virtual_account_number}`
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    console.error("Squad Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});
