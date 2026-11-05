"use client";

import React from "react";
import { Calendar, RefreshCw } from "lucide-react";
import Link from "next/link";

interface ReturnDateCardProps {
  returnDate: string;
  returnLabel?: string | null;
  status: "paused" | "stopped";
}

export function ReturnDateCard({
  returnDate,
  returnLabel,
  status,
}: ReturnDateCardProps) {
  const formattedDate = new Date(returnDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm space-y-2">
      <div className="flex items-center space-x-2 text-emerald-800">
        <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {status === "paused" ? "SIP Paused" : "Locker Open"}
        </span>
      </div>

      <p className="text-xs font-medium text-gray-900 leading-snug">
        Your locker stays open. You plan to return on{" "}
        <span className="font-bold text-emerald-800">{formattedDate}</span>
        {returnLabel ? ` (${returnLabel})` : ""}.
      </p>

      <div className="pt-2 flex items-center justify-between text-xs">
        <span className="text-[11px] text-gray-500">
          Plan ready for one-tap restart
        </span>
        <Link
          href="/break"
          className="inline-flex items-center space-x-1 text-emerald-700 font-semibold hover:underline"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Adjust return plan</span>
        </Link>
      </div>
    </div>
  );
}
