# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured — this is a hackathon demo project.

## Environment

Requires `.env.local`:
```
NEXT_PUBLIC_RPC_URL=<solana-devnet-rpc>
NEXT_PUBLIC_PROGRAM_ID=<anchor-program-id>
NEXT_PUBLIC_SELLER_ADDRESS=<seller-wallet-address>  # optional, has hardcoded fallback
```

## Architecture

**Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Solana Web3.js, Anchor 0.32, Phantom/Solflare wallet adapters.

**Theme:** Gold/brown wine marketplace aesthetic (primary `#342521`, secondary `#765843`). Fonts: EB Garamond (serif) + Hanken Grotesk (sans).

### Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/buyer` | Product grid + purchase flow |
| `/orders` | Buyer's order list with progress bars |
| `/order/[id]` | Order detail — timeline, refund, complete actions |
| `/seller` | Seller dashboard — incoming orders (top) + listed products (bottom) |
| `/verify` | Validator node registration (UI-only, no on-chain logic) |

### Key Files

- `lib/program.ts` — Anchor client, PDA derivation (`getOrderPDA`, `getEscrowPDA`), order fetching. PDA seeds: order = `["order", buyer, product_id_u64_le]`, escrow = `["escrow", order_pubkey]`.
- `lib/constants.ts` — 12 hardcoded wine products (all → 1 seller), 8 validator nodes with distances/stakes, `OrderStatusKey` enum, timeline steps.
- `lib/idl/` — Contract IDL + generated types. Must be updated after `anchor build` by copying from `target/idl/` and `target/types/`.
- `app/providers.tsx` — Solana wallet adapter setup (Phantom, Solflare). `WalletMultiButton` must use `dynamic()` import to avoid SSR hydration errors.

### On-Chain Integration Patterns

- **Anchor 0.30+ account resolution:** Signers and PDA accounts are auto-resolved. Only pass non-derivable accounts to `.accounts()` (e.g., `.accounts({ order: orderPDA })`).
- **Browser-safe PDA derivation:** Use `DataView.setBigUint64()` + `Uint8Array` instead of Node.js `Buffer.writeBigUInt64LE` (not available in browser).
- **WebSocket-first real-time updates:** Use `connection.onAccountChange()` with debounce (500ms) and stable `useRef` for callbacks. Polling is fallback only.
- **React hook stability:** Memoize `PublicKey` objects with `useMemo`, use `loadingRef` to prevent duplicate fetches, store callbacks in `useRef` for WebSocket subscriptions.

### State Machine

```
PURCHASED → ORDER_CONFIRMED → SHIPPED_TO_VALIDATOR → VALIDATED → SHIPPED_TO_BUYER → DELIVERED → COMPLETED
                                                                                                    ↓
                                                                              REFUNDED (from PURCHASED or ORDER_CONFIRMED)
```

The frontend `OrderStatusKey` type must stay in sync with the Anchor contract's `OrderStatus` enum in `programs/goreda/src/state.rs`.

### Contract Instructions

| Instruction | Signer | When |
|---|---|---|
| `purchase` | buyer | Buyer buys product, SOL locked in escrow |
| `confirmOrder` | seller | Seller acknowledges order |
| `shipToValidator` | seller | Seller ships to validator node |
| `shipToBuyer` | validator* | Validator ships to buyer after verification |
| `completeOrder` | buyer | Buyer confirms delivery, escrow released to seller |
| `refund` | buyer | Instant refund, closes order + escrow accounts |
| `closeOrder` | buyer | Close already-refunded/completed order accounts |

*Demo uses seller's wallet as validator_pubkey so the same wallet can call `shipToBuyer`.

### Demo Assumptions

- All 12 products map to a single hardcoded seller address
- 8 validators with hardcoded distances/stake amounts (no real staking)
- Seller's wallet doubles as validator for demo (passed as `validator_pubkey` in `shipToValidator`)
- Tracking numbers are mock-generated (`GR-{timestamp}-{validatorId}`)
- No real 7-day grace period — `completeOrder` is manual button click
- Devnet only — all Solscan links use `?cluster=devnet`
- `refund` closes both PDA accounts (order + escrow), allowing same product re-purchase
- `closeOrder` handles cleanup of previously refunded/completed orders
