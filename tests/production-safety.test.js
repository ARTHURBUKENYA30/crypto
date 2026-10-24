import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const supabaseClient = await readFile(new URL("../src/lib/supabase.js", import.meta.url), "utf8");
const readinessFunction = await readFile(
  new URL("../supabase/functions/financial-service-status/index.ts", import.meta.url),
  "utf8",
);

test("financial readiness remains fail-closed until provider workflows are implemented", () => {
  assert.match(readinessFunction, /cryptoCustodyAndPayouts:\s*false/);
  assert.match(readinessFunction, /fiatSettlement:\s*false/);
  assert.match(readinessFunction, /tradeExecution:\s*false/);
  assert.match(readinessFunction, /identityVerification:\s*false/);
  assert.match(readinessFunction, /services\.every\(\(service\) => service\.readyForRealMoney\)/);
});

test("admin readiness endpoint verifies the session, MFA, and server-controlled role", () => {
  assert.match(readinessFunction, /supabase\.auth\.getUser\(match\[1\]\)/);
  assert.match(readinessFunction, /claims\?\.aal !== "aal2"/);
  assert.match(readinessFunction, /userData\.user\.app_metadata\?\.role !== "admin"/);
  assert.match(readinessFunction, /req\.method !== "GET"/);
});

test("browser Supabase client does not use a service-role or secret key", () => {
  assert.match(supabaseClient, /VITE_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(supabaseClient, /service_role|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i);
});

test("market-data failures are handled without showing fabricated prices", () => {
  assert.match(app, /api\.coingecko\.com\/api\/v3\/coins\/markets/);
  assert.match(app, /if \(!response\.ok\) throw new Error\("Market feed unavailable"\)/);
  assert.match(app, /Market data unavailable/);
  assert.match(app, /setMarketStatus\("unavailable"\)/);
});

test("trading UI clearly labels the app as quotes-only until execution is integrated", () => {
  assert.match(app, /Order submission and settlement not available/);
  assert.match(app, /Balances will not change from this screen/);
  assert.match(app, /Buy\/sell execution is unavailable until a trading provider is integrated/);
  assert.match(app, /No synthetic market depth is displayed/);
});
