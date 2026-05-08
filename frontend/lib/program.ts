import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./idl/goreda.json";
import type { Goreda } from "./idl/goreda";

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
  const productIdBuffer = Buffer.alloc(8);
  productIdBuffer.writeBigUInt64LE(BigInt(productId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("order"), buyer.toBuffer(), productIdBuffer],
    PROGRAM_ID
  );
}

export function getEscrowPDA(orderPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), orderPubkey.toBuffer()],
    PROGRAM_ID
  );
}