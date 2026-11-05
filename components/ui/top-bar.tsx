"use client";

import React from "react";
import { ArrowLeft, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export function TopBar({
  title = "SIP locker (concept)",
  showBack = false,
  backHref,
  rightAction,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 px-4 py-3.5 flex items-center justify-between no-print shadow-sm">
      <div className="flex items-center space-x-3">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-1 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-gray-900 truncate tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-2">
        {rightAction || (
          <a
            href="/consent"
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
            title="Account & Privacy"
          >
            <UserCircle className="w-5 h-5 text-gray-400" />
          </a>
        )}
      </div>
    </header>
  );
}
