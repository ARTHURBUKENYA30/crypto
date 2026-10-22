# GROEarnX — presentation walkthrough

## 2-minute product walkthrough

1. Open the home page. Point out the USD-first crypto ticker, market snapshot, price-change indicators, market list, and learning section.
2. Select **Get started**. Show the separate account-creation screen with country and planned identity-verification fields. Explain that real national ID and driving-permit data must go through a dedicated, encrypted KYC provider; the preview does not submit or store the values.
3. Choose **Explore demo** on the home page, or enter the sign-in screen and submit the preview form. The dashboard opens in clearly labelled demo mode.
4. Open **Trade** from the dashboard sidebar. Select BTC, ETH, USDT, SOL, or XRP. Show the 7-day market trend, 24-hour stats, market/limit controls, sample market-depth view, and watchlist selector.
5. Click **Preview buy order** or **Preview sell order**. The app creates a temporary demo activity entry and changes no balance. Show the Activity screen to explain the difference between a request and a completed transaction.
6. Return to Overview. Show the sample portfolio valuation, allocation and market watch. Explain that the valuation follows market quotes when the public feed works, rather than guaranteeing a profit.
7. Point to the floating WhatsApp contact for support.

## What is implemented today

- Responsive public landing page with a crypto ticker and market-price table.
- Demo sign-in and registration screens.
- Dashboard areas for Overview, Trade, Portfolio, Markets, Activity, Verification and Profile.
- Public CoinGecko quote request with labelled illustrative fallback values.
- Local preview-only order, deposit and withdrawal request records.
- WhatsApp support link and contact link.
- Vite production build workflow in GitHub Actions.

## Do not present these as live financial capabilities

- Authentication, password recovery, OAuth, sessions and account security are not connected.
- Identity verification is not connected; do not ask presentation attendees to provide real identity numbers.
- No custody wallets, deposit addresses, blockchain transfers, mobile-money collection, payouts, live exchange order routing or settlement ledger are connected.
- Market-depth levels and sample portfolio units are illustrative.
- No live yield, interest accrual, profit guarantee, or investment service is implemented.

## Before public launch

Integrate and test secure authentication, a compliant KYC provider, a server-side double-entry ledger, asset/network-specific wallet custody, verified payment providers, risk/fraud controls, monitoring, and legal review for each country served. Deposit balances must remain pending until the real provider or blockchain confirms receipt. Withdrawals should be server-authorized, risk-checked and auditable. Never render a generated address unless the relevant custody service has actually issued and verified it.

## Run locally

    npm install
    npm run dev

Build:

    npm run build
