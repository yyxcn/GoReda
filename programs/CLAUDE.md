# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run from the repo root (`/Users/charles/Hackathon/Solana-Frontier/Goreda/`):

```bash
anchor build                        # Compile the program
anchor deploy                       # Deploy to devnet
anchor test                         # Build + deploy localnet + run tests
yarn run ts-mocha -p ./tsconfig.json -t 1000000 "tests/**/*.ts"  # Run tests directly
yarn lint                           # Lint
yarn lint:fix                       # Lint + autofix
```

**Program ID (devnet):** `ASQCCGt2VKtnMCkrTUurr7u49ZcrCMrjL4q4kFsKGCa2`

## Architecture

Single Anchor program (`goreda`) with four source files:

| File | Responsibility |
|---|---|
| `src/lib.rs` | All 6 instruction handlers + their `Accounts` context structs |
| `src/state.rs` | `Order` and `EscrowAccount` structs + `OrderStatus` enum |
| `src/escrow.rs` | `fund_escrow`, `release_escrow`, `refund_escrow` — fund transfer helpers |
| `src/errors.rs` | `GorEdaError` enum (error codes 6000–6007) |

## PDAs

- **Order:** `[b"order", buyer_pubkey, product_id_le_bytes]`
- **Escrow:** `[b"escrow", order_pubkey]`

## State Machine & Instructions

```
→ Purchased(0)        via purchase()          buyer signs; creates both PDAs; locks SOL in escrow
→ OrderConfirmed(1)   via confirm_order()     seller signs
→ ShippedToValidator(2) via ship_to_validator()  seller signs; records validator pubkey + tracking number
→ ShippedToBuyer(4)   via ship_to_buyer()     validator signs; records tracking number
→ Completed(6)        via complete_order()    buyer signs; releases escrow to seller

OR (early exit, allowed from Purchased or OrderConfirmed only):
→ Refunded(7)         via refund()            buyer signs; returns escrow to buyer
```

States Validated(3) and Delivered(5) exist in the enum but have no instructions yet.

## Escrow Fund Transfers

- **`fund_escrow`** — CPI `system_program::transfer` from buyer (signer) into the escrow PDA during `purchase`
- **`release_escrow`** / **`refund_escrow`** — Direct lamport manipulation (not CPI) because the escrow PDA is program-owned; system_program cannot sign for it

## Authorization Pattern

Each instruction uses `has_one` constraints on the `Order` account to enforce role-based access:
- `has_one = seller` — only the recorded seller can call seller instructions
- `has_one = buyer` — only the recorded buyer can call buyer instructions
- `has_one = validator` — only the recorded validator can call `ship_to_buyer`

The `validator` field on `Order` is `Pubkey::default()` until `ship_to_validator` assigns it.

## Test Status

`tests/goreda.ts` is a stub calling a non-existent `initialize()` instruction. Tests need to be rewritten against the actual instructions: `purchase`, `confirm_order`, `ship_to_validator`, `ship_to_buyer`, `complete_order`, `refund`.
