"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  useWallet,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import {
  PRODUCTS,
  ORDER_STATUS_LABELS,
  TIMELINE_STEPS,
  solscanAccountUrl,
  type OrderStatusKey,
} from "@/lib/constants";
import {
  getProgram,
  fetchBuyerOrders,
  getEscrowPDA,
  type OnChainOrder,
} from "@/lib/program";

// ---------------------------------------------------------------------------
// Status progress helpers
// ---------------------------------------------------------------------------
const NORMAL_FLOW: OrderStatusKey[] = [
  "Purchased",
  "OrderConfirmed",
  "ShippedToValidator",
  "Validated",
  "ShippedToBuyer",
  "Completed",
];

function getProgressPercent(status: OrderStatusKey): number {
  if (status === "Refunded") return 100;
  const idx = NORMAL_FLOW.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / NORMAL_FLOW.length) * 100);
}

function getStatusColor(status: OrderStatusKey): string {
  if (status === "Refunded") return "text-error";
  if (status === "Completed") return "text-secondary";
  return "text-primary";
}

function getProgressBarColor(status: OrderStatusKey): string {
  if (status === "Refunded") return "bg-error";
  if (status === "Completed") return "bg-secondary";
  return "bg-primary";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MyOrdersPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [orders, setOrders] = useState<OnChainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const loadingRef = useRef(false);

  const loadOrders = useCallback(async () => {
    if (!publicKey || !anchorWallet) {
      setOrders([]);
      setLoading(false);
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const program = getProgram(connection, anchorWallet);
      const result = await fetchBuyerOrders(program, publicKey);
      result.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(result);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders from chain.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [publicKey, anchorWallet, connection]);

  // Load when wallet changes
  useEffect(() => {
    loadingRef.current = false;
    loadOrders();
  }, [loadOrders]);

  // Reset Demo — refund active orders, close already-refunded ones
  const handleResetDemo = async () => {
    if (!publicKey || !anchorWallet || orders.length === 0) return;
    setResetting(true);

    try {
      const program = getProgram(connection, anchorWallet);

      for (const order of orders) {
        try {
          if (
            order.status === "Purchased" ||
            order.status === "OrderConfirmed"
          ) {
            // refund — closes accounts + returns all lamports
            await program.methods
              .refund()
              .accounts({ order: order.publicKey })
              .rpc();
          } else if (
            order.status === "Refunded" ||
            order.status === "Completed"
          ) {
            // close_order — just closes stale accounts
            await program.methods
              .closeOrder()
              .accounts({ order: order.publicKey })
              .rpc();
          }
        } catch (err) {
          console.warn(`Skip order ${order.publicKey.toBase58()}:`, err);
        }
      }

      loadingRef.current = false;
      await loadOrders();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setResetting(false);
    }
  };

  // WebSocket — stable ref, debounced
  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    if (!publicKey || !anchorWallet || orders.length === 0) return;

    let debounce: ReturnType<typeof setTimeout>;
    const subscriptions: number[] = [];

    for (const order of orders) {
      const subId = connection.onAccountChange(
        order.publicKey,
        () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => loadOrdersRef.current(), 500);
        },
        "confirmed"
      );
      subscriptions.push(subId);
    }

    return () => {
      clearTimeout(debounce);
      subscriptions.forEach((sid) =>
        connection.removeAccountChangeListener(sid)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, publicKey?.toBase58(), orders.length]);

  return (
    <>
      <Navbar />

      <main>
        {/* Header */}
        <div className="border-b border-outline-variant/20 py-10 px-6 md:px-16">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold tracking-[0.15em] text-secondary uppercase block mb-1">
                Track
              </span>
              <h1 className="font-serif text-4xl text-primary">My Orders</h1>
              {publicKey && (
                <p className="text-xs text-on-surface-variant mt-2 font-mono">
                  {publicKey.toBase58().slice(0, 4)}...
                  {publicKey.toBase58().slice(-4)}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {orders.length > 0 && (
                <button
                  onClick={handleResetDemo}
                  disabled={resetting || loading}
                  className="px-5 py-2.5 border border-error/40 text-error text-xs font-semibold uppercase tracking-[0.15em] hover:bg-error/5 transition disabled:opacity-50"
                >
                  {resetting ? "Resetting..." : "Reset Demo"}
                </button>
              )}
              <button
                onClick={loadOrders}
                disabled={loading}
                className="px-5 py-2.5 border border-outline-variant text-xs font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10">
          {/* Not connected */}
          {!publicKey && (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-primary mb-3">
                Connect Your Wallet
              </p>
              <p className="text-sm text-on-surface-variant">
                Connect your wallet to view your purchase history and track
                shipments in real-time.
              </p>
            </div>
          )}

          {/* Loading */}
          {publicKey && loading && (
            <div className="text-center py-20">
              <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm text-on-surface-variant">
                Fetching orders from Solana...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="border border-error/30 bg-error-container/30 p-4 mb-6">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {publicKey && !loading && orders.length === 0 && !error && (
            <div className="text-center py-20">
              <p className="font-serif text-2xl text-primary mb-3">
                No Orders Yet
              </p>
              <p className="text-sm text-on-surface-variant mb-6">
                Your on-chain purchase history will appear here.
              </p>
              <Link
                href="/buyer"
                className="inline-block px-8 py-3 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition"
              >
                Browse Marketplace
              </Link>
            </div>
          )}

          {/* Order list */}
          {orders.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-4">
                {orders.length} Order{orders.length > 1 ? "s" : ""} Found
                On-Chain
              </p>

              {orders.map((order) => {
                const product = PRODUCTS[order.productId] ?? PRODUCTS[0];
                const progress = getProgressPercent(order.status);
                const currentStep = TIMELINE_STEPS.findIndex(
                  (s) => s.status === order.status
                );

                return (
                  <Link
                    key={order.publicKey.toBase58()}
                    href={`/order/${order.publicKey.toBase58()}?product=${order.productId}`}
                    className="block border border-outline-variant/30 bg-white hover:border-primary/40 transition group"
                  >
                    <div className="flex gap-0">
                      {/* Product image */}
                      <div className="relative w-28 md:w-36 shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Order info */}
                      <div className="flex-1 p-5 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em]">
                              {product.brand}
                            </p>
                            <p className="font-serif text-lg text-primary group-hover:text-secondary transition-colors">
                              {product.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-secondary font-bold">
                              {order.price} SOL
                            </p>
                            <p
                              className={`text-xs font-semibold mt-0.5 ${getStatusColor(order.status)}`}
                            >
                              {ORDER_STATUS_LABELS[order.status]}
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(order.status)}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* Mini timeline */}
                        <div className="flex justify-between items-center gap-1">
                          {TIMELINE_STEPS.map((step, idx) => (
                            <div
                              key={step.status}
                              className="flex-1 text-center"
                            >
                              <p
                                className={`text-[9px] font-semibold tracking-wide truncate ${
                                  idx <= currentStep &&
                                  order.status !== "Refunded"
                                    ? "text-primary"
                                    : "text-on-surface-variant/30"
                                }`}
                              >
                                {step.label.split(" ").slice(0, 2).join(" ")}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 mt-3 text-[10px] text-outline">
                          <span className="font-mono">
                            PDA: {order.publicKey.toBase58().slice(0, 8)}...
                          </span>
                          <button
                            className="text-secondary hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(
                                solscanAccountUrl(order.publicKey.toBase58()),
                                "_blank"
                              );
                            }}
                          >
                            View on Solscan
                          </button>
                          <span>
                            {new Date(
                              order.createdAt * 1000
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
