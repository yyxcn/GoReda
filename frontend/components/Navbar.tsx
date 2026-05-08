"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (m) => m.WalletMultiButton
    ),
  { ssr: false }
);

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/buyer", label: "Marketplace" },
    { href: "/seller", label: "Orders" },
  ];

  return (
    <nav className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30">
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-[32px] tracking-tighter text-primary"
        >
          GoReda
        </Link>

        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-semibold uppercase tracking-[0.15em] transition-colors ${
                pathname === link.href
                  ? "text-secondary border-b-2 border-secondary pb-1"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}
