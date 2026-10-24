# GROEarnX Production Readiness and Recovery Checklist

This checklist distinguishes working interface features from real-money services. A green frontend build does not prove that payment, custody, trading, identity, or settlement workflows work.

## Current safety boundary

The app currently supports account flows and a Supabase-backed account foundation. Public CoinGecko quotes are market information only. Real-money deposits, withdrawals, custody, trade execution, and KYC must remain unavailable until their real providers and server-side workflows have been integrated and tested. Do not change the readiness endpoint's fail-closed workflow flags to `true` merely to make the dashboard green.

## Required before any real customer funds are accepted

- [ ] Confirm the legal entity, permitted countries, licensing/registration, AML/CFT, sanctions screening, disclosures, complaints handling, and consumer-protection requirements with qualified counsel.
- [ ] Select and contract providers that support the actual operating country and assets: custody/wallet infrastructure, fiat/mobile-money payment rails as needed, trade execution/liquidity, identity verification, and blockchain/transaction monitoring.
- [ ] Implement server-side provider calls. Provider secrets must be stored in Supabase Edge Function/Vercel server-side secrets, never in Vite `VITE_*` variables or browser code.
- [ ] Verify signed provider webhooks (signature, timestamp/replay window, event identity, and provider account), and make processing idempotent.
- [ ] Use a server-authoritative double-entry ledger. Clients must never set balances, insert posted journal entries, mark deposits settled, or mark withdrawals/trades complete.
- [ ] Implement confirmation thresholds, limits, holds, approval queues, refunds/reversals, chargebacks, failed/partial orders, reconciliation, and immutable audit trails.
- [ ] Integrate KYC through a hosted/secure provider flow. Store only the minimum necessary identity data; do not collect raw identity-document numbers in ordinary profile forms.
- [ ] Complete MFA/admin access review, account recovery testing, rate limiting/abuse controls, backup/restore testing, monitoring, incident response, and an independent security review.
- [ ] Publish legally reviewed Terms, Privacy, fee schedule, risk disclosures, complaints procedure, and any product-specific terms.
- [ ] Pass sandbox end-to-end tests and a controlled production pilot with reconciliation sign-off before enabling each financial feature independently.

## Pre-release smoke test

Run these checks against a preview deployment before promoting it to production:

1. Open the homepage on desktop and a real mobile browser. Check the browser console and network panel for errors.
2. Register with a test email, complete email confirmation, sign in, refresh, sign out, and sign in again.
3. Test incorrect passwords, unconfirmed email, expired reset links, rate limits, and a blocked/offline network. The UI must recover from loading states and show an actionable error.
4. Complete MFA enrollment and challenge flows. Verify that admin screens and sensitive data are inaccessible without a valid authenticated admin session with MFA.
5. Load markets with the provider online, rate-limited, and unavailable. When unavailable, the UI must say so rather than display made-up prices.
6. Verify that the account shows no seeded or fabricated customer funds. A quote or button click must not create a transaction or change a balance.
7. Submit a support ticket as a test user and confirm it is saved and visible only to its owner and authorized administrators.
8. Test database row-level security with two different test accounts. Account A must not read or change account B's profile, tickets, notifications, transaction requests, or balances.
9. Review Vercel build/runtime logs, Supabase Auth/Database/Edge Function logs, and the production readiness endpoint. Record the failing route, timestamp, request ID, and exact error before changing code.
10. After each release, confirm the expected deployment commit and run the smoke tests again.

## Recovery playbook

### Site shows a blank screen or fails to load
- Open the latest Vercel deployment and inspect Build Logs.
- Check browser DevTools Console for the first JavaScript error and Network for failed JS/CSS assets.
- Confirm the Vercel project root, build command (`npm run build`), output directory (`dist`), and successful deployment status.
- If the new release caused an outage, roll back to the last known-good Vercel deployment, then fix and verify the issue in a preview.

### Sign-up, sign-in, or password reset fails
- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` refer to the intended Supabase project in the production Vercel environment.
- In Supabase Authentication → URL Configuration, set the production Site URL and allow the exact production and preview redirect URLs that are used.
- Check email confirmation, password reset email delivery, SMTP/provider quotas, Auth rate limits, and Supabase Auth logs.
- Never fix a browser network error by exposing a service-role/secret key. Redeploy after changing Vercel environment variables.

### Dashboard is empty or database requests fail
- Check Supabase project health, browser Network responses, and Supabase API/Database logs.
- Confirm required migrations are applied to the intended project and tables are exposed only as intended.
- Verify RLS is enabled and ownership policies are correct. Do not disable RLS to make the page load.
- Test with two separate accounts before releasing any policy change.

### Live prices disappear
- Treat the feed as unavailable until a valid response returns. Check CoinGecko status, API quota/terms, browser Network response, and console errors.
- Do not substitute invented prices, fabricated order books, or stale values without a clear stale-data label.
- If the feed is rate-limited, use a permitted API plan or a server-side cache with a clear update timestamp.

### A deposit, withdrawal, or trade appears stuck or has a mismatched balance
- Keep the feature disabled and stop accepting additional requests until the incident is understood.
- Do not manually edit a customer's balance or mark the transaction complete in the browser.
- Record the internal transaction ID, provider event/reference, asset/network, amount, timestamp, and status; do not post secrets or full customer identity details into public tickets.
- Compare the provider's authoritative transaction state with verified webhooks and ledger postings. Check for duplicate/replayed events and idempotency failures.
- Escalate to the provider and authorized finance/security operator. Reconcile every affected transaction and preserve audit logs before resuming.

### Suspected account compromise or secret exposure
- Disable affected capability or access path; rotate the exposed provider/API secret immediately and revoke affected sessions/tokens where appropriate.
- Review Supabase Auth, database, Edge Function, and Vercel logs. Preserve evidence and follow the incident response/legal notification plan.
- Never commit production secrets to GitHub or paste them into support chats. Use environment-variable managers and rotate any credential that was exposed.

## Local verification commands

```sh
npm install
npm test
npm run build
npm run dev
```

The automated tests are safety-contract checks for key fail-closed behavior; they are not substitutes for browser tests, provider sandbox tests, database RLS tests, penetration testing, or real settlement reconciliation.
