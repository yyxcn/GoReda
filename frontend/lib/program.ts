import { Program, AnchorProvider, setProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./idl/goreda.json";
import type { Goreda } from "./idl/goreda";
import { PRODUCTS, type OrderStatusKey } from "./constants";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "ASQCCGt2VKtnMCkrTUurr7u49ZcrCMrjL4q4kFsKGCa2"
);

export function getProgram(connection: Connection, wallet: AnchorWallet) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  setProvider(provider);
  return new Program<Goreda>(idl as Goreda, provider);
}

// PDA helpers
export function getOrderPDA(buyer: PublicKey, productId: number) {
  const productIdBuffer = new Uint8Array(8);
  const view = new DataView(productIdBuffer.buffer);
  view.setBigUint64(0, BigInt(productId), true); // little-endian
  return PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("order"),
      buyer.toBytes(),
      productIdBuffer,
    ],
    PROGRAM_ID
  );
}

export function getEscrowPDA(orderPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("escrow"), orderPubkey.toBytes()],
    PROGRAM_ID
  );
}

// ---------------------------------------------------------------------------
// On-chain data helpers
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
export function parseOrderStatus(status: any): OrderStatusKey {
  if ("purchased" in status) return "Purchased";
  if ("orderConfirmed" in status) return "OrderConfirmed";
  if ("shippedToValidator" in status) return "ShippedToValidator";
  if ("validated" in status) return "Validated";
  if ("shippedToBuyer" in status) return "ShippedToBuyer";
  if ("delivered" in status) return "Delivered";
  if ("completed" in status) return "Completed";
  if ("refunded" in status) return "Refunded";
  return "Purchased";
}

export interface OnChainOrder {
  publicKey: PublicKey;
  productId: number;
  price: number;       // in SOL
  priceLamports: BN;
  status: OrderStatusKey;
  buyer: PublicKey;
  seller: PublicKey;
  validator: PublicKey;
  trackingToValidator: string;
  trackingToBuyer: string;
  createdAt: number;
  updatedAt: number;
}

function decodeOrder(pubkey: PublicKey, raw: any): OnChainOrder {
  return {
    publicKey: pubkey,
    productId: (raw.productId as BN).toNumber(),
    price: (raw.price as BN).toNumber() / LAMPORTS_PER_SOL,
    priceLamports: raw.price as BN,
    status: parseOrderStatus(raw.status),
    buyer: raw.buyer as PublicKey,
    seller: raw.seller as PublicKey,
    validator: raw.validator as PublicKey,
    trackingToValidator: raw.trackingToValidator as string,
    trackingToBuyer: raw.trackingToBuyer as string,
    createdAt: (raw.createdAt as BN).toNumber(),
    updatedAt: (raw.updatedAt as BN).toNumber(),
  };
}

/** Fetch all orders for a buyer by computing PDAs for each product. */
export async function fetchBuyerOrders(
  program: Program<Goreda>,
  buyer: PublicKey
): Promise<OnChainOrder[]> {
  const pdas = PRODUCTS.map((p) => getOrderPDA(buyer, p.id));
  const pubkeys = pdas.map(([pda]) => pda);

  const accounts = await program.account.order.fetchMultiple(pubkeys);

  const results: OnChainOrder[] = [];
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i]) {
      results.push(decodeOrder(pubkeys[i], accounts[i]));
    }
  }
  return results;
}

/** Fetch all orders for a seller using getProgramAccounts. */
export async function fetchSellerOrders(
  program: Program<Goreda>,
  seller: PublicKey
): Promise<OnChainOrder[]> {
  // seller field offset: 8 (discriminator) + 32 (buyer) = 40
  const raw = await program.account.order.all([
    { memcmp: { offset: 40, bytes: seller.toBase58() } },
  ]);
  return raw.map((r) => decodeOrder(r.publicKey, r.account));
}

/** Fetch single order by PDA pubkey. Returns null if not found. */
export async function fetchOrderByPDA(
  program: Program<Goreda>,
  orderPDA: PublicKey
): Promise<OnChainOrder | null> {
  try {
    const raw = await program.account.order.fetch(orderPDA);
    return decodeOrder(orderPDA, raw);
  } catch {
    return null;
  }
}

/** Fetch tx signatures for an order PDA (for timeline). Oldest first. */
export async function fetchOrderTxSignatures(
  connection: Connection,
  orderPDA: PublicKey
): Promise<{ signature: string; blockTime: number | null }[]> {
  const sigs = await connection.getSignaturesForAddress(orderPDA, { limit: 20 });
  return sigs
    .map((s) => ({ signature: s.signature, blockTime: s.blockTime ?? null }))
    .reverse(); // oldest first
}