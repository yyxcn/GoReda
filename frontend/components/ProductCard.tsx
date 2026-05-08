"use client";

import Image from "next/image";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    brand: string;
    price: number;
    image: string;
    category: string;
  };
  onPurchase: (productId: number) => void;
  isPurchasing?: boolean;
}

export function ProductCard({
  product,
  onPurchase,
  isPurchasing,
}: ProductCardProps) {
  return (
    <div className="group border border-outline-variant/30 p-6 flex flex-col justify-between hover:border-primary/40 transition-colors bg-white">
      {/* Top badges */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant/60 uppercase">
            GoReda Certified
          </span>
          <span className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase">
            {product.category}
          </span>
        </div>
        <div className="bg-surface-container text-on-surface-variant text-[10px] font-semibold tracking-[0.15em] px-2 py-1 border border-outline-variant/20 uppercase flex items-center gap-1">
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          Escrow
        </div>
      </div>

      {/* Image */}
      <div className="relative h-64 mb-6 overflow-hidden bg-surface-container-low">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Info */}
      <div className="border-t border-outline-variant/20 pt-5">
        <p className="text-[10px] font-semibold tracking-[0.15em] text-on-surface-variant uppercase mb-1">
          {product.brand}
        </p>
        <h3 className="font-serif text-2xl text-primary mb-1 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs font-semibold tracking-[0.15em] text-secondary mb-5 uppercase">
          {product.price} SOL
        </p>
        <div className="grid grid-cols-2 gap-px bg-outline-variant/20 border border-outline-variant/20">
          <button className="bg-surface py-3.5 text-[11px] font-semibold tracking-[0.15em] hover:bg-surface-container transition-colors uppercase">
            Details
          </button>
          <button
            onClick={() => onPurchase(product.id)}
            disabled={isPurchasing}
            className="bg-surface py-3.5 text-[11px] font-semibold tracking-[0.15em] hover:bg-primary hover:text-white transition-colors uppercase disabled:opacity-50"
          >
            {isPurchasing ? "Processing..." : "Quick Buy"}
          </button>
        </div>
      </div>
    </div>
  );
}
