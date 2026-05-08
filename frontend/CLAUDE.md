# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Important:** This project uses a potentially non-standard Next.js version with breaking changes. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured — this is a demo project.

## Environment

Requires `.env.local`:
```
NEXT_PUBLIC_RPC_URL=<solana-devnet-rpc>
NEXT_PUBLIC_PROGRAM_ID=<anchor-program-id>
```

## Architecture

**Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4, Solana Web3.js, Anchor 0.32.1, Phantom/Solflare wallet adapters.

### Routing

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/buyer` | Product grid + purchase flow |
| `/seller` | Seller dashboard — order management + validator selection |
| `/order/[id]` | Order tracking timeline + refund/advance actions |

### Key Directories

- `app/` — Next.js App Router pages + `providers.tsx` (wallet setup) + `globals.css` (gold theme)
- `components/` — `Navbar`, `ProductCard`, `OrderTimeline`, `ValidatorSelector`
- `lib/constants.ts` — All hardcoded demo data: 12 products (all routed to 1 seller), 8 validators with hardcoded distances/stakes
- `lib/program.ts` — Anchor program client, PDA derivation (`order`, `escrow`), `PROGRAM_ID`
- `lib/idl/` — Smart contract IDL (`goreda.json` + typed `goreda.ts`)

### Data Flow

1. **Purchase:** `buyer/page.tsx` → `program.methods.purchase()` → navigate to `/order/{orderPDA}?product={id}&tx={hash}`
2. **Seller actions:** `seller/page.tsx` manages order state transitions and opens `ValidatorSelector` modal
3. **Order tracking:** `order/[id]/page.tsx` reads events array and renders `OrderTimeline` with Solscan tx links
4. **Refund:** Buyer clicks refund on `/order/[id]` → animates escrow balance to 0 and wallet balance up

### State Machine

`LISTED → PURCHASED → ORDER_CONFIRMED → SHIPPED_TO_VALIDATOR → VALIDATED → SHIPPED_TO_BUYER → DELIVERED → COMPLETED`

The `OrderStatus` enum in the frontend must stay in sync with the Anchor contract enum.

### Demo Assumptions

- All 12 products map to a single hardcoded seller
- 8 validators with hardcoded distances/stake amounts in `lib/constants.ts`
- Refund is simulated between `ORDER_CONFIRMED` and `SHIPPED_TO_VALIDATOR`
- Shipping company is assumed external — tracking numbers are mock-generated
- No real 7-day timer — `COMPLETED` is triggered by manual button click in demo
- Devnet only
