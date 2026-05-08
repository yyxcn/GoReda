"use client";

import { useState, useEffect, useCallback, useRef, useMemo, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  useWallet,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Navbar } from "@/components/Navbar";
import { OrderTimeline, type TimelineEvent } from "@/components/OrderTimeline";
import {
  PRODUCTS,
  SELLER_INFO,
  ORDER_STATUS_LABELS,
  solscanTxUrl,
  type OrderStatusKey,
} from "@/lib/constants";
import {
  getProgram,
  fetchOrderByPDA,
  fetchOrderTxSignatures,
  type OnChainOrder,
} from "@/lib/program";

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
  const anchorWallet = useAnchorWallet();

  const productIdParam = Number(searchParams.get("product") ?? -1);

  const [order, setOrder] = useState<OnChainOrder | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [escrowBalance, setEscrowBalance] = useState<number>(0);
  const [walletDelta, setWalletDelta] = useState(0);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Stable reference to avoid re-render loops
  const orderPDA = useMemo(() => {
    try {
      return new PublicKey(id);
    } catch {
      return null;
    }
  }, [id]);

  const loadingRef = useRef(false);

  // -----------------------------------------------------------------------
  // Load order from chain (with dedup guard)
  // -----------------------------------------------------------------------
  const loadOrder = useCallback(async () => {
    if (!anchorWallet || !orderPDA || loadingRef.current) return;
    loadingRef.current = true;

    try {
      const program = getProgram(connection, anchorWallet);
      const fetched = await fetchOrderByPDA(program, orderPDA);

      if (!fetched) {
        setError("Order not found on chain.");
        setLoading(false);
        return;
      }

      setOrder(fetched);
      setEscrowBalance(
        fetched.status === "Refunded" || fetched.status === "Completed"
          ? 0
          : fetched.price
      );

      // Fetch tx signatures for timeline
      const sigs = await fetchOrderTxSignatures(connection, orderPDA);

      // Map tx signatures to timeline steps
      const statusSteps = getStatusHistory(fetched.status);
      const newEvents: TimelineEvent[] = statusSteps.map((status, idx) => ({
        status,
        timestamp: sigs[idx]
          ? new Date((sigs[idx].blockTime ?? 0) * 1000)
          : new Date(fetched.createdAt * 1000),
        txHash: sigs[idx]?.signature,
      }));

      setEvents(newEvents);
      setError(null);
    } catch (err) {
      console.error("Failed to load order:", err);
      setError("Failed to load order from chain.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [anchorWallet, connection, orderPDA]);

  // Load when wallet changes
  useEffect(() => {
    loadingRef.current = false;
    loadOrder();
  }, [loadOrder]);

  // -----------------------------------------------------------------------
  // WebSocket subscription for real-time updates (stable, no loop)
  // -----------------------------------------------------------------------
  const loadOrderRef = useRef(loadOrder);
  loadOrderRef.current = loadOrder;

  useEffect(() => {
    if (!anchorWallet || !orderPDA) return;

    let debounce: ReturnType<typeof setTimeout>;
    const subId = connection.onAccountChange(
      orderPDA,
      () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => loadOrderRef.current(), 500);
      },
      "confirmed"
    );

    return () => {
      clearTimeout(debounce);
      connection.removeAccountChangeListener(subId);
    };
    // Only re-subscribe when connection or orderPDA identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, orderPDA?.toBase58()]);

  // -----------------------------------------------------------------------
  // Refund — WOW #2 (real on-chain transaction)
  // -----------------------------------------------------------------------
  const handleRefund = async () => {
    if (!anchorWallet || !publicKey || !order || !orderPDA) return;
    if (order.status !== "Purchased" && order.status !== "OrderConfirmed")
      return;

    setIsRefunding(true);

    try {
      const program = getProgram(connection, anchorWallet);

      const sig = await program.methods
        .refund()
        .accounts({
          order: orderPDA,
        })
        .rpc();

      setLastTxHash(sig);

      // Animate escrow drain
      const price = order.price;
      const steps = 20;
      const decrement = price / steps;
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 40));
        setEscrowBalance(Math.max(0, price - decrement * i));
        setWalletDelta(+(decrement * i).toFixed(4));
      }
      setEscrowBalance(0);
      setWalletDelta(price);

      // Update local state immediately (WebSocket will also fire)
      setOrder((prev) =>
        prev ? { ...prev, status: "Refunded" as OrderStatusKey } : prev
      );
      setEvents((prev) => [
        ...prev,
        { status: "Refunded", timestamp: new Date(), txHash: sig },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("User rejected")) {
        alert(`Refund failed: ${msg}`);
      }
    } finally {
      setIsRefunding(false);
    }
  };

  // -----------------------------------------------------------------------
  // Complete order — release escrow (real on-chain transaction)
  // -----------------------------------------------------------------------
  const handleComplete = async () => {
    if (!anchorWallet || !publicKey || !order || !orderPDA) return;
    if (order.status !== "ShippedToBuyer") return;

    setIsCompleting(true);

    try {
      const program = getProgram(connection, anchorWallet);

      const sig = await program.methods
        .completeOrder()
        .accounts({
          seller: order.seller,
          order: orderPDA,
        })
        .rpc();

      setLastTxHash(sig);

      // Animate escrow drain to seller
      const price = order.price;
      const steps = 20;
      const decrement = price / steps;
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 40));
        setEscrowBalance(Math.max(0, price - decrement * i));
      }
      setEscrowBalance(0);

      setOrder((prev) =>
        prev ? { ...prev, status: "Completed" as OrderStatusKey } : prev
      );
      setEvents((prev) => [
        ...prev,
        { status: "Completed", timestamp: new Date(), txHash: sig },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("User rejected")) {
        alert(`Complete failed: ${msg}`);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  // Invalid PDA
  if (!orderPDA) {
    return (
      <>
        <Navbar />
        <main className="max-w-[1280px] mx-auto px-6 md:px-16 py-20 text-center">
          <p className="font-serif text-2xl text-error">Invalid Order ID</p>
        </main>
      </>
    );
  }

  const product = order
    ? (PRODUCTS[order.productId] ?? PRODUCTS[0])
    : productIdParam >= 0
      ? (PRODUCTS[productIdParam] ?? PRODUCTS[0])
      : PRODUCTS[0];

  const canRefund =
    order?.status === "Purchased" || order?.status === "OrderConfirmed";
  const canComplete = order?.status === "ShippedToBuyer";
  const isRefunded = order?.status === "Refunded";
  const isCompleted = order?.status === "Completed";
  const currentStatus = order?.status ?? "Purchased";

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-[1280px] mx-auto px-6 md:px-16 py-20 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-on-surface-variant">
            Loading order from Solana...
          </p>
        </main>
      </>
    );
  }

  // Error state
  if (error && !order) {
    return (
      <>
        <Navbar />
        <main className="max-w-[1280px] mx-auto px-6 md:px-16 py-20 text-center">
          <p className="font-serif text-2xl text-error mb-3">{error}</p>
          <Link
            href="/orders"
            className="text-xs text-secondary hover:text-primary font-semibold uppercase tracking-[0.15em]"
          >
            Back to My Orders
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main>
        {/* Header */}
        <div className="border-b border-outline-variant/20 py-6 px-6 md:px-16">
          <div className="max-w-[1280px] mx-auto flex items-center gap-4">
            <Link
              href="/orders"
              className="text-xs font-semibold text-on-surface-variant hover:text-primary transition uppercase tracking-[0.15em]"
            >
              &larr; My Orders
            </Link>
            <div className="w-px h-4 bg-outline-variant" />
            <p className="text-xs text-outline font-mono">
              Order: {id.slice(0, 8)}...{id.slice(-4)}
            </p>
            <div className="w-px h-4 bg-outline-variant" />
            <span className="inline-block px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-semibold uppercase tracking-wider">
              On-Chain
            </span>
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
                    width: `${order ? (escrowBalance / order.price) * 100 : 100}%`,
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
                  disabled={isCompleting}
                  className="w-full py-3.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em]
                             hover:opacity-80 transition disabled:opacity-50"
                >
                  {isCompleting ? "Confirming..." : "Confirm Delivery"}
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
                  {ORDER_STATUS_LABELS[currentStatus]}
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
                currentStatus={currentStatus}
                events={events}
              />
            </div>

            {/* Last transaction */}
            {lastTxHash && (
              <div
                className={`border p-6 space-y-2 ${
                  isRefunded
                    ? "border-error/20 bg-error-container/30"
                    : "border-secondary/20 bg-secondary/5"
                }`}
              >
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.15em] ${
                    isRefunded ? "text-error" : "text-secondary"
                  }`}
                >
                  {isRefunded ? "Refund Receipt" : "Transaction Receipt"}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {isRefunded
                    ? "Escrow balance transferred back to buyer wallet in "
                    : "Escrow released to seller in "}
                  <span className="text-primary font-semibold">
                    1 transaction
                  </span>
                  .
                </p>
                <a
                  href={solscanTxUrl(lastTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-secondary hover:text-primary font-mono transition-colors"
                >
                  View on Solscan: {lastTxHash.slice(0, 24)}...
                </a>
              </div>
            )}

            {/* On-chain order data */}
            {order && (
              <div className="border border-outline-variant/30 bg-white p-6 space-y-3">
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-2">
                  On-Chain Data
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-outline mb-0.5">Buyer</p>
                    <p className="font-mono text-on-surface-variant truncate">
                      {order.buyer.toBase58().slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-outline mb-0.5">Seller</p>
                    <p className="font-mono text-on-surface-variant truncate">
                      {order.seller.toBase58().slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-outline mb-0.5">Order PDA</p>
                    <p className="font-mono text-on-surface-variant truncate">
                      {order.publicKey.toBase58().slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-outline mb-0.5">Created</p>
                    <p className="text-on-surface-variant">
                      {new Date(order.createdAt * 1000).toLocaleString()}
                    </p>
                  </div>
                  {order.validator.toBase58() !==
                    "11111111111111111111111111111111" && (
                    <div className="col-span-2">
                      <p className="text-outline mb-0.5">Validator</p>
                      <p className="font-mono text-on-surface-variant truncate">
                        {order.validator.toBase58()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusHistory(current: OrderStatusKey): string[] {
  const normalFlow = [
    "Purchased",
    "OrderConfirmed",
    "ShippedToValidator",
    "ShippedToBuyer",
    "Completed",
  ];

  if (current === "Refunded") {
    return ["Purchased", "Refunded"];
  }

  const idx = normalFlow.indexOf(current);
  if (idx < 0) {
    if (current === "Validated") {
      return ["Purchased", "OrderConfirmed", "ShippedToValidator", "Validated"];
    }
    if (current === "Delivered") {
      return ["Purchased", "OrderConfirmed", "ShippedToValidator", "ShippedToBuyer"];
    }
    return ["Purchased"];
  }

  return normalFlow.slice(0, idx + 1);
}
