# GROEarnX provider onboarding and integration runbook

Last reviewed: 2026-10-24

## Decision

Start with a **sandbox-first, provider-approved** architecture. Do not switch real-money services on merely because credentials exist. GROEarnX currently has an account/ledger foundation and market quotes, but it does not yet have a complete, audited custody, settlement, trading, KYC, or reconciliation stack.

### Provider candidates

| Capability | Initial candidate | Decision gate |
|---|---|---|
| Uganda mobile-money payment collection | [Flutterwave Uganda mobile money API](https://developer.flutterwave.com/docs/uganda) | Obtain written approval for the legal entity, actual crypto-related use case, countries served, and settlement model before any live integration. API availability alone is not authorization. |
| KYC / identity verification | [Smile ID](https://www.smileidentity.com/) | Confirm coverage for Uganda, supported document types, business onboarding, data residency/retention, webhook signing, and pricing directly with the provider. |
| Crypto liquidity / stablecoin rails | [Yellow Card](https://yellowcard.io/) institutional/business API | Request business API access and written confirmation of eligible countries, assets, permitted use, compliance obligations, settlement and custody responsibilities. Do not assume a consumer account or API docs authorize exchange operation. |
| Custody / wallet infrastructure | Select only after the legal entity, countries, assets, chains, withdrawal policy and risk model are confirmed | Require institutional custody, withdrawal policy controls, key management, webhook signatures, audit logs, transaction monitoring and documented incident response. No provider is treated as selected or connected until its contract and credentials are verified. |
| Blockchain monitoring / sanctions screening | Select with the custody/liquidity provider and compliance adviser | Verify chain coverage, sanctions/AML capabilities, alert review, retention and escalation workflows. |

## Uganda-specific gate

The Financial Intelligence Authority published an amendment notice in February 2026 requiring Virtual Asset Service Providers within scope to comply with the Anti-Money Laundering Act and register as accountable persons. Its 2025 national risk assessment also describes restrictions affecting financial institutions and payment-system operators handling virtual-asset-related payments.

Before collecting or settling any customer money, obtain current advice from qualified Ugandan counsel and written answers from the relevant authorities and every proposed provider. Confirm the actual legal entity, FIA registration obligations, AML/CFT programme, sanctions screening, consumer disclosures, tax, complaints handling, data protection and whether each proposed payment rail may be used for the intended crypto product. This runbook is not legal advice.

Official references:
- https://fia.go.ug/amendment-of-the-second-schedule-to-the-anti-money-laundering-act-cap-118/
- https://fia.go.ug/virtual-assets-vas-and-virtual-asset-service-providers-vasps-ml-tf-national-risk-assessment-report-2025/
- https://developer.flutterwave.com/docs/uganda

## Sandbox payment adapter

A sandbox-only Supabase Edge Function is included at `supabase/functions/flutterwave-sandbox-payment-intent/index.ts`.

It:
- requires an authenticated Supabase user with an account email;
- accepts only UGX, MTN/Airtel, and a bounded test amount;
- rejects live Flutterwave keys and requires `FLW_ENVIRONMENT=sandbox`;
- returns a hosted sandbox authorization URL only after validating its HTTPS host;
- does not store or credit balances, post ledger entries, or mark a transaction settled;
- never returns provider error bodies to the browser.

Required Edge Function secrets for a sandbox smoke test:
- `FLW_ENVIRONMENT=sandbox`
- `FLW_SECRET_KEY=FLWSECK_TEST-...` (obtain this from your own Flutterwave dashboard; never commit it)

Supabase project URL and publishable/anon key are provided by the Supabase Edge Function environment. Do not add any payment secret to `VITE_*` or frontend code.

This adapter is intentionally not connected to the deposit button or customer ledger. Before doing that, implement and test a persistent payment-intent record, provider transaction verification, signed webhook verification, replay protection/idempotency, amount/currency/account matching, refunds/reversals, reconciliation, support operations, and a provider-approved live-mode gate. The current adapter must not be treated as a production payment service.

## Activation sequence

1. Create the business account with the provider using your own company/legal identity and complete its KYC/underwriting.
2. Obtain written approval for the intended crypto business model, jurisdictions, and each payment/settlement use.
3. Add **sandbox** secrets to Supabase Edge Function secrets, not GitHub or browser environment variables.
4. Deploy the sandbox function and test successful, declined, cancelled, duplicate, delayed, invalid amount, invalid phone, network timeout and provider-unavailable cases.
5. Verify no sandbox event can change a wallet balance or post a production ledger entry.
6. Integrate KYC with signed result webhooks and server-controlled verification status.
7. Select institutional custody, liquidity, chain monitoring and trade execution; complete independent threat modelling and reconciliation tests.
8. Publish reviewed Terms, Privacy Notice, risk disclosures, fees/limits and complaints procedure.
9. Enable one capability at a time only after legal, provider, security and reconciliation sign-off. Keep the global financial readiness gate closed until then.

## Supabase Auth hardening

The current Supabase security advisor reports leaked-password protection disabled. In the Supabase dashboard open **Authentication → Password Security** and enable leaked-password protection if the project's plan supports it. Supabase documents this feature as Pro plan and above:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Also confirm email confirmation, Site URL, allowed redirect URLs, MFA for administrators, rate limits and SMTP delivery before public onboarding.
