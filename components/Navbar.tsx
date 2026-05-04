"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";

export default function Navbar() {
  const path = usePathname();
  const links = [
    { name: "Generator", href: "/" },
    { name: "Library", href: "/library" },
  ];

  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-oat/60 backdrop-blur-2xl border-2 border-forest/10 rounded-full px-1.5 py-1.5 shadow-2xl shadow-forest/10">
        {links.map((link) => {
          const isActive = path === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-8 py-2.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${
                isActive ? "text-oat" : "text-forest/40 hover:text-forest"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-forest rounded-full shadow-lg shadow-forest/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
