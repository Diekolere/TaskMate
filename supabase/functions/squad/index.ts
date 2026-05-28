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
        headers: { Authorization: `Bearer ${squadApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ virtual_account_number, amount: String(amount) }),
      });

      const resData = await response.json();

      // ── SANDBOX SHORT-CIRCUIT ─────────────────────────────
      // Manually trigger the escrow/ledger logic so the UI updates 
      // immediately without waiting for a real webhook.
      if (resData.success) {
        console.log(`[Simulate] Success! Manually processing ledger for VA: ${virtual_account_number}`);
        
        // Check if this is a Job Escrow VA
        const { data: escrowVA } = await supabaseClient
          .from("job_escrow_vas")
          .select("*")
          .eq("virtual_account_number", virtual_account_number)
          .maybeSingle();

        if (escrowVA) {
          const settledAmount = Number(amount);

          // Write to escrow_ledger
          await supabaseClient.from("escrow_ledger").insert({
            job_id: escrowVA.job_id,
            provider_id: escrowVA.provider_id,
            entry_type: "held",
            gross_amount: settledAmount,
            commission_amount: 0,
            net_amount: settledAmount,
            description: `(SIMULATED) Escrow held for job ${escrowVA.job_id}`
          });

          // Log transaction for history
          await supabaseClient.from("transactions").insert({
            reference: `SIM_${Date.now()}`,
            provider_id: escrowVA.provider_id,
            settled_amount: settledAmount,
            status: "held",
            description: `Payment received in escrow for job ${escrowVA.job_id}`
          });

          // Update Job
          await supabaseClient.from("jobs").update({
            status: "payment_secured",
            escrow_amount: settledAmount,
            escrow_status: "held"
          }).eq("id", escrowVA.job_id);
          
          console.log("[Simulate] Escrow ledger updated manually.");
        }
      }

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
        const customerId = payload.customer_identifier;
        const settledAmount = parseFloat(payload.settled_amount);
        const COMMISSION_RATE = 0.06;

        // ── Path A: Job Escrow VA (new escrow model) ──────────
        const { data: escrowVA } = await supabaseClient
          .from("job_escrow_vas")
          .select("job_id, provider_id")
          .eq("customer_identifier", customerId)
          .maybeSingle();

        if (escrowVA) {
          const { job_id, provider_id } = escrowVA;

          // 1. Write to escrow_ledger
          await supabaseClient.from("escrow_ledger").insert({
            job_id,
            provider_id,
            entry_type: "held",
            gross_amount: settledAmount,
            commission_amount: 0,
            net_amount: settledAmount,
            squad_reference: payload.transaction_reference,
            squad_response: payload,
            description: `Customer payment held in escrow for job ${job_id}`
          });

          // 2. Log in transactions table for visibility
          await supabaseClient.from("transactions").insert({
            reference: payload.transaction_reference,
            provider_id: provider_id,
            settled_amount: settledAmount,
            status: "held",
            squad_response: payload
          });

          // 3. Mark job as payment_secured
          await supabaseClient.from("jobs").update({
            status: "payment_secured",
            escrow_amount: settledAmount,
            escrow_status: "held"
          }).eq("id", job_id);

          console.log(`[Webhook] Escrow held: ₦${settledAmount} for job ${job_id}, provider ${provider_id}`);
          return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // ── Path B: Legacy Provider Static VA (existing model) ─
        const { data: vaRecord } = await supabaseClient
          .from("virtual_accounts")
          .select("provider_id")
          .eq("customer_identifier", customerId)
          .maybeSingle();

        if (vaRecord) {
          const providerId = vaRecord.provider_id;

          const { data: tx } = await supabaseClient.from("transactions").insert({
            reference: payload.transaction_reference,
            provider_id: providerId,
            settled_amount: settledAmount,
            status: "completed",
            squad_response: payload
          }).select().single();

          if (tx) {
            await supabaseClient.from("wallet_ledger").insert({
              provider_id: providerId,
              transaction_id: tx.id,
              entry_type: "credit",
              amount: settledAmount,
              description: `Payment received via VA ${payload.virtual_account_number}`
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // ── 10. CREATE JOB ESCROW VA ─────────────────────────────
    // Creates a job-scoped VA so payment goes to TaskMate (not provider).
    if (action === "create-job-escrow-va") {
      const { jobId, providerId, customerEmail, customerFirstName, customerLastName, customerPhone, amount } = body;

      if (!jobId || !providerId) {
        return new Response(JSON.stringify({ success: false, message: "jobId and providerId are required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Idempotency: return existing VA if one already exists for this job
      const { data: existing } = await supabaseClient
        .from("job_escrow_vas")
        .select("*")
        .eq("job_id", jobId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ success: true, data: existing, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Fetch TaskMate's beneficiary account (required by Squad for settlement)
      const { data: beneficiaryConfig } = await supabaseClient
        .from("payment_config")
        .select("config_value")
        .eq("config_key", "taskmate_beneficiary_account")
        .single();

      const beneficiaryAccount = beneficiaryConfig?.config_value || Deno.env.get("SQUAD_BENEFICIARY_ACCOUNT");

      if (!beneficiaryAccount) {
        return new Response(JSON.stringify({ success: false, message: "Beneficiary account not configured. Set taskmate_beneficiary_account in payment_config." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Create a new static VA via Squad (customer_identifier = jobId for routing)
      const squadPayload = {
        customer_identifier: jobId,
        first_name: customerFirstName || "TaskMate",
        last_name: customerLastName || "Escrow",
        mobile_num: customerPhone || "08012345678",
        email: customerEmail || "escrow@taskmate.ng",
        bvn: "22" + Math.floor(100000000 + Math.random() * 900000000).toString(),
        dob: "01/01/1990",
        address: "1 TaskMate Way, Lagos",
        gender: "1",
        beneficiary_account: beneficiaryAccount  // Required: TaskMate GTBank account
      };

      const response = await fetch(`${squadBaseUrl}/virtual-account`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squadApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(squadPayload)
      });

      const resData = await response.json();
      if (!resData.success) throw new Error(resData.message || "Failed to create job escrow VA");

      // Store in job_escrow_vas — use upsert to handle race conditions gracefully
      // (React StrictMode double-invokes effects; two requests may arrive simultaneously)
      const { error: saveError } = await supabaseClient
        .from("job_escrow_vas")
        .upsert({
          job_id: jobId,
          provider_id: providerId,
          customer_identifier: jobId,
          virtual_account_number: resData.data.virtual_account_number,
          account_name: resData.data.account_name,
          bank_name: resData.data.beneficiary_bank_name || "GTBank",
          squad_response: resData.data
        }, { onConflict: "customer_identifier" });

      if (saveError) throw new Error(saveError.message);

      // Re-fetch the saved row (works whether this was a fresh insert or a no-op)
      const { data: saved } = await supabaseClient
        .from("job_escrow_vas")
        .select("*")
        .eq("job_id", jobId)
        .single();

      return new Response(JSON.stringify({ success: true, data: saved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ── 11. RELEASE ESCROW ───────────────────────────────────
    // Moves funds from escrow into the provider's platform wallet.
    // Called when customer clicks "Release Payment".
    if (action === "release-escrow") {
      const { jobId } = body;

      if (!jobId) {
        return new Response(JSON.stringify({ success: false, message: "jobId is required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`[release-escrow] Attempting release for jobId: ${jobId}`);

      // Find the held escrow entry for this job
      const { data: escrowEntry, error: escrowError } = await supabaseClient
        .from("escrow_ledger")
        .select("*")
        .eq("job_id", jobId)
        .eq("entry_type", "held")
        .maybeSingle();

      if (escrowError) throw escrowError;
      
      if (!escrowEntry) {
        console.error(`[release-escrow] No held entry for ${jobId}. Searching by customer_identifier instead...`);
        // Fallback: check if we can find it via job_escrow_vas
        const { data: va } = await supabaseClient.from("job_escrow_vas").select("job_id").eq("job_id", jobId).maybeSingle();
        if (!va) throw new Error(`Escrow record not found for job ${jobId}`);
      }

      const { provider_id, gross_amount } = escrowEntry;
      const COMMISSION_RATE = 0.06;
      const commission_amount = Math.round(gross_amount * COMMISSION_RATE * 100) / 100;
      const net_amount = gross_amount - commission_amount;

      // Fetch job title
      const { data: jobData } = await supabaseClient.from("jobs").select("title").eq("id", jobId).single();
      const jobTitle = jobData?.title || `Job ${jobId}`;

      // 1. Mark escrow as released
      await supabaseClient.from("escrow_ledger").insert({
        job_id: jobId,
        provider_id,
        entry_type: "released",
        gross_amount,
        commission_amount,
        net_amount,
        description: `Escrow released to provider for ${jobTitle}`
      });

      // 2. Log transaction for history
      await supabaseClient.from("transactions").insert({
        reference: `REL_${jobId}_${Date.now()}`,
        provider_id: provider_id,
        settled_amount: gross_amount,
        status: "completed",
        description: `Payment released from escrow for ${jobTitle}`
      });

      // 3. Credit provider's platform wallet (gross amount first, then debit commission)
      const { data: providerProfile } = await supabaseClient
        .from("provider_profiles")
        .select("wallet_balance")
        .eq("id", provider_id)
        .single();

      let currentBalance = Number(providerProfile?.wallet_balance || 0);
      let newBalance = currentBalance + gross_amount;

      // Log the CREDIT to wallet_ledger (Gross)
      await supabaseClient.from("wallet_ledger").insert({
        provider_id: provider_id,
        amount: gross_amount,
        entry_type: "credit",
        description: `Job Payment: ${jobTitle} (Released from Escrow)`,
        balance_after: newBalance,
        metadata: { job_id: jobId, gross: gross_amount }
      });

      // Deduct Commission
      newBalance = newBalance - commission_amount;

      // Log the COMMISSION (for provider visibility)
      await supabaseClient.from("wallet_ledger").insert({
        provider_id: provider_id,
        amount: -commission_amount,
        entry_type: "debit",
        description: `TaskMate Platform Fee (6%)`,
        balance_after: newBalance,
        metadata: { job_id: jobId, type: 'commission' }
      });

      await supabaseClient
        .from("provider_profiles")
        .update({ wallet_balance: newBalance })
        .eq("id", provider_id);

      // 4. Update job status
      await supabaseClient.from("jobs").update({
        status: "payment_released",
        escrow_status: "released",
        completed_at: new Date().toISOString()
      }).eq("id", jobId);

      console.log(`[release-escrow] ₦${net_amount} released to provider ${provider_id} for ${jobTitle} (Gross: ₦${gross_amount}, Fee: ₦${commission_amount})`);

      return new Response(JSON.stringify({
        success: true,
        message: "Escrow released successfully",
        net_amount,
        commission_amount,
        new_wallet_balance: newBalance
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unsupported action" }), { status: 400, headers: corsHeaders });

  } catch (error: any) {
    console.error("Squad Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: corsHeaders });
  }
});
