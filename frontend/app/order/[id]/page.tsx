"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { OrderTimeline, type TimelineEvent } from "@/components/OrderTimeline";
import {
  PRODUCTS,
  SELLER_INFO,
  ORDER_STATUS_LABELS,
  solscanTxUrl,
  type OrderStatusKey,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Mock data — simulates on-chain order state
// ---------------------------------------------------------------------------

function buildMockOrder(productId: number, purchaseTxHash?: string) {
  const product = PRODUCTS[productId] ?? PRODUCTS[0];
  return {
    productId: product.id,
    price: product.price,
    status: "Purchased" as OrderStatusKey,
    validator: { name: "SeoulNode-1", address: "5yzXaJXk...J7ZP" },
    events: [
      {
        status: "Purchased",
        timestamp: new Date(),
        txHash:
          purchaseTxHash ?? "3Xc5H8j2K9p4L5m6N7o8Q9r0S1t2U3v4W5x6Y7z",
      },
    ] as TimelineEvent[],
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const productId = Number(searchParams.get("product") ?? 0);
  const purchaseTx = searchParams.get("tx") ?? undefined;

  const [order, setOrder] = useState(() =>
    buildMockOrder(productId, purchaseTx)
  );
  const [escrowBalance, setEscrowBalance] = useState(order.price);
  const [walletDelta, setWalletDelta] = useState(0);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundTx, setRefundTx] = useState<string | null>(null);

  const product = PRODUCTS[order.productId] ?? PRODUCTS[0];

  // Simulate WebSocket real-time update (in production: accountSubscribe)
  useEffect(() => {
    // Placeholder: in real build, subscribe to order PDA here
  }, [connection, id]);

  // -----------------------------------------------------------------------
  // Advance helpers (seller/validator actions simulated inline for demo)
  // -----------------------------------------------------------------------
  const advanceTo = (next: OrderStatusKey) => {
    const fakeHash =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2);
    setOrder((prev) => ({
      ...prev,
      status: next,
      events: [
        ...prev.events,
        { status: next, timestamp: new Date(), txHash: fakeHash },
      ],
    }));
  };

  // -----------------------------------------------------------------------
  // Refund — WOW #2
  // -----------------------------------------------------------------------
  const handleRefund = async () => {
    if (
      order.status !== "Purchased" &&
      order.status !== "OrderConfirmed"
    )
      return;

    setIsRefunding(true);

    // Simulate on-chain refund
    await new Promise((r) => setTimeout(r, 800));

    const fakeHash =
      "refund_" +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2);

    setRefundTx(fakeHash);
    setOrder((prev) => ({
      ...prev,
      status: "Refunded",
      events: [
        ...prev.events,
        { status: "Refunded", timestamp: new Date(), txHash: fakeHash },
      ],
    }));

    // Animate escrow drain
    const steps = 20;
    const decrement = order.price / steps;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 40));
      setEscrowBalance(Math.max(0, order.price - decrement * i));
      setWalletDelta(+(decrement * i).toFixed(4));
    }
    setEscrowBalance(0);
    setWalletDelta(order.price);
    setIsRefunding(false);
  };

  // -----------------------------------------------------------------------
  // Complete order — release escrow
  // -----------------------------------------------------------------------
  const handleComplete = () => {
    advanceTo("Completed");
    const steps = 20;
    const decrement = order.price / steps;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setEscrowBalance(Math.max(0, order.price - decrement * i));
      if (i >= steps) {
        clearInterval(interval);
        setEscrowBalance(0);
      }
    }, 40);
  };

  const canRefund =
    order.status === "Purchased" || order.status === "OrderConfirmed";
  const canComplete = order.status === "ShippedToBuyer";
  const isRefunded = order.status === "Refunded";
  const isCompleted = order.status === "Completed";

  return (
    <>
      <Navbar />

      <main>
        {/* Header */}
        <div className="border-b border-outline-variant/20 py-6 px-6 md:px-16">
          <div className="max-w-[1280px] mx-auto flex items-center gap-4">
            <Link
              href="/buyer"
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition uppercase tracking-[0.15em]"
            >
              &larr; Back
            </Link>
            <div className="w-px h-4 bg-outline-variant" />
            <p className="text-xs text-outline font-mono">Order: {id}</p>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10 grid md:grid-cols-[300px_1fr] gap-10">
          {/* ---- Left column: product + escrow ---- */}
          <div className="space-y-6">
            {/* Product card */}
            <div className="border border-outline-variant/30 bg-white overflow-hidden">
              <div className="relative aspect-[3/4]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5 space-y-1">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em]">
                  {product.brand}
                </p>
                <p className="font-serif text-xl text-primary">
                  {product.name}
                </p>
                <p className="text-secondary font-bold">
                  {product.price} SOL
                </p>
              </div>
            </div>

            {/* Escrow balance — WOW #2 visual */}
            <div className="border border-outline-variant/30 bg-white p-5 space-y-3">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em]">
                Escrow Balance
              </p>
              <p className="font-serif text-3xl text-primary tabular-nums">
                {escrowBalance.toFixed(4)}{" "}
                <span className="text-sm text-on-surface-variant font-sans">
                  SOL
                </span>
              </p>
              {/* Progress bar */}
              <div className="h-1.5 bg-surface-container-high w-full rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-100"
                  style={{
                    width: `${(escrowBalance / order.price) * 100}%`,
                  }}
                />
              </div>

              {walletDelta > 0 && (
                <p className="text-xs text-secondary font-semibold">
                  +{walletDelta.toFixed(4)} SOL returned to buyer
                </p>
              )}
            </div>

            {/* Seller info */}
            <div className="border border-outline-variant/30 bg-white p-5 space-y-1">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em]">
                Seller
              </p>
              <p className="text-sm font-semibold text-primary">
                {SELLER_INFO.name}
              </p>
              <p className="text-xs text-on-surface-variant">
                {SELLER_INFO.rating} / 5.0 &middot; {SELLER_INFO.reviews}{" "}
                reviews
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {canRefund && (
                <button
                  onClick={handleRefund}
                  disabled={isRefunding}
                  className="w-full py-3.5 border border-error text-error text-xs font-semibold uppercase tracking-[0.15em]
                             hover:bg-error hover:text-white transition disabled:opacity-50"
                >
                  {isRefunding ? "Refunding..." : "Instant Refund"}
                </button>
              )}

              {canComplete && (
                <button
                  onClick={handleComplete}
                  className="w-full py-3.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em]
                             hover:opacity-80 transition"
                >
                  Confirm Delivery
                </button>
              )}

              {isRefunded && (
                <div className="w-full py-3.5 border border-error/30 text-center text-xs text-error font-semibold uppercase tracking-[0.15em]">
                  Refunded
                </div>
              )}

              {isCompleted && (
                <div className="w-full py-3.5 border border-secondary/30 text-center text-xs text-secondary font-semibold uppercase tracking-[0.15em]">
                  Completed &mdash; Escrow Released
                </div>
              )}
            </div>
          </div>

          {/* ---- Right column: timeline + tracking ---- */}
          <div className="space-y-8">
            {/* Status badge */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                  Current Status
                </p>
                <p
                  className={`font-serif text-2xl ${
                    isRefunded ? "text-error" : "text-primary"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </p>
              </div>
              {/* "3 days vs 3 seconds" banner for refund */}
              {isRefunded && (
                <div className="bg-error-container border border-error/20 px-5 py-3">
                  <p className="text-xs text-error font-semibold">
                    Traditional: 3 days &mdash; GoReda: 3 seconds
                  </p>
                </div>
              )}
            </div>

            {/* Timeline — WOW #1 */}
            <div className="border border-outline-variant/30 bg-white p-6">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-6">
                On-Chain Shipping Timeline
              </p>
              <OrderTimeline
                currentStatus={order.status}
                events={order.events}
              />
            </div>

            {/* Refund receipt */}
            {refundTx && (
              <div className="border border-error/20 bg-error-container/30 p-6 space-y-2">
                <p className="text-[10px] font-semibold text-error uppercase tracking-[0.15em]">
                  Refund Receipt
                </p>
                <p className="text-sm text-on-surface-variant">
                  Escrow balance transferred back to buyer wallet in{" "}
                  <span className="text-primary font-semibold">
                    1 transaction
                  </span>
                  .
                </p>
                <a
                  href={solscanTxUrl(refundTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-secondary hover:text-primary font-mono transition-colors"
                >
                  View on Solscan: {refundTx.slice(0, 24)}...
                </a>
              </div>
            )}

            {/* Demo controls — simulate seller/validator actions */}
            <div className="border border-outline-variant/30 bg-white p-6 space-y-3">
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-2">
                Demo Controls (Simulate Seller / Validator)
              </p>
              <div className="flex flex-wrap gap-2">
                {order.status === "Purchased" && (
                  <button
                    onClick={() => advanceTo("OrderConfirmed")}
                    className="px-4 py-2.5 border border-outline-variant text-xs font-semibold tracking-[0.15em] hover:bg-surface-container transition uppercase"
                  >
                    Seller: Confirm Order
                  </button>
                )}
                {order.status === "OrderConfirmed" && (
                  <button
                    onClick={() => advanceTo("ShippedToValidator")}
                    className="px-4 py-2.5 border border-outline-variant text-xs font-semibold tracking-[0.15em] hover:bg-surface-container transition uppercase"
                  >
                    Seller: Ship to Validator
                  </button>
                )}
                {order.status === "ShippedToValidator" && (
                  <button
                    onClick={() => advanceTo("Validated")}
                    className="px-4 py-2.5 border border-outline-variant text-xs font-semibold tracking-[0.15em] hover:bg-surface-container transition uppercase"
                  >
                    Validator: Mark Received
                  </button>
                )}
                {order.status === "Validated" && (
                  <button
                    onClick={() => advanceTo("ShippedToBuyer")}
                    className="px-4 py-2.5 border border-outline-variant text-xs font-semibold tracking-[0.15em] hover:bg-surface-container transition uppercase"
                  >
                    Validator: Ship to Buyer
                  </button>
                )}
              </div>
              <p className="text-[10px] text-outline">
                In production these actions are on-chain transactions signed by
                each actor. For the demo, click to simulate.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
