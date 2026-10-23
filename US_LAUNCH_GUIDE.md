# GROEarnX — U.S. launch guide and challenge checklist

Last reviewed: 22 October 2026.

This is an operational checklist, not legal advice. A crypto market-data website is different from a business that receives customer money, holds private keys, exchanges assets, routes orders, or markets investments. **Do not accept customer funds until a U.S. attorney has classified the exact business model and you have the required authorizations and provider contracts.**

## 1. What is in the repository now

Implemented in the current app:
- Responsive GROEarnX homepage, crypto ticker, market listings and market-history charts when the public data feed supplies history.
- Supabase email/password sign-up and sign-in, email confirmation redirect, password reset and authenticator MFA screens.
- Customer profile, transaction-request, wallet, verification-status, notification, investment-plan, ledger and portfolio-history database foundations.
- Row-level security on customer-facing tables and immutable posted-ledger protections.
- No seeded client balances, fabricated transaction history or fallback crypto prices.
- Investment plans display only when active and marked legally reviewed.
- The admin screen is read-only and gated by a server-managed Supabase app_metadata role.

Not production-ready yet:
- No contracted crypto custody/wallet, ACH/card acquiring, mobile-money, trading/execution or KYC provider is connected.
- Deposits, withdrawals and buy/sell execution are disabled. No deposit address is generated and no money moves.
- The backend does not yet post real financial events, verify financial-provider webhooks, reconcile provider and on-chain balances, or record trusted portfolio snapshots.
- No investment plans are active.
- The active Supabase project is `rqmibtetfzaiadawvnlz` in region eu-west-1 (Ireland). Review whether that data region suits a U.S. launch and your privacy commitments.
- On 23 October 2026, the old frontend fallback `bxynrnkhnpwsbxamsxpt.supabase.co` was found to fail DNS resolution. The source and current deployed bundle now use `https://rqmibtetfzaiadawvnlz.supabase.co`; the new account/ledger/MFA schema and restrictive MFA policies have been applied there.
- The U.S. state selector saves state in editable Auth user metadata; a database column for authoritative state records was not added. Do not use user-editable metadata as proof of residence, licensing eligibility, KYC or permission to move funds.
- The public Vercel site at https://crypto-ten-liart.vercel.app is reachable, and its live JavaScript bundle has been checked for the latest frontend fixes. The connected Vercel management integration still cannot read deployment settings because its team scope returns an authorization error.

## 2. Step-by-step U.S. launch

### Step 1 — Decide the exact business model

Write a product brief and have the founders and U.S. counsel agree whether GROEarnX is:
- only a market-data and educational website;
- a non-custodial software interface;
- an exchange or broker-like service;
- a custodian/wallet service that controls crypto keys;
- a service that receives or transmits customer dollars/crypto;
- an investment, yield, lending or managed-portfolio product.

List the assets, token contracts, networks, fees, order routing, custody flows and states you want to support. The word “website” does not determine the regulatory classification.

### Step 2 — Establish the actual U.S. operating entity

With U.S. counsel and a qualified accountant, determine the legal entity, formation state, business address, ownership/control, EIN, bank relationship and operating agreements. Do not claim U.S. registration, licensing, insurance or headquarters unless each claim is true and supportable.

### Step 3 — Get a written federal and state regulatory map

Ask counsel for a written memo covering the business model, assets and target states.

