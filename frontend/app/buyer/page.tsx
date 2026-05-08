"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useWallet,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, SELLER_ADDRESS, solscanTxUrl } from "@/lib/constants";
import { getProgram, getOrderPDA } from "@/lib/program";

interface PurchaseResult {
  productId: number;
  txHash: string;
  orderPDA: string;
}

export default function BuyerPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(
    null
  );

  const categories = [
    "ALL",
    ...Array.from(new Set(PRODUCTS.map((p) => p.category.toUpperCase()))),
  ];

  const filteredProducts =
    activeFilter === "ALL"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category.toUpperCase() === activeFilter);

  const handlePurchase = useCallback(
    async (productId: number) => {
      if (!publicKey || !anchorWallet) {
        alert("Please connect your wallet first.");
        return;
      }

      const product = PRODUCTS.find((p) => p.id === productId)!;
      setPurchasingId(productId);

      try {
        const program = getProgram(connection, anchorWallet);
        const priceInLamports = new BN(
          Math.floor(product.price * LAMPORTS_PER_SOL)
        );
        const productIdBN = new BN(productId);
        const sellerPubkey = new PublicKey(SELLER_ADDRESS);

        const sig = await program.methods
          .purchase(productIdBN, priceInLamports)
          .accounts({ seller: sellerPubkey })
          .rpc();

        const [orderPDA] = getOrderPDA(publicKey, productId);

        // Show success modal
        setPurchaseResult({
          productId,
          txHash: sig,
          orderPDA: orderPDA.toBase58(),
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (!msg.includes("User rejected")) {
          alert(`Purchase failed: ${msg}`);
        }
      } finally {
        setPurchasingId(null);
      }
    },
    [publicKey, anchorWallet, connection]
  );

  const purchasedProduct = purchaseResult
    ? PRODUCTS.find((p) => p.id === purchaseResult.productId)
    : null;

  return (
    <>
      <Navbar />

      <main>
        {/* Filter Bar */}
        <div className="bg-surface-container-low border-b border-outline-variant/20 sticky top-20 z-40">
          <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-5 flex justify-between items-center overflow-x-auto">
            <div className="flex gap-4 shrink-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`text-xs font-semibold uppercase tracking-[0.15em] px-5 py-2 transition-colors whitespace-nowrap ${
                    activeFilter === cat
                      ? "text-primary bg-primary-fixed/30 rounded-full"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-[10px] font-semibold tracking-[0.2em] text-on-surface-variant uppercase shrink-0 ml-4">
              {filteredProducts.length} Products
              <span className="mx-2 opacity-30">|</span>
              Curated Selection
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPurchase={handlePurchase}
                isPurchasing={purchasingId === product.id}
              />
            ))}
          </div>
        </div>

        {/* Verification Section */}
        <section className="bg-primary-fixed/30 py-16 mt-8 border-y border-outline-variant/20">
          <div className="max-w-[1280px] mx-auto px-6 md:px-16 flex flex-col items-center text-center">
            <h2 className="font-serif text-4xl text-primary mb-4">
              On-Chain Trust Engine
            </h2>
            <p className="text-base text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
              GoReda uses programmable escrow to ensure your wines are authentic
              and delivered before funds are released.
            </p>
            <div className="flex gap-12 items-center">
              <div className="flex flex-col items-center">
                <span className="font-serif text-5xl text-primary">
                  100%
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-on-surface-variant uppercase">
                  Authentic
                </span>
              </div>
              <div className="w-px h-10 bg-outline-variant" />
              <div className="flex flex-col items-center">
                <span className="font-serif text-5xl text-primary">
                  Instant
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-on-surface-variant uppercase">
                  Verification
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Age Verification Toast */}
      {!ageConfirmed && (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 pointer-events-none">
          <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-md p-6 rounded-lg border border-outline-variant/40 pointer-events-auto shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                By accessing GoReda, you confirm you are of legal drinking age
                in your jurisdiction. We utilize on-chain escrow to ensure
                transaction integrity and provenance of all wine assets.
              </p>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setAgeConfirmed(true)}
                  className="bg-primary text-on-primary text-[11px] font-semibold tracking-[0.15em] px-8 py-3 rounded-lg hover:opacity-80 transition-colors uppercase"
                >
                  I Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {purchaseResult && purchasedProduct && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/40 w-full max-w-md shadow-2xl">
            {/* Success header */}
            <div className="p-8 text-center border-b border-outline-variant/20">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="font-serif text-2xl text-primary mb-2">
                Order Confirmed
              </h2>
              <p className="text-sm text-on-surface-variant">
                Your purchase has been locked in escrow on Solana.
              </p>
            </div>

            {/* Order details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 bg-surface-container-high rounded overflow-hidden relative shrink-0">
                  <img
                    src={purchasedProduct.image}
                    alt={purchasedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em]">
                    {purchasedProduct.brand}
                  </p>
                  <p className="font-serif text-lg text-primary">
                    {purchasedProduct.name}
                  </p>
                  <p className="text-secondary font-bold text-sm">
                    {purchasedProduct.price} SOL escrowed
                  </p>
                </div>
              </div>

              {/* Tx hash */}
              <div className="bg-surface-container-low p-3 border border-outline-variant/20">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                  Transaction Hash
                </p>
                <a
                  href={solscanTxUrl(purchaseResult.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-secondary hover:text-primary font-mono transition-colors break-all"
                >
                  {purchaseResult.txHash.slice(0, 32)}...
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setPurchaseResult(null)}
                className="flex-1 py-3 border border-outline-variant text-xs font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition"
              >
                Continue Shopping
              </button>
              <button
                onClick={() =>
                  router.push(
                    `/order/${purchaseResult.orderPDA}?product=${purchaseResult.productId}&tx=${purchaseResult.txHash}`
                  )
                }
                className="flex-1 py-3 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition"
              >
                View Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
