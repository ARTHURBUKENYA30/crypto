# GROEarnX

A modern crypto-market and portfolio UI built with React and Vite.

## Current status

This repository starts as a **front-end preview**. It is not a live exchange, custodian, investment product, or payment processor.

- Public market quotes are requested from CoinGecko when available. If the feed is unavailable, the UI says prices are sample data.
- Demo balances are illustrative holdings marked as demo. They are not money held by GROEarnX or a claim of investment returns.
- Deposit and withdrawal actions only create in-memory preview requests. They do not generate deposit addresses, submit blockchain transactions, or move money.
- Sign-in and sign-up are preview navigation only. Do not enter real credentials, national identity numbers, or driving-permit numbers until secure authentication and KYC are configured.
- No credentials or identity details are intentionally stored or sent by the current form handlers.

## Run locally

Requirements: Node.js 22.12+ recommended for the current Vite 8 line.

Run these commands in a terminal:

    npm install
    npm run dev

Production build:

    npm run build
    npm run preview

## Required before accepting real clients or funds

1. Configure a proper identity/authentication provider (email verification, secure password reset, rate limits, session handling, MFA options, and server-side authorization).
2. Integrate an approved KYC provider. Collect the minimum required data, protect uploaded documents, define retention/deletion policies, and never store identity documents in public assets or client-side storage.
3. Choose compliant crypto custody/on-ramp and payout providers for each country and asset. USDT network support must be explicit; ETH and BTC transfers use different networks. Never show a deposit address until the matching wallet infrastructure is provisioned and verified.
4. Implement a server-side, auditable double-entry ledger. A requested deposit or withdrawal must not change the spendable balance until the provider or chain confirms it. Add reconciliation, idempotency, fraud controls, approval rules, rate limits, and monitoring.
5. Obtain legal/compliance advice for each market in which the platform operates. Handling or transmitting convertible virtual currency can trigger money-transmission obligations under applicable US rules; this UI does not determine licensing status.
6. Replace all preview notices and sample values only after the real services are tested end-to-end. Do not advertise guaranteed returns.

## Market data

The client tries the CoinGecko markets endpoint:
https://api.coingecko.com/api/v3/coins/markets

Review CoinGecko's current access policy, attribution requirements, quotas and API-key options before production use:
https://www.coingecko.com/en/api

US regulatory reference for virtual-currency business models:
https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering

## Branding

GROEarnX uses a polished US-fintech visual style and USD-first presentation. The branding must not be used to imply that the company is US-based, registered, insured, or licensed unless those statements are factually true.