- **FinCEN / Bank Secrecy Act:** FinCEN guidance says an administrator or exchanger of virtual currency may be a money transmitter and a money services business unless a limitation or exemption applies. The actual flows matter. Review [FinCEN's virtual-currency guidance](https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering) and the [IRS MSB information center](https://www.irs.gov/businesses/small-businesses-self-employed/money-services-business-msb-information-center).
- **State money transmission:** Map licenses or exemptions state by state, including where customers reside. CSBS reported that 31 states had enacted all or part of the MTMA by September 2026, but implementation and interpretation can vary. Review [CSBS MTMA status](https://www.csbs.org/csbs-money-transmission-modernization-act-mtma).
- **New York:** Covered virtual-currency activities involving New York residents can require a NYDFS BitLicense or appropriate charter, as well as any separate required authorization. Read [NYDFS virtual-currency licensing](https://www.dfs.ny.gov/virtual_currency_businesses).
- **Securities, investment advice and derivatives:** Get advice on the exact assets and flows if GROEarnX lists tokens, routes customer orders, offers managed portfolios, markets yield/returns, pools customer funds or provides futures/derivatives.
- **Sanctions and financial crime:** Agree customer screening, transaction monitoring, recordkeeping, alert escalation and reporting with counsel and contracted partners. Start with [OFAC industry resources](https://ofac.treasury.gov/additional-ofac-resources/ofac-information-for-industry-groups).

FinCEN registration by itself does not replace state licenses, processor approval or other applicable authorizations.

### Step 4 — Decide which states you can serve

Create a state eligibility matrix with each state marked supported, unsupported or pending legal/provider approval. Add a server-side eligibility check before onboarding and every regulated action. A dropdown is not proof of residence; Auth user metadata is editable by the user. Use a suitable KYC/residence verification provider and server-side records for the decision.

Until a state is approved, the server must reject the regulated action for that state. The current signup state selector is data entry only; it is not the eligibility engine.

### Step 5 — Decide on production hosting and data region

The active Supabase project `rqmibtetfzaiadawvnlz` is currently in region eu-west-1 (Ireland). Decide whether to retain it after reviewing privacy, contracts, provider needs, regulator expectations and data residency with counsel. The prior project reference used by the source code was a DNS failure and is no longer the app fallback.

1. Open the Supabase dashboard and identify the production project and region approved for the business.
2. If you create a separate production project, budget for any billable plan/compute and migrate the schema deliberately. Do not blindly copy customer data.
3. Apply and verify the account/ledger schema in that project.
4. Confirm Auth, database, backups, logs, storage access rules and retention settings.
5. Never expose a Supabase secret/service-role key in browser code or a Vite public environment variable. Only the public publishable key belongs in the frontend; privileged actions must run on a trusted server/Edge Function.
6. Run database security advisors and RLS tests with two separate customer accounts. Confirm each user can only see their own profile, requests, notifications, wallets, balances and snapshots.

### Step 6 — Configure account security

In Supabase Auth settings:

1. Enable email confirmation and configure confirmation and password-reset email templates. The public Auth settings show email signup enabled and auto-confirm disabled, so new users are expected to verify email. Confirm that SMTP/email delivery is configured for arbitrary customer addresses; the built-in default mailer may be too limited for production.
2. Set the production Site URL to `https://crypto-ten-liart.vercel.app` and add `https://crypto-ten-liart.vercel.app/**` to allowed redirect URLs for this deployment. If the production domain changes, update both settings and redeploy.
3. Configure password rules, rate limits, anti-abuse protection, session policy and recovery procedures.
4. Make authenticator MFA mandatory for private account data if that is the selected production policy. The interface routes users to authenticator setup before showing account screens, but the database/API must independently enforce MFA. Showing an MFA screen alone is not sufficient. Sign-in now reports common email/network failures, restores existing sessions to the right account view, and supports choosing a new password after a recovery link. If login still fails on the deployed domain, inspect the Supabase Auth URL configuration and Vercel `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` values first.
5. In the production Supabase SQL Editor, review and test the following restrictive policies for your required-MFA model. Do this after confirming you can recover an account securely; it intentionally prevents AAL1 sessions from accessing private account tables. If your legal/security team selects a different MFA policy, adjust the rules deliberately rather than silently leaving the APIs unprotected.

~~~sql
-- Example only: require a verified aal2 session for private customer data.
-- Run once in the production database after reviewing the policy with your engineer.
create policy profiles_require_aal2
  on public.profiles as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy transaction_requests_require_aal2
  on public.transaction_requests as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy wallets_require_aal2
  on public.wallets as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy user_verifications_require_aal2
  on public.user_verifications as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy notifications_require_aal2
  on public.notifications as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');

create policy portfolio_snapshots_require_aal2
  on public.portfolio_snapshots as restrictive for all to authenticated
  using ((select auth.jwt()->>'aal') = 'aal2')
  with check ((select auth.jwt()->>'aal') = 'aal2');
~~~

The balance RPC is SECURITY DEFINER, so it must also check the signed-in JWT assurance level inside the function, not just rely on table RLS:

~~~sql
create or replace function public.get_my_asset_balances()
returns table (asset_code text, balance numeric)
language sql
stable
security definer
set search_path = ''
as $
  select a.asset_code,
         coalesce(sum(case when e.side = 'credit' then e.amount else -e.amount end), 0)::numeric as balance
  from public.ledger_accounts a
  left join public.ledger_entries e on e.account_id = a.id
    and exists (
      select 1 from public.ledger_journals j
      where j.id = e.journal_id and j.status = 'posted'
    )
  where a.owner_user_id = (select auth.uid())
    and a.account_type = 'customer_liability'
    and (select auth.jwt()->>'aal') = 'aal2'
  group by a.asset_code
  order by a.asset_code;
$;

revoke all on function public.get_my_asset_balances() from public, anon;
grant execute on function public.get_my_asset_balances() to authenticated;
~~~

After applying these policies, test with one account without MFA (it must receive no private account data) and a separate account with verified MFA (it should see only its own data). Do not rely on a front-end route guard as the security boundary.
6. Test signup, confirmation, sign-in, sign-out, password reset, expired links, wrong passwords, rate limits and mobile layouts.
6. The state held in user metadata is customer-editable. Never use it as the authoritative compliance or permission record.

### Step 7 — Select and contract the financial providers

Ask each prospective vendor to confirm in writing that it supports the company's actual entity, intended states, custody design, assets, networks and transaction types.

- **Crypto custody/wallets:** Confirm address creation and verification per user/asset/network, key management, withdrawal approvals, transaction screening, reconciliation and incident support.
- **Exchange/liquidity/order execution:** Confirm pairs, order types, execution records, fees/spreads, order status semantics and authorization to serve the company and intended customers. Market-data access is not exchange execution.
- **U.S. funding:** Use a contracted provider's supported U.S. bank/ACH/card checkout. Prefer secure hosted or tokenized checkout over directly collecting bank/card credentials. Confirm settlement, returns, chargebacks, fraud controls, limits and prohibited-business policies.
- **Mobile money:** MTN/Airtel/M-Pesa should be offered only for regions and customers expressly supported by the provider and compliance plan. Mobile money is not a U.S. substitute for ACH/card. The current payment selector does not initiate a payment.
- **Identity verification:** Use an approved KYC/KYB provider with secure document collection, status/review workflow, screening required for the model, and documented retention/deletion. Do not ask customers to send full national-ID or driving-permit details through WhatsApp or ordinary registration fields.

### Step 8 — Complete the real ledger and payment backend

The database schema is a foundation, not a running payment service. The server-side process must:

1. Authenticate the request and check account state, KYC/eligibility, limits and risk controls.
2. Create an idempotent pending request.
3. Generate payment instructions only through the contracted provider.
4. Validate provider webhooks with signature authentication, timestamps and replay protection.
5. Credit balances only after the relevant fiat settlement or blockchain confirmations.
6. Post balanced, immutable double-entry ledger journals per asset. Never accept a client-supplied balance or client-supplied transaction status.
7. Run withdrawal authorization and risk checks, then update status only after provider execution and confirmation.
8. Reconcile the ledger against provider statements and custody/on-chain balances. Alert on mismatches, duplicate callbacks, stuck transfers and negative balances.
9. Maintain audit logs, dispute/chargeback handling, operational alerts and tested incident response.

The client intentionally does not fabricate balances or accept a deposit while these server workflows and provider connections are missing.

### Step 9 — Complete trading, plans and tax support

- Connect an approved exchange adapter. Retrieve balances server-side, validate spendable funds, submit orders idempotently and record real order IDs, fills and fees.
- Track open, partial, filled, cancelled, rejected and expired order states. A quote preview is not a completed trade.
- Do not activate an investment plan until counsel approves its classification, eligibility, marketing, fees, risk warnings, return calculation, liquidity/withdrawal terms and any required registrations.
- Ask tax counsel/accounting support to determine record-retention and information-reporting duties. The IRS says covered brokers use Form 1099-DA for digital-asset proceeds reporting, with requirements depending on the broker role and transaction date. See [IRS Form 1099-DA guidance](https://www.irs.gov/businesses/understanding-your-form-1099-da).

### Step 10 — Finish legal, security and customer operations

Before launch, sign off on:
- MFA policy, admin role provisioning, least privilege, secret/key rotation and emergency access.
- Independent security testing, dependency scans, RLS tests, backup restoration and incident-response exercises.
- Final Terms, Privacy Policy, Fees, Risk Disclosure, complaint/closure processes, support escalation, and custody/regulatory disclosures. The policy text in the app is draft text; complete it with the real legal entity, contact, providers, retention schedule and jurisdiction-specific language.
- Whether the FTC Safeguards Rule applies to the actual business, and the appropriate security program/service-provider oversight. See [FTC Safeguards Rule guidance](https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know).
- Vendor due diligence, incident notification terms, data processing, support SLAs, audit rights, backups and vendor-exit plan.

### Step 11 — Deploy to Vercel

The public domain https://crypto-ten-liart.vercel.app is reachable, and the live JavaScript bundle was verified to use the active Supabase project reference and contain the latest frontend fixes. The connected Vercel management account still returns a 403 authorization error for team bukenya-arthurs-projects, so project settings and environment variables could not be inspected. The current bundle is correct, but open the project in Vercel to check future environment-variable overrides.

1. Open the Vercel connection authorization flow and grant access to the team that owns the project. If this is not the intended account, use your own authorized Vercel account to import the repository.
2. In Vercel select Add New → Project and import [ARTHURBUKENYA30/crypto](https://github.com/ARTHURBUKENYA30/crypto). Select Vite if it is not detected.
3. Set production variables VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for the approved production Supabase project. Do not add a service-role/secret key to Vite variables.
4. Use Build Command npm run build and Output Directory dist.
5. Deploy to a temporary URL. Test signup, confirmation, reset, MFA and RLS before connecting a customer domain.
6. Add the exact deployed HTTPS domain to Supabase Auth Site URL/allowed redirects.
7. Check production logs, market-data availability, mobile layouts, error handling, monitoring and support escalation.

### Step 12 — Pilot and launch review

Use provider sandboxes first. Test signup/confirmation/MFA, unsupported-state blocks, KYC approved/pending/rejected states, each supported asset/network, duplicate webhooks, delayed confirmations, failed ACH/card payments, returns/chargebacks, partial fills, withdrawal review/rejection, reconciliation differences, outage behavior and account closure. Keep real funds disabled until authorized personnel sign off on legal eligibility and operational controls.

## Common challenges and safe responses

| Challenge | Likely cause | Safe response |
|---|---|---|
| Signup asks for email confirmation or sign-in fails | Auth confirmation or redirects not configured | Fix Auth email templates, Site URL and allowed redirects; retry with a fresh test account. |
| Login works locally but not on the deployed site | Missing/wrong production Supabase variables or URL allowlist | Check Vercel production variables, redeploy and allowlist the exact HTTPS domain. |
| Dashboard is empty or value is unavailable | No posted ledger balances, snapshots or current quotes | Verify quote source. Record portfolio snapshots only from the trusted server and posted balances. Never insert example balances to fill the screen. |
| A user sees another user's data | Incorrect RLS or API authorization | Pause onboarding, inspect RLS/access logs and test with two users. Treat this as a security incident. |
| Deposit requested but balance remains unchanged | Request is not settlement; provider callback/confirmations may be pending | Verify the provider reference, signature, chain confirmations and reconciliation before crediting. |
| Withdrawal is stuck or failed | Review, balance, destination, provider or network issue | Show the actual status, open an audited support case and don't demand unexpected extra “release” payments. |
| U.S. state is unsupported | Legal/provider permission not approved for that state | Deny the financial action server-side and show a clear eligibility message; don't rely on a dropdown. |
| Wrong token/network selected | Asset address or provider/network configuration mismatch | Stop that route and verify with custody provider before displaying instructions. |
| Chart is blank | Feed limit, API issue or no historical data | Show “unavailable”, review API terms/logs, or contract a market-data vendor. Never substitute invented prices. |
| GitHub build fails | Syntax, dependency or install failure | Open the failed Actions run, fix the first error, commit, then verify npm run build. |
| Vercel can't import the repo | Team-scope permission mismatch | Grant the correct team access or use an authorized account; never paste deployment tokens into chat. |
| Admin access is denied | No trusted app_metadata admin role or policies mismatch | Provision the role through a trusted operator/server process and inspect logs. Never provide a public “make me admin” function. |
| Legal/provider approval is delayed | Normal for a financial-services launch | Launch only the public market/education features counsel approves. Keep custody, customer funds, trade execution and investment offers disabled. |

## Official U.S. references

- FinCEN virtual-currency guidance: https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering
- IRS MSB information center: https://www.irs.gov/businesses/small-businesses-self-employed/money-services-business-msb-information-center
- CSBS MTMA state adoption: https://www.csbs.org/csbs-money-transmission-modernization-act-mtma
- NYDFS virtual-currency licensing: https://www.dfs.ny.gov/virtual_currency_businesses
- OFAC industry resources: https://ofac.treasury.gov/additional-ofac-resources/ofac-information-for-industry-groups
- IRS Form 1099-DA: https://www.irs.gov/businesses/understanding-your-form-1099-da
- FTC Safeguards Rule: https://www.ftc.gov/business-guidance/resources/ftc-safeguards-rule-what-your-business-needs-know

**Go-live rule:** Don't enable deposits, withdrawals, trading execution or investment plans just because the website builds. Enable each financial capability only after legal review, signed provider contracts, server-side implementation, security/reconciliation tests and production monitoring are complete.
