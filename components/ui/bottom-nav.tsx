"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, HelpCircle, SlidersHorizontal } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Final MVP (8 Nov): three tabs; Life Markers live inside each month now.
  const navItems = [
    { label: "Passbook", href: "/passbook", icon: BookOpen },
    { label: "Ask", href: "/ask", icon: HelpCircle },
    { label: "Next steps", href: "/options", icon: SlidersHorizontal },
  ];

  return (
    <nav className="sticky bottom-0 z-40 w-full bg-white border-t border-gray-100 flex items-center justify-around py-2 px-1 no-print shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
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
                ? "text-emerald-600 font-semibold"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? "stroke-[2.2]" : "stroke-2"}`} />
            <span className="text-[11px] leading-tight tracking-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
