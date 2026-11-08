"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, HelpCircle, Home, SlidersHorizontal } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Final MVP (8 Nov): Life Markers live inside each month. Link check (9 Nov): Home is a tab, because the Start SIP
  // demo is reached from Home; before, Home was only behind the passbook's back arrow.
  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Passbook", href: "/passbook", icon: BookOpen },
    { label: "Ask", href: "/ask", icon: HelpCircle },
    { label: "Next steps", href: "/options", icon: SlidersHorizontal },
  ];

  return (
    <nav className="sticky bottom-0 z-40 w-full bg-white/95 backdrop-blur border-t border-gray-200/70 flex items-center justify-around py-1.5 px-1 no-print">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
              isActive
                ? "text-emerald-700 font-semibold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span className={`mb-0.5 px-4 py-1 rounded-full transition-colors ${isActive ? "bg-emerald-50" : ""}`}>
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-2"}`} />
            </span>
            <span className="text-[11px] leading-tight tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
