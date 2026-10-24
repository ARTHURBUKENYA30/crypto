import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This endpoint is intentionally sandbox-only. It creates a Flutterwave test
// charge for QA; it never credits a wallet or writes a ledger entry.
const allowedOrigins = new Set([
  "https://crypto-ten-liart.vercel.app",
  "http://localhost:5173",
]);
const MAX_AMOUNT_UGX = 500_000;
const MIN_AMOUNT_UGX = 1_000;

function corsHeaders(origin: string | null): Record<string, string> {
  const resolvedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : "https://crypto-ten-liart.vercel.app";
  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isAllowedSandboxRedirect(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "ravemodal-dev.herokuapp.com" ||
      url.hostname === "flutterwave.com" ||
      url.hostname.endsWith(".flutterwave.com")
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: "origin_not_allowed" }, 403, null);
  }
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, origin);
  }

  const authorization = req.headers.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse({ error: "authentication_required" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "backend_configuration_missing" }, 503, origin);
  }

  // Refuse all production keys. This adapter is for sandbox QA only.
  const flutterwaveSecret = Deno.env.get("FLW_SECRET_KEY") || "";
  if (Deno.env.get("FLW_ENVIRONMENT") !== "sandbox" ||
      !flutterwaveSecret.startsWith("FLWSECK_TEST-")) {
    return jsonResponse({
      error: "sandbox_provider_not_configured",
      message: "A Flutterwave sandbox secret is required. No payment was initiated.",
    }, 503, origin);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user || !user.email) {
      return jsonResponse({ error: "valid_account_email_required" }, 401, origin);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "invalid_request_body" }, 400, origin);
    }

    const amount = Number(body.amount);
    const network = body.network;
    const phone = String(body.phoneNumber || "").replace(/[\s()-]/g, "");
    if (!Number.isSafeInteger(amount) || amount < MIN_AMOUNT_UGX || amount > MAX_AMOUNT_UGX) {
      return jsonResponse({
        error: "invalid_amount",
        message: `Sandbox amount must be between ${MIN_AMOUNT_UGX} and ${MAX_AMOUNT_UGX} UGX.`,
      }, 400, origin);
    }
    if (network !== "MTN" && network !== "AIRTEL") {
      return jsonResponse({ error: "unsupported_network" }, 400, origin);
    }
    if (!/^\+?[0-9]{9,13}$/.test(phone)) {
      return jsonResponse({ error: "invalid_phone_number" }, 400, origin);
    }

    const txRef = `groearnx-sandbox-${crypto.randomUUID()}`;
    const providerResponse = await fetch(
      "https://api.flutterwave.com/v3/charges?type=mobile_money_uganda",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${flutterwaveSecret}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "UGX",
          email: user.email,
          tx_ref: txRef,
          phone_number: phone,
          network,
          redirect_url: "https://crypto-ten-liart.vercel.app/",
          meta: { app: "GROEarnX", environment: "sandbox", user_id: user.id },
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!providerResponse.ok) {
      // Do not return provider response bodies: they may contain sensitive data.
      return jsonResponse({
        error: "sandbox_provider_request_failed",
        message: "Flutterwave sandbox did not accept the test request. No wallet balance was changed.",
      }, 502, origin);
    }

    const result = await providerResponse.json().catch(() => null);
    const redirect = result?.data?.meta?.authorization?.redirect;
    if (result?.status !== "success" || !isAllowedSandboxRedirect(redirect)) {
      return jsonResponse({
        error: "sandbox_authorization_unavailable",
        message: "No valid sandbox authorization link was returned. No wallet balance was changed.",
      }, 502, origin);
    }

    return jsonResponse({
      status: "sandbox_intent_created",
      txRef,
      authorizationUrl: redirect,
      currency: "UGX",
      amount,
      environment: "sandbox",
      notice: "Test only. This does not credit a wallet, settle funds, or create a ledger entry.",
    }, 200, origin);
  } catch {
    return jsonResponse({
      error: "sandbox_request_failed",
      message: "The test payment request could not be completed. No wallet balance was changed.",
    }, 500, origin);
  }
});
