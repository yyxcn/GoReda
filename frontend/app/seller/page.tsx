"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { Navbar } from "@/components/Navbar";
import { ValidatorSelector } from "@/components/ValidatorSelector";
import {
  PRODUCTS,
  ORDER_STATUS_LABELS,
  type ValidatorNode,
  type OrderStatusKey,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Mock orders (pre-populated for demo)
// ---------------------------------------------------------------------------
interface DemoOrder {
  id: string;
  productId: number;
  buyer: string;
  price: number;
  status: OrderStatusKey;
  createdAt: Date;
  validator?: ValidatorNode;
}

const INITIAL_ORDERS: DemoOrder[] = [
  {
    id: "order_1",
    productId: 0,
    buyer: "A7Q9...StUv",
    price: 2.5,
    status: "Purchased",
    createdAt: new Date(Date.now() - 5 * 60_000),
  },
  {
    id: "order_2",
    productId: 2,
    buyer: "B8R0...TuVw",
    price: 2.8,
    status: "Purchased",
    createdAt: new Date(Date.now() - 2 * 60_000),
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SellerPage() {
  const { publicKey } = useWallet();
  const [orders, setOrders] = useState<DemoOrder[]>(INITIAL_ORDERS);
  const [validatorModal, setValidatorModal] = useState<string | null>(null);

  const advance = (orderId: string, next: OrderStatusKey) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: next } : o))
    );
  };

  const selectValidator = (orderId: string, v: ValidatorNode) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              validator: v,
              status: "ShippedToValidator" as OrderStatusKey,
            }
          : o
      )
    );
  };

  return (
    <>
      <Navbar />

      <main>
        {/* Header */}
        <div className="border-b border-outline-variant/20 py-10 px-6 md:px-16">
          <div className="max-w-[1280px] mx-auto">
            <span className="text-xs font-semibold tracking-[0.15em] text-secondary uppercase block mb-1">
              Manage
            </span>
            <h1 className="font-serif text-4xl text-primary">
              Order Management
            </h1>
            {publicKey && (
              <p className="text-xs text-on-surface-variant mt-2 font-mono">
                {publicKey.toBase58().slice(0, 4)}...
                {publicKey.toBase58().slice(-4)}
              </p>
            )}
          </div>
        </div>

        {/* Orders */}
        <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-4">
            Incoming Orders ({orders.length})
          </p>

          {orders.map((order) => {
            const product = PRODUCTS[order.productId];
            return (
              <div
                key={order.id}
                className="border border-outline-variant/30 bg-white p-6 hover:border-primary/40 transition"
              >
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
                      {order.buyer}
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
                    <p className="text-sm font-semibold text-secondary">
                      {ORDER_STATUS_LABELS[order.status]}
                    </p>
                  </div>

                  {/* Validator */}
                  <div className="flex-1 min-w-[120px]">
                    <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-[0.15em] mb-1">
                      Validator
                    </p>
                    {order.validator ? (
                      <p className="text-sm font-semibold text-secondary">
                        {order.validator.name}
                      </p>
                    ) : (
                      <p className="text-sm text-outline">Not assigned</p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  {order.status === "Purchased" && (
                    <button
                      onClick={() => advance(order.id, "OrderConfirmed")}
                      className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition"
                    >
                      Confirm Order
                    </button>
                  )}

                  {order.status === "OrderConfirmed" && (
                    <button
                      onClick={() => setValidatorModal(order.id)}
                      className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition"
                    >
                      Ship to Validator
                    </button>
                  )}

                  {order.status === "ShippedToValidator" && (
                    <button
                      onClick={() => advance(order.id, "ShippedToBuyer")}
                      className="px-6 py-2.5 bg-primary text-on-primary text-xs font-semibold uppercase tracking-[0.15em] hover:opacity-80 transition"
                    >
                      Ship to Buyer (skip validation)
                    </button>
                  )}

                  {(order.status === "ShippedToBuyer" ||
                    order.status === "Completed") && (
                    <span className="px-6 py-2.5 border border-outline-variant text-xs text-on-surface-variant uppercase tracking-[0.15em]">
                      {order.status === "Completed"
                        ? "Done"
                        : "Awaiting buyer confirmation"}
                    </span>
                  )}

                  <Link
                    href={`/order/${order.id}`}
                    className="px-6 py-2.5 border border-outline-variant text-xs font-semibold uppercase tracking-[0.15em] hover:bg-surface-container transition"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
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
      </main>

      {/* Validator selector modal */}
      <ValidatorSelector
        isOpen={!!validatorModal}
        onClose={() => setValidatorModal(null)}
        onSelect={(v) => {
          if (validatorModal) selectValidator(validatorModal, v);
        }}
      />
    </>
  );
}
