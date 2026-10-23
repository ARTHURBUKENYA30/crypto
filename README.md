# GROEarnX

GROEarnX is a React/Vite crypto-market interface with a Supabase-backed account foundation.

## Current implementation status

- **Accounts:** Supabase email/password sign-up and sign-in are implemented in the frontend. Configure the environment variables below and enable email confirmation / password security in Supabase before onboarding clients.
- **Profiles:** A profile row is provisioned by an Auth trigger. Country, display name, phone and a provider-managed KYC status are supported.
- **User activity requests:** The database has per-user transaction request records with row-level security. The interface does not submit deposit or withdrawal requests until a real provider is connected.
- **Ledger foundation:** Database tables for immutable posted journal entries, balance-by-asset reporting and transaction reconciliation foundations exist. No customer balances or ledger entries are seeded.
- **Markets:** Public CoinGecko quotes may load when the provider is available. Quotes are market information, not exchange execution.
- **Custody, payments, KYC, exchange orders, notifications and admin operations:** Database foundations exist for some records, but the required provider integrations and end-to-end operational workflows are not yet complete. Do not accept customer funds or advertise live trading/investment services yet.
- **Investment plans:** No plan or return is enabled by default. Never advertise a return as guaranteed.
- **Login recovery and session behavior:** The frontend now handles network exceptions without leaving sign-in/loading states stuck, restores valid sessions to the account view, routes email-confirmed sessions to security setup, and provides a password-reset completion screen. These code fixes do not replace the Supabase production URL, key, email-delivery or redirect configuration.
- **Watchlist:** Market watchlist selections persist in the current browser only; they are not synced between devices or stored in the user account.

## Configure real account authentication

1. In Supabase project **crypto** (project ref `bxynrnkhnpwsbxamsxpt`), open Authentication → URL Configuration. Set **Site URL** to `https://crypto-ten-liart.vercel.app` and add `https://crypto-ten-liart.vercel.app/**` to the allowed Redirect URLs. Signup confirmation and password recovery redirect to the current site origin, so this origin must be allow-listed.
2. Enable email confirmation and configure confirmation/password-reset email templates, rate limits, abuse protection and MFA policy. Existing accounts must confirm their email before password sign-in if confirmation is enabled.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` to the exact Supabase project URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its publishable key. Ensure any Vercel environment-variable overrides point to the same project. Never use a service-role/secret key in a Vite client.
5. Set the same two variables in the Vercel production environment and redeploy.
6. Run `npm install`, `npm run build`, then `npm run dev`.

## U.S. launch checklist

Read [US_LAUNCH_GUIDE.md](./US_LAUNCH_GUIDE.md) for the step-by-step legal, provider, hosting, testing and troubleshooting plan for operating in the United States.

The current Supabase project region is eu-west-2 (UK); approve the production data region before onboarding U.S. customers. State and licensing eligibility must be enforced from trusted server-side/KYC records, not the editable state value in Auth metadata. U.S. ACH/card, custody wallets, mobile-money and exchange execution are not connected, so financial actions remain disabled. The public site at https://crypto-ten-liart.vercel.app is reachable and has been checked for the latest frontend changes. The connected Vercel management integration cannot read project settings because its team scope returns an authorization error.

## Financial controls and go-live requirements

Before any real deposit, withdrawal, buy/sell or yield service is activated:

1. Complete legal and compliance review in each country served. Confirm the company entity, licensing/registration, AML/CFT, sanctions screening, tax, consumer protection and required disclosures with qualified counsel. US branding is not proof of US incorporation or licensing.
2. Contract with appropriate crypto custody/wallet, blockchain monitoring, exchange/liquidity and fiat/mobile-money providers. Confirm supported country, asset, token contract, network, fees, limits, webhook authentication and settlement behavior.
3. Implement server-side provider integrations and signed webhook verification. Never expose provider secrets in browser code or issue an address unless the provider has created and verified it.
4. Route all balance-changing actions through a trusted server/Edge Function. Use idempotency keys, double-entry postings, per-asset balancing, confirmations, reconciliation, sanctions/fraud controls, limits, approval queues and immutable audit logs. Never let clients write ledger entries or set transaction status.
5. Configure a vetted KYC provider. Do not collect raw national-ID or driving-permit numbers in the regular sign-up form. Store only the minimum necessary provider reference/status unless legal advice and the provider's secure flow require otherwise.
6. Add tested MFA, account recovery, session management, admin RBAC using server-controlled app metadata, security alerts, support operations, incident response, backups, monitoring and independent penetration testing.
7. Publish reviewed Terms, Privacy, Fees, complaints process, risk disclosure and investment-plan terms before customer onboarding.
8. Run end-to-end tests in provider sandboxes and a controlled pilot. Only enable a capability after reconciliation and security tests pass.

## Database migration

The production account/ledger foundation migration has been applied to the connected Supabase project. All exposed user tables use row-level security. The schema deliberately contains no seeded customer funds, wallet addresses, or active investment plans.

## Market data

CoinGecko markets endpoint:
https://api.coingecko.com/api/v3/coins/markets

Check current API terms, quotas and attribution requirements before production use:
https://www.coingecko.com/en/api

## Contact

WhatsApp: +447404517328

