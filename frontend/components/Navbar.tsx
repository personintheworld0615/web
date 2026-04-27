"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md border border-charcoal/10 rounded-full px-2 py-1.5 shadow-lg">
        <Link
          href="/"
          className={`px-5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest transition-all ${
            path === "/" 
              ? "bg-charcoal text-oat shadow" 
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          Generator
        </Link>
        <Link
          href="/library"
          className={`px-5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest transition-all ${
            path === "/library" 
              ? "bg-charcoal text-oat shadow" 
              : "text-charcoal/50 hover:text-charcoal"
          }`}
        >
          Library
        </Link>
      </div>
    </nav>
  );
}
