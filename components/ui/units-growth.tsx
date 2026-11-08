"use client";

// Owner, 8 Nov (visual pass): the asset view of the SIP. Each bar is the number of units in your name at the end of
// that month. Bars only grow when units are allotted; a failed, refunded or skipped month keeps the bar flat, and a
// month still waiting for units shows an outline. Nothing is predicted: the outline sits at the confirmed height.
import React from "react";
import type { Instalment } from "@/lib/passbook-types";
import { instalmentState } from "@/lib/passbook";

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Bar = { label: string; full: string; units: number; added: number; state: string };

export function UnitsGrowth({ instalments }: { instalments: Instalment[] }) {
  const asc = [...instalments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  let running = 0;
  const bars: Bar[] = asc.map((i) => {
    const state = instalmentState(i);
    const added = state === "allotted" ? i.units ?? 0 : 0;
    running += added;
    const m = parseInt(i.due_date.slice(5, 7), 10) - 1;
    return { label: MONTH[m].slice(0, 1), full: `${MONTH[m]} ${i.due_date.slice(0, 4)}`, units: running, added, state };
  });
  if (bars.length === 0) return null;

  const max = Math.max(...bars.map((b) => b.units), 1);
  const W = 340;
  const H = 132;
  const top = 18;
  const base = 104;
  const gap = 6;
  const bw = (W - gap * (bars.length - 1)) / bars.length;
  const total = bars[bars.length - 1].units;
  const flat = bars.filter((b) => b.state !== "allotted" && b.state !== "in_progress" && b.state !== "unknown").length;

  return (
    <section className="bg-white rounded-3xl border border-gray-200/70 p-4" data-testid="units-growth">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-gray-900">Units in your name, month by month</h2>
      </div>
      <p className="text-[12px] text-gray-500 mt-0.5">
        Every confirmed month adds units, and they stay yours when the price moves.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full mt-3"
        role="img"
        aria-label={`Units in your name grew to ${total.toFixed(3)} over ${bars.length} months; ${flat} months added no units.`}
      >
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={base - (base - top) * f} y2={base - (base - top) * f} stroke="#EAEEF3" strokeWidth={1} />
        ))}
        <line x1={0} x2={W} y1={base} y2={base} stroke="#DAE0E8" strokeWidth={1} />
        {bars.map((b, idx) => {
          const x = idx * (bw + gap);
          const h = Math.max(2, ((base - top) * b.units) / max);
          const y = base - h;
          const waiting = b.state === "in_progress" || b.state === "unknown";
          const added = b.state === "allotted";
          return (
            <g key={idx}>
              <title>
                {`${b.full}: ${added ? `+${b.added.toFixed(3)} units, ` : ""}${b.units.toFixed(3)} units in your name${
                  waiting ? " (waiting for this month's units)" : !added ? " (no units added this month)" : ""
                }`}
              </title>
              {waiting ? (
                <rect x={x + 0.75} y={y + 0.75} width={bw - 1.5} height={h - 1.5} rx={4} fill="#EEF3FB" stroke="#5F87CF" strokeWidth={1.5} strokeDasharray="3 2.5" />
              ) : (
                <rect x={x} y={y} width={bw} height={h} rx={4} fill={added ? "#1F7A63" : "#DAE0E8"} />
              )}
              {!added && !waiting && <circle cx={x + bw / 2} cy={y - 6} r={2.2} fill="#8B5A3C" />}
              <text x={x + bw / 2} y={base + 15} textAnchor="middle" fontSize={10} fill="#5A6679">
                {b.label}
              </text>
            </g>
          );
        })}
        <text x={W} y={10} textAnchor="end" fontSize={11} fontWeight={600} fill="#14213D">
          {total.toFixed(3)} units
        </text>
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-600">
        <li className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" aria-hidden /> Units added
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-200 relative" aria-hidden /> No units that month
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border border-dashed border-blue-400 bg-blue-50" aria-hidden /> Waiting for units
        </li>
      </ul>
    </section>
  );
}
