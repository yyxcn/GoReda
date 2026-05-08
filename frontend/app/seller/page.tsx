"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  useWallet,
  useConnection,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { ValidatorSelector } from "@/components/ValidatorSelector";
import Image from "next/image";
import {
  PRODUCTS,
  SELLER_ADDRESS,
  SELLER_INFO,
  ORDER_STATUS_LABELS,
  solscanTxUrl,
  type ValidatorNode,
  type OrderStatusKey,
} from "@/lib/constants";
import {
  getProgram,
  fetchSellerOrders,
  type OnChainOrder,
} from "@/lib/program";

// ---------------------------------------------------------------------------
// Status priority for sorting — lower = higher priority (show first)
// ---------------------------------------------------------------------------
const STATUS_PRIORITY: Record<OrderStatusKey, number> = {
  Purchased: 0,        // 구매 요청 들어온 것 → 최상단
  OrderConfirmed: 1,
  ShippedToValidator: 2,
  Validated: 3,
  ShippedToBuyer: 4,
  Delivered: 5,
  Completed: 6,
  Refunded: 7,
};

function sortOrders(orders: OnChainOrder[]): OnChainOrder[] {
  return [...orders].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 99;
    const pb = STATUS_PRIORITY[b.status] ?? 99;
    if (pa !== pb) return pa - pb; // 상태 우선순위
    return b.createdAt - a.createdAt; // 같은 상태면 최신순
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SellerPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [orders, setOrders] = useState<OnChainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatorModal, setValidatorModal] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<Record<string, string>>({});
  const loadingRef = useRef(false);

  // 현재 연결된 지갑이 셀러인지 확인 (env 주소 일치 OR 주문이 존재)
  const isSeller =
    publicKey &&
    (publicKey.toBase58() === SELLER_ADDRESS || orders.length > 0);

  // -----------------------------------------------------------------------
  // Fetch orders from chain
  // -----------------------------------------------------------------------
  const loadOrders = useCallback(async () => {
    if (!anchorWallet || !publicKey) {
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
      // Use connected wallet, not env var — catches orders regardless of config changes
      const result = await fetchSellerOrders(program, publicKey!);
      setOrders(sortOrders(result));
    } catch (err) {
      console.error("Failed to fetch seller orders:", err);
      setError("Failed to load orders. Make sure you are connected to devnet.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [anchorWallet, connection, publicKey]);

  // Load when wallet/seller status changes
  useEffect(() => {
    loadingRef.current = false;
    loadOrders();
  }, [loadOrders]);

  // WebSocket — stable ref, debounced
  const loadOrdersRef = useRef(loadOrders);
  loadOrdersRef.current = loadOrders;

  useEffect(() => {
    if (!anchorWallet || orders.length === 0) return;

    let debounce: ReturnType<typeof setTimeout>;
    const subs: number[] = [];
    for (const order of orders) {
      const subId = connection.onAccountChange(
        order.publicKey,
        () => {
          clearTimeout(debounce);
          debounce = setTimeout(() => loadOrdersRef.current(), 500);
        },
        "confirmed"
      );
      subs.push(subId);
    }

    return () => {
      clearTimeout(debounce);
      subs.forEach((sid) => connection.removeAccountChangeListener(sid));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection, orders.length]);

  // -----------------------------------------------------------------------
  // On-chain actions
  // -----------------------------------------------------------------------
  const handleConfirmOrder = async (order: OnChainOrder) => {
    if (!anchorWallet || !publicKey) return;
    const key = order.publicKey.toBase58();
    setProcessingOrder(key);

    try {
      const program = getProgram(connection, anchorWallet);
      const sig = await program.methods
        .confirmOrder()
        .accounts({ order: order.publicKey })
        .rpc();

      setLastTx((prev) => ({ ...prev, [key]: sig }));
      loadingRef.current = false;
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("User rejected")) {
        alert(`Confirm failed: ${msg}`);
      }
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleShipToValidator = async (
    order: OnChainOrder,
    validator: ValidatorNode
  ) => {
    if (!anchorWallet || !publicKey) return;
    const key = order.publicKey.toBase58();
    setProcessingOrder(key);

    try {
      const program = getProgram(connection, anchorWallet);
      const trackingNumber = `GR-${Date.now().toString(36).toUpperCase()}-${validator.id}`;

      const sig = await program.methods
        .shipToValidator(publicKey, trackingNumber)
        .accounts({ order: order.publicKey })
        .rpc();

      setLastTx((prev) => ({ ...prev, [key]: sig }));
      loadingRef.current = false;
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("User rejected")) {
        alert(`Ship to validator failed: ${msg}`);
      }
    } finally {
      setProcessingOrder(null);
      setValidatorModal(null);
    }
  };

  const handleShipToBuyer = async (order: OnChainOrder) => {
    if (!anchorWallet || !publicKey) return;
    const key = order.publicKey.toBase58();
    setProcessingOrder(key);

    try {
      const program = getProgram(connection, anchorWallet);
      const trackingNumber = `GR-${Date.now().toString(36).toUpperCase()}-BYR`;

      const sig = await program.methods
        .shipToBuyer(trackingNumber)
        .accounts({ order: order.publicKey })
        .rpc();

      setLastTx((prev) => ({ ...prev, [key]: sig }));
      loadingRef.current = false;
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (!msg.includes("User rejected")) {
        alert(`Ship to buyer failed: ${msg}`);
      }
    } finally {
      setProcessingOrder(null);
    }
  };

  // -----------------------------------------------------------------------
  // Find order for validator modal
  // -----------------------------------------------------------------------
  const modalOrder = validatorModal
    ? orders.find((o) => o.publicKey.toBase58() === validatorModal)
    : null;

  // Count orders needing action
  const actionNeeded = orders.filter(
    (o) =>
      o.status === "Purchased" ||
      o.status === "OrderConfirmed" ||
      o.status === "ShippedToValidator"
  ).length;

  return (
    <>
      <Navbar />

      <main>
        {/* Header */}
        <div className="border-b border-outline-variant/20 py-10 px-6 md:px-16">
          <div className="max-w-[1280px] mx-auto flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold tracking-[0.15em] text-secondary uppercase block mb-1">
                Manage
              </span>
              <h1 className="font-serif text-4xl text-primary">
                Seller Dashboard
              </h1>
              {publicKey && (
                <p className="text-xs text-on-surface-variant mt-2 font-mono">
                  {publicKey.toBase58().slice(0, 4)}...
                  {publicKey.toBase58().slice(-4)}
                  {isSeller && (
                    <span className="ml-2 px-2 py-0.5 bg-secondary/10 text-secondary text-[10px] font-semibold uppercase tracking-wider">
                      Seller
                    </span>
                  )}
                </p>
              )}
            </div>
            {isSeller && (
              <button
                onClick={() => { loadingRef.current = false; loadOrders(); }}
                disabled={loading}
                className="px-5 py-2.5 border border-outline-variant text-xs font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10 space-y-4">
          {/* ============================================================= */}
          {/* 지갑 미연결 */}
          {/* ============================================================= */}
          {!publicKey && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-primary-fixed/30 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              </div>
              <p className="font-serif text-2xl text-primary mb-3">
                Connect Your Wallet
              </p>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                Connect your wallet to check if you have any products listed for sale.
              </p>
            </div>
          )}

          {/* ============================================================= */}
          {/* 바이어 지갑으로 접속한 경우 (셀러가 아님) */}
          {/* ============================================================= */}
          {publicKey && !isSeller && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                </svg>
              </div>
              <p className="font-serif text-2xl text-primary mb-3">
                No Products Listed
              </p>
              <p className="text-sm text-on-surface-variant max-w-lg mx-auto mb-2">
                This wallet doesn&apos;t have any products listed for sale on GoReda.
              </p>
              <p className="text-xs text-outline max-w-lg mx-auto mb-8">
                If you&apos;re a buyer, you can track your purchases in{" "}
                <Link href="/orders" className="text-secondary hover:text-primary font-semibold transition-colors">
                  My Orders
                </Link>
                .
              </p>
              <Link
                href="/orders"
                className="inline-block px-8 py-3 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition"
              >
                Go to My Orders
              </Link>
            </div>
          )}

          {/* ============================================================= */}
          {/* 셀러 지갑으로 접속 — 주문 관리 */}
          {/* ============================================================= */}
          {isSeller && (
            <>
              {/* Loading */}
              {loading && (
                <div className="text-center py-16">
                  <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm text-on-surface-variant">
                    Fetching orders from Solana...
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="border border-error/30 bg-error-container/30 p-4">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {/* Empty */}
              {!loading && orders.length === 0 && !error && (
                <div className="text-center py-16">
                  <p className="font-serif text-2xl text-primary mb-3">
                    No Incoming Orders
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    When buyers purchase your products, orders will appear here in real-time.
                  </p>
                </div>
              )}

              {/* Order list */}
              {!loading && orders.length > 0 && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
                      All Orders ({orders.length})
                    </p>
                    {actionNeeded > 0 && (
                      <span className="px-3 py-1 bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider rounded-full">
                        {actionNeeded} Action Needed
                      </span>
                    )}
                  </div>

                  {orders.map((order) => {
                    const product = PRODUCTS[order.productId] ?? PRODUCTS[0];
                    const key = order.publicKey.toBase58();
                    const isProcessing = processingOrder === key;
                    const txHash = lastTx[key];
                    const needsAction =
                      order.status === "Purchased" ||
                      order.status === "OrderConfirmed" ||
                      order.status === "ShippedToValidator";

                    return (
                      <div
                        key={key}
                        className={`border bg-white p-6 transition ${
                          needsAction
                            ? "border-primary/40 ring-1 ring-primary/10"
                            : "border-outline-variant/30 hover:border-primary/40"
                        }`}
                      >
                        {/* Action needed badge */}
                        {order.status === "Purchased" && (
                          <div className="mb-4 px-3 py-1.5 bg-error/5 border border-error/20 inline-block">
                            <p className="text-[10px] font-bold text-error uppercase tracking-[0.15em]">
                              New Purchase Request — Action Required
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-6 mb-5">
                          {/* Product */}
                          <div className="flex-1 min-w-[140px]">
                            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                              Product
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              {product.name}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {product.brand}
                            </p>
                          </div>

                          {/* Buyer */}
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                              Buyer
                            </p>
                            <p className="text-xs font-mono text-on-surface-variant">
                              {order.buyer.toBase58().slice(0, 4)}...
                              {order.buyer.toBase58().slice(-4)}
                            </p>
                            <p className="text-sm text-secondary font-bold mt-0.5">
                              {order.price} SOL
                            </p>
                          </div>

                          {/* Status */}
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                              Status
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                order.status === "Refunded"
                                  ? "text-error"
                                  : order.status === "Purchased"
                                    ? "text-primary"
                                    : "text-secondary"
                              }`}
                            >
                              {ORDER_STATUS_LABELS[order.status]}
                            </p>
                          </div>

                          {/* Order PDA */}
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                              Order PDA
                            </p>
                            <p className="text-xs font-mono text-on-surface-variant truncate">
                              {key.slice(0, 8)}...{key.slice(-4)}
                            </p>
                          </div>
                        </div>

                        {/* Last tx hash */}
                        {txHash && (
                          <div className="mb-4 px-3 py-2 bg-secondary/5 border border-secondary/10">
                            <a
                              href={solscanTxUrl(txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-secondary hover:text-primary font-mono transition-colors"
                            >
                              tx: {txHash.slice(0, 24)}...
                            </a>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3 flex-wrap">
                          {order.status === "Purchased" && (
                            <button
                              onClick={() => handleConfirmOrder(order)}
                              disabled={isProcessing}
                              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition disabled:opacity-50"
                            >
                              {isProcessing ? "Signing..." : "Confirm Order"}
                            </button>
                          )}

                          {order.status === "OrderConfirmed" && (
                            <button
                              onClick={() => setValidatorModal(key)}
                              disabled={isProcessing}
                              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition disabled:opacity-50"
                            >
                              {isProcessing ? "Signing..." : "Ship to Validator"}
                            </button>
                          )}

                          {order.status === "ShippedToValidator" && (
                            <button
                              onClick={() => handleShipToBuyer(order)}
                              disabled={isProcessing}
                              className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition disabled:opacity-50"
                            >
                              {isProcessing ? "Signing..." : "Ship to Buyer"}
                            </button>
                          )}

                          {order.status === "ShippedToBuyer" && (
                            <span className="px-6 py-2.5 border border-outline-variant text-xs text-on-surface-variant uppercase tracking-[0.15em]">
                              Awaiting buyer confirmation
                            </span>
                          )}

                          {order.status === "Completed" && (
                            <span className="px-6 py-2.5 border border-secondary/30 text-xs text-secondary uppercase tracking-[0.15em]">
                              Done — Escrow Released
                            </span>
                          )}

                          {order.status === "Refunded" && (
                            <span className="px-6 py-2.5 border border-error/30 text-xs text-error uppercase tracking-[0.15em]">
                              Refunded
                            </span>
                          )}

                          <Link
                            href={`/order/${key}?product=${order.productId}`}
                            className="px-6 py-2.5 border border-outline-variant text-xs font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Divider */}
              <div className="border-t border-outline-variant/20 pt-8" />

              {/* Listed Products */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
                    Listed Products ({PRODUCTS.length})
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {SELLER_INFO.name} &middot; {SELLER_INFO.rating}/5.0
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {PRODUCTS.map((product) => {
                    const hasOrder = orders.some(
                      (o) => o.productId === product.id
                    );
                    return (
                      <div
                        key={product.id}
                        className="border border-outline-variant/30 bg-white overflow-hidden group"
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                          {hasOrder && (
                            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-white" />
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-[0.1em] truncate">
                            {product.brand}
                          </p>
                          <p className="text-xs font-serif text-primary truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-secondary font-bold mt-0.5">
                            {product.price} SOL
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats — seller only */}
        {isSeller && orders.length > 0 && (
          <div className="border-t border-outline-variant/20 py-12 px-6 md:px-16">
            <div className="max-w-[1280px] mx-auto grid grid-cols-3 gap-8 text-center">
              <div className="border border-outline-variant/30 bg-white p-6">
                <p className="font-serif text-3xl text-primary">
                  {orders.length}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mt-1">
                  Total Orders
                </p>
              </div>
              <div className="border border-outline-variant/30 bg-white p-6">
                <p className="font-serif text-3xl text-secondary">
                  {orders.reduce((a, o) => a + o.price, 0).toFixed(1)} SOL
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mt-1">
                  Total Volume
                </p>
              </div>
              <div className="border border-outline-variant/30 bg-white p-6">
                <p className="font-serif text-3xl text-primary">
                  $
                  {orders
                    .reduce((a, o) => a + o.price * 180, 0)
                    .toLocaleString()}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-on-surface-variant mt-1">
                  USD Equivalent
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Validator selector modal */}
      <ValidatorSelector
        isOpen={!!validatorModal}
        onClose={() => setValidatorModal(null)}
        onSelect={(v) => {
          if (modalOrder) handleShipToValidator(modalOrder, v);
        }}
      />
    </>
  );
}
