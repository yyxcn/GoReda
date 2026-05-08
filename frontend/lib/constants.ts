// ============================================================================
// Products — 12 premium wines & spirits
// Every product links to a single hardcoded seller for the demo.
// ============================================================================

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number; // SOL
  image: string;
  category: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 0,
    name: "Grand Vin 2018",
    brand: "Château Margaux",
    price: 2.5,
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&h=500&fit=crop",
    category: "Red Wine",
  },
  {
    id: 1,
    name: "Vintage Brut 2012",
    brand: "Dom Pérignon",
    price: 3.0,
    image: "https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=400&h=500&fit=crop",
    category: "Champagne",
  },
  {
    id: 2,
    name: "Napa Valley 2019",
    brand: "Opus One",
    price: 2.8,
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=500&fit=crop",
    category: "Red Wine",
  },
  {
    id: 3,
    name: "Sauvignon Blanc 2023",
    brand: "Cloudy Bay",
    price: 0.5,
    image: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&h=500&fit=crop",
    category: "White Wine",
  },
  {
    id: 4,
    name: "Grange Shiraz 2017",
    brand: "Penfolds",
    price: 4.0,
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=500&fit=crop",
    category: "Red Wine",
  },
  {
    id: 5,
    name: "Yellow Label Brut",
    brand: "Veuve Clicquot",
    price: 0.8,
    image: "https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&h=500&fit=crop",
    category: "Champagne",
  },
  {
    id: 6,
    name: "Tignanello 2019",
    brand: "Antinori",
    price: 1.5,
    image: "https://images.unsplash.com/photo-1569919659476-f0852f6834b7?w=400&h=500&fit=crop",
    category: "Red Wine",
  },
  {
    id: 7,
    name: "18 Year Single Malt",
    brand: "Yamazaki",
    price: 5.0,
    image: "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=400&h=500&fit=crop",
    category: "Whisky",
  },
  {
    id: 8,
    name: "Bolgheri 2018",
    brand: "Sassicaia",
    price: 2.2,
    image: "https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?w=400&h=500&fit=crop",
    category: "Red Wine",
  },
  {
    id: 9,
    name: "Rosé Impérial",
    brand: "Moët & Chandon",
    price: 0.7,
    image: "https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=400&h=500&fit=crop",
    category: "Champagne",
  },
  {
    id: 10,
    name: "Barolo Monfortino 2015",
    brand: "Giacomo Conterno",
    price: 3.5,
    image: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400&h=500&fit=crop",
    category: "Red Wine",
  },
  {
    id: 11,
    name: "X.O Cognac",
    brand: "Hennessy",
    price: 2.0,
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=500&fit=crop",
    category: "Cognac",
  },
];

// ============================================================================
// Validator Nodes — 8 nodes with hardcoded distance & stake
// ============================================================================

export interface ValidatorNode {
  id: number;
  name: string;
  address: string;
  distance: number; // meters from current location
  stake: number; // SOL
  uptime: number; // percent
  location: string;
}

export const VALIDATORS: ValidatorNode[] = [
  { id: 1, name: "SeoulNode-1",          address: "5yzXaJXk8t6HyN6xvQVQv3c7PqvRLAkwGBJq3kVJJ7ZP", distance: 320,    stake: 450.5,  uptime: 99.8, location: "Seoul, Jongno-gu"  },
  { id: 2, name: "GangnamValidator",      address: "8kZfXmCzEcN3jPmQ9vRtL2hKpLqMnOpQrStUvWxYzQrP", distance: 1200,   stake: 2100.25,uptime: 99.9, location: "Seoul, Gangnam-gu" },
  { id: 3, name: "IncheonRelayer",        address: "GzMqnVcK2zPqL5rTwVxYzAbCdEfGhIjKlMnOpQrStUvP", distance: 45000,  stake: 850.75, uptime: 99.5, location: "Incheon, Yeonsu-gu" },
  { id: 4, name: "BusanNode-Fast",        address: "HnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCP", distance: 328000, stake: 1250.0, uptime: 99.7, location: "Busan, Haeundae-gu" },
  { id: 5, name: "DaeguValidator",        address: "IoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDP", distance: 236000, stake: 680.5,  uptime: 99.4, location: "Daegu, Jung-gu" },
  { id: 6, name: "SuwonNode",             address: "JpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEP", distance: 35000,  stake: 1920.0, uptime: 99.9, location: "Suwon, Paldal-gu" },
  { id: 7, name: "DaejeonValidator",      address: "KqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeEP", distance: 162000, stake: 755.25, uptime: 99.3, location: "Daejeon, Seo-gu" },
  { id: 8, name: "GwangjuNode-Premium",   address: "LrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfFP", distance: 312000, stake: 3100.75,uptime: 99.95,location: "Gwangju, Seo-gu" },
];

// ============================================================================
// Hardcoded Seller — all products map to one seller for demo
// ============================================================================

export const SELLER_ADDRESS =
  process.env.NEXT_PUBLIC_SELLER_ADDRESS ??
  "G5jFGXVFUJ3R5QXx8xKnFrTvVwXyZaBcDeFgHiJkLmNo";

export const SELLER_INFO = {
  name: "Grand Cru Cellars",
  verified: true,
  rating: 4.9,
  reviews: 342,
};

// ============================================================================
// Order Status — must mirror the on-chain enum in state.rs
// ============================================================================

export type OrderStatusKey =
  | "Purchased"
  | "OrderConfirmed"
  | "ShippedToValidator"
  | "Validated"
  | "ShippedToBuyer"
  | "Delivered"
  | "Completed"
  | "Refunded";

export const ORDER_STATUS_LABELS: Record<OrderStatusKey, string> = {
  Purchased: "Escrow Locked",
  OrderConfirmed: "Seller Confirmed",
  ShippedToValidator: "Shipped to Validator",
  Validated: "Validated",
  ShippedToBuyer: "Shipped to Buyer",
  Delivered: "Delivered",
  Completed: "Completed",
  Refunded: "Refunded",
};

// ============================================================================
// Buyer-visible timeline steps (matches CLAUDE.md demo flow)
// ============================================================================

export const TIMELINE_STEPS: { status: OrderStatusKey; label: string }[] = [
  { status: "Purchased",          label: "Purchase Request" },
  { status: "OrderConfirmed",     label: "Seller Confirmed" },
  { status: "ShippedToValidator", label: "Shipped to Validator" },
  { status: "Validated",          label: "Validator Received" },
  { status: "ShippedToBuyer",     label: "Shipped to Buyer" },
  { status: "Completed",          label: "Purchase Confirmed" },
];

// ============================================================================
// Helpers
// ============================================================================

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

export function solscanTxUrl(hash: string): string {
  return `https://solscan.io/tx/${hash}?cluster=devnet`;
}

export function solscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}?cluster=devnet`;
}
