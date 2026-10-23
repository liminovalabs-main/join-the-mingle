"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MinglerLogo } from "@/components/brand/mingler-logo";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  href: string;
}

const PUBLIC_LINKS: NavLink[] = [
  { label: "Mingles", href: "/browse" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About Us", href: "/about" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinkClass =
    "text-xs font-bold uppercase tracking-[0.16em] text-brand-ivory/70 hover:text-brand-ivory transition-colors";

  return (
    <header className="sticky top-0 z-50 bg-brand-navy/95 backdrop-blur-md border-b border-brand-ivory/10">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20">
        {/* Brand Wordmark Logo */}
        <Link href="/" aria-label="Mingler — Home" className="leading-none">
          <MinglerLogo size="text-2xl md:text-3xl" />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">
          {PUBLIC_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  navLinkClass,
                  isActive && "text-brand-ivory"
                )}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Action CTAs */}
          <Link href="/login" className={navLinkClass}>
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-brand-coral px-6 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition-all hover:bg-brand-coral/90 shadow-md shadow-brand-coral/25 active:scale-95"
          >
            Join Mingler
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="text-brand-ivory p-2 md:hidden rounded-lg hover:bg-brand-ivory/10 transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown matching Base44 */}
      {mobileMenuOpen && (
        <div className="space-y-1 border-t border-brand-ivory/10 bg-brand-navy px-5 py-5 md:hidden animate-in fade-in-0 slide-in-from-top-2 duration-150">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-sm font-bold uppercase tracking-[0.16em] text-brand-ivory/80 transition-colors hover:text-brand-ivory"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-brand-ivory/10 space-y-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-bold uppercase tracking-[0.16em] text-brand-ivory/80 hover:text-brand-ivory"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center rounded-full bg-brand-coral py-3 text-xs font-bold uppercase tracking-[0.16em] text-white hover:bg-brand-coral/90 shadow-sm"
            >
              Join Mingler
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
