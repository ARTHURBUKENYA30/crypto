import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://crypto-ten-liart.vercel.app",
  "http://localhost:5173",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const resolvedOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : "https://crypto-ten-liart.vercel.app";
  return {
    "Access-Control-Allow-Origin": resolvedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function jsonResponse(data: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function hasEnv(...names: string[]): boolean {
  return names.every((name) => Boolean(Deno.env.get(name)?.trim()));
}

function claimPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
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
  if (req.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405, origin);
  }

  const authorization = req.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return jsonResponse({ error: "authentication_required" }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "backend_configuration_missing" }, 503, origin);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(match[1]);
    if (userError || !userData.user) {
      return jsonResponse({ error: "invalid_session" }, 401, origin);
    }

    const claims = claimPayload(match[1]);
    if (claims?.aal !== "aal2") {
      return jsonResponse({ error: "mfa_required" }, 403, origin);
    }
    if (userData.user.app_metadata?.role !== "admin") {
      return jsonResponse({ error: "admin_only" }, 403, origin);
    }

    const custodyConfigured = hasEnv(
      "CUSTODY_PROVIDER_NAME",
      "CUSTODY_API_KEY",
      "CUSTODY_API_SECRET",
      "CUSTODY_ACCOUNT_ID",
      "CUSTODY_WEBHOOK_SECRET",
    );
    const fiatConfigured = hasEnv(
      "FIAT_PROVIDER_NAME",
      "FIAT_API_KEY",
      "FIAT_API_SECRET",
      "FIAT_MERCHANT_ACCOUNT_ID",
      "FIAT_WEBHOOK_SECRET",
    );
    const tradingConfigured = hasEnv(
      "TRADING_PROVIDER_NAME",
      "TRADING_API_KEY",
      "TRADING_API_SECRET",
      "TRADING_ACCOUNT_ID",
    );
    const kycConfigured = hasEnv("KYC_PROVIDER_NAME", "KYC_API_KEY", "KYC_WEBHOOK_SECRET");
    const monitoringConfigured = hasEnv("BLOCKCHAIN_MONITORING_PROVIDER", "BLOCKCHAIN_MONITORING_API_KEY");
    const legalApproved = Deno.env.get("REGULATORY_APPROVAL_CONFIRMED") === "true";
    const sandboxValidated = Deno.env.get("PROVIDER_SANDBOX_TESTS_PASSED") === "true";
    const liveValidated = Deno.env.get("PROVIDER_LIVE_VALIDATION_CONFIRMED") === "true";
    const operatorEnabled = Deno.env.get("FINANCIAL_SERVICES_ENABLED") === "true";
    const commonGate = legalApproved && sandboxValidated && liveValidated && operatorEnabled && kycConfigured;

    const services = [
      {
        id: "crypto_funding",
        title: "Crypto custody, deposit addresses and withdrawals",
        providerConfigurationPresent: custodyConfigured,
        readyForRealMoney: Boolean(commonGate && custodyConfigured && monitoringConfigured),
        blockers: [
          ...(!custodyConfigured ? ["Custody provider API/account/webhook secrets are missing."] : []),
          ...(!monitoringConfigured ? ["Blockchain monitoring provider is not configured."] : []),
          ...(!kycConfigured ? ["Identity verification provider is not configured."] : []),
          ...(!legalApproved ? ["Regulatory approval has not been confirmed by the operator."] : []),
          ...(!sandboxValidated ? ["Provider sandbox testing has not been signed off."] : []),
          ...(!liveValidated ? ["Production reconciliation and withdrawal tests have not been signed off."] : []),
          ...(!operatorEnabled ? ["The global financial-services enable switch is off."] : []),
        ],
      },
      {
        id: "fiat_funding",
        title: "USD bank/card deposits and bank withdrawals",
        providerConfigurationPresent: fiatConfigured,
        readyForRealMoney: Boolean(commonGate && fiatConfigured && monitoringConfigured),
        blockers: [
          ...(!fiatConfigured ? ["A contracted fiat/payment provider and signed webhook secret are missing."] : []),
          ...(!monitoringConfigured ? ["Transaction-monitoring provider is not configured."] : []),
          ...(!kycConfigured ? ["Identity verification provider is not configured."] : []),
          ...(!legalApproved ? ["Regulatory approval has not been confirmed by the operator."] : []),
          ...(!sandboxValidated ? ["Payment sandbox testing has not been signed off."] : []),
          ...(!liveValidated ? ["Live settlement and reversal/reconciliation tests have not been signed off."] : []),
          ...(!operatorEnabled ? ["The global financial-services enable switch is off."] : []),
        ],
      },
      {
        id: "trading",
        title: "Buy, sell and exchange order execution",
        providerConfigurationPresent: tradingConfigured,
        readyForRealMoney: Boolean(commonGate && tradingConfigured && custodyConfigured && monitoringConfigured),
        blockers: [
          ...(!tradingConfigured ? ["A contracted trading/execution API and account are missing."] : []),
          ...(!custodyConfigured ? ["Custody and customer-funds reconciliation are not configured."] : []),
          ...(!monitoringConfigured ? ["Transaction-monitoring provider is not configured."] : []),
          ...(!kycConfigured ? ["Identity verification provider is not configured."] : []),
          ...(!legalApproved ? ["Regulatory approval has not been confirmed by the operator."] : []),
          ...(!sandboxValidated ? ["Trading sandbox, order-rejection and idempotency tests have not been signed off."] : []),
          ...(!liveValidated ? ["Live fill, fee and reconciliation tests have not been signed off."] : []),
          ...(!operatorEnabled ? ["The global financial-services enable switch is off."] : []),
        ],
      },
      {
        id: "identity_verification",
        title: "Identity verification / KYC",
        providerConfigurationPresent: kycConfigured,
        readyForRealMoney: Boolean(kycConfigured && sandboxValidated && legalApproved && liveValidated && operatorEnabled),
        blockers: [
          ...(!kycConfigured ? ["KYC provider credentials and verified webhook secret are missing."] : []),
          ...(!sandboxValidated ? ["Identity-provider sandbox tests have not been signed off."] : []),
          ...(!liveValidated ? ["Production verification webhook tests have not been signed off."] : []),
          ...(!legalApproved ? ["Regulatory approval has not been confirmed by the operator."] : []),
          ...(!operatorEnabled ? ["The global financial-services enable switch is off."] : []),
        ],
      },
    ];

    const realMoneyReady = services.every((service) => service.readyForRealMoney);
    return jsonResponse({
      checkedAt: new Date().toISOString(),
      environment: "production",
      realMoneyReady,
      controls: {
        legalApproved,
        sandboxValidated,
        liveValidated,
        operatorEnabled,
        monitoringConfigured,
      },
      services,
      note: "This endpoint checks configuration and operator sign-offs only; it does not verify provider uptime or replace a successful live transaction and reconciliation test.",
    }, 200, origin);
  } catch {
    return jsonResponse({ error: "readiness_check_failed" }, 500, origin);
  }
});
