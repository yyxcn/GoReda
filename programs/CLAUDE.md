# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the workspace root (`GoReda/`), not from `programs/`:

```bash
anchor build                              # Compile → target/deploy/goreda.so + target/idl/goreda.json
anchor deploy --provider.cluster devnet   # Deploy/upgrade to devnet
anchor test                               # Build + deploy localnet + run tests
```

After `anchor build`, copy IDL to frontend:
```bash
cp target/idl/goreda.json frontend/lib/idl/goreda.json
cp target/types/goreda.ts frontend/lib/idl/goreda.ts
```

**Program ID (devnet):** `ASQCCGt2VKtnMCkrTUurr7u49ZcrCMrjL4q4kFsKGCa2`  
**Upgrade authority:** `~/.config/solana/id.json`  
**Rust:** 1.89.0 (pinned in `rust-toolchain.toml`), **Anchor:** 0.32.1

## Architecture

Single Anchor program (`goreda`) with four source files:

| File | Responsibility |
|---|---|
| `src/lib.rs` | 7 instruction handlers + `Accounts` context structs |
| `src/state.rs` | `Order` (346B) and `EscrowAccount` (49B) structs, `OrderStatus` enum |
| `src/escrow.rs` | `fund_escrow`, `release_escrow`, `refund_escrow` — lamport transfer helpers |
| `src/errors.rs` | `GorEdaError` enum (error codes 6000–6007) |

## PDAs

| Account | Seeds | Notes |
|---------|-------|-------|
| Order | `["order", buyer_pubkey, product_id_u64_le]` | One per (buyer, product) pair |
| Escrow | `["escrow", order_pubkey]` | One per order |

Refund and close_order use `close = buyer` to delete both PDAs, freeing them for re-purchase of the same product.

## State Machine & Instructions

```
purchase(product_id, price)       buyer signs     creates both PDAs, locks SOL via CPI
confirmOrder()                    seller signs     Purchased → OrderConfirmed
shipToValidator(pubkey, track#)   seller signs     OrderConfirmed → ShippedToValidator, stores validator
shipToBuyer(track#)               validator signs  ShippedToValidator → ShippedToBuyer
completeOrder()                   buyer signs      ShippedToBuyer → Completed, releases escrow to seller
refund()                          buyer signs      Purchased|OrderConfirmed → closes both PDAs (all lamports returned)
closeOrder()                      buyer signs      Refunded|Completed → closes both PDAs (cleanup)
```

States `Validated(3)` and `Delivered(5)` exist in the enum but have no instructions.

## Escrow Mechanics

- **fund_escrow**: CPI `system_program::transfer` from buyer (signer) → escrow PDA. Works because buyer is a signer.
- **release_escrow**: Direct lamport manipulation, escrow PDA → seller. Must be direct because program-owned PDAs can't use system_program::transfer.
- **refund**: Uses Anchor's `close = buyer` constraint — automatically returns ALL lamports (price + rent) to buyer. The `refund_escrow` function in escrow.rs exists but is no longer called.

## Authorization

Each instruction uses `has_one` constraints on the Order account:
- `has_one = seller` — confirm_order, ship_to_validator
- `has_one = buyer` — complete_order, refund, close_order
- `has_one = validator` — ship_to_buyer

The `validator` field is `Pubkey::default()` until `ship_to_validator` sets it. In the demo, seller's wallet is passed as validator_pubkey so the same wallet can call both seller and validator instructions.

## Demo Shortcuts

- Seller's wallet doubles as validator (no on-chain validator registry or staking)
- No validation/rejection logic — goes directly from ShippedToValidator → ShippedToBuyer
- No 7-day auto-complete — buyer manually clicks completeOrder
- Product metadata is off-chain; only product_id stored on-chain

## Test Status

`tests/goreda.ts` is a stub. Tests need rewriting against actual instructions.
