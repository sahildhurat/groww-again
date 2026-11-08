"use client";

// Piece by piece (final feature, version B). The investor's goal photo, built one piece per confirmed instalment for
// the first year. Each piece is two-sided: tap it to turn it over and see that month's money and units (only facts
// from the passbook) and the month's memory, if there is one. No prompts to finish it, no reward; after a stop the
// picture simply stays as it is.
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mic, Quote } from "lucide-react";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import { getGoal, type GoalRecord, type MemoryRecord } from "@/lib/keepsake";
import { piecesFor, PIECES } from "@/lib/pieces";
import { formatDate, formatDateTime } from "@/lib/format";
import { monthKey } from "@/lib/flow";
import { useKeepsakeTick } from "./use-keepsake";

const COLS = 4;
const ROWS = 3;
// Used when no photo was added: a calm abstract picture, so the pieces still read as one image.
const DEFAULT_ART =
  "linear-gradient(135deg, #1F7A63 0%, #43A486 30%, #A8D9C8 55%, #EEF3FB 75%, #8EAEE2 100%)";

export function GoalPieces({
  instalments,
  sip,
  memories,
}: {
  instalments: Instalment[];
  sip: PassbookSip;
  memories: Record<string, MemoryRecord>;
}) {
  const tick = useKeepsakeTick();
  const [goal, setGoal] = useState<GoalRecord | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [turned, setTurned] = useState<number | null>(null);
  const { slots, filled } = useMemo(() => piecesFor(instalments), [instalments]);

  useEffect(() => {
    getGoal()
      .then((g) => setGoal(g))
      .finally(() => setLoaded(true));
  }, [tick]);

  if (!loaded) return null;
  const art = goal?.photo ? `url("${goal.photo}")` : DEFAULT_ART;
  const turnedSlot = turned ? slots.find((s) => s.n === turned) : undefined;
  const turnedInst = turnedSlot && turnedSlot.kind === "filled" ? turnedSlot.inst : undefined;
  const memory = turnedInst ? memories[monthKey(turnedInst.due_date)] : undefined;
  const allotment = turnedInst?.events.find((e) => e.type === "allotment");

  return (
    <section className="bg-white rounded-3xl border border-gray-200/70 p-4 space-y-3" data-testid="goal-pieces">
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900">
          Piece by piece{goal?.label ? `: ${goal.label}` : ""}
        </h2>
        <p className="text-[12px] text-gray-500 mt-0.5" data-testid="pieces-count">
          {filled} of {PIECES} pieces in your first year. A piece is added each time a month&apos;s units are confirmed in
          your name.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-2xl overflow-hidden" role="list" aria-label="Your goal, piece by piece">
        {slots.map((slot) => {
          const col = (slot.n - 1) % COLS;
          const row = Math.floor((slot.n - 1) / COLS);
          const bgPos = `${(col / (COLS - 1)) * 100}% ${(row / (ROWS - 1)) * 100}%`;
          if (slot.kind === "filled") {
            const isTurned = turned === slot.n;
            const d = slot.inst.due_date;
            return (
              <button
                key={slot.n}
                type="button"
                role="listitem"
                onClick={() => setTurned(isTurned ? null : slot.n)}
                aria-pressed={isTurned}
                aria-label={`Piece ${slot.n}: ${formatDate(d)}, ${slot.inst.units?.toFixed(3)} units. ${isTurned ? "Turn back" : "Turn over for details"}`}
                className="relative aspect-[4/3] [perspective:600px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                data-testid="piece"
              >
                <span
                  className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
                    isTurned ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  <span
                    className="absolute inset-0 [backface-visibility:hidden]"
                    style={{ backgroundImage: art, backgroundSize: `${COLS * 100}% ${ROWS * 100}%`, backgroundPosition: bgPos }}
                  />
                  <span className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-ink text-white flex flex-col items-center justify-center leading-tight">
                    <span className="text-[11px] text-white/70">{formatDate(d).replace(/^\d+ /, "")}</span>
                    <span className="text-[12px] font-semibold">{slot.inst.units?.toFixed(3)}</span>
                    <span className="text-[10px] text-white/70">units</span>
                  </span>
                </span>
              </button>
            );
          }
          if (slot.kind === "waiting") {
            return (
              <Link
                key={slot.n}
                href={`/passbook/${slot.inst.id}`}
                role="listitem"
                className="aspect-[4/3] flex items-center justify-center text-center bg-blue-50 border border-dashed border-blue-400 text-blue-800 text-[10px] leading-tight px-1"
                data-testid="piece-waiting"
              >
                Waiting for units
              </Link>
            );
          }
          return <span key={slot.n} role="listitem" aria-label={`Piece ${slot.n}: not added yet`} className="aspect-[4/3] bg-gray-100" />;
        })}
      </div>

      {turnedInst && (
        <div className="rounded-2xl bg-gray-50 border border-gray-200/70 p-3 space-y-1.5" data-testid="piece-back">
          <p className="text-[13px] font-semibold text-gray-900">
            Piece {turned}: {formatDate(turnedInst.due_date)}
          </p>
          <p className="text-[12px] text-gray-700">
            ₹{turnedInst.amount.toLocaleString("en-IN")} became {turnedInst.units?.toFixed(3)} units
            {turnedInst.nav ? ` at NAV ₹${turnedInst.nav.toFixed(2)}` : ""}.
          </p>
          {allotment?.status === "confirmed" && (
            <p className="text-[11px] text-gray-500">
              Confirmed by {allotment.source_label.toLowerCase()} · {formatDateTime(allotment.effective_at || allotment.as_of)}
            </p>
          )}
          {memory && (
            <div className="flex items-center gap-2 pt-1" data-testid="piece-memory">
              {memory.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memory.photo} alt={`Your photo for ${formatDate(turnedInst.due_date)}`} className="w-10 h-10 rounded-lg object-cover" />
              )}
              {memory.voice && <Mic className="w-4 h-4 text-violet-700" aria-label="Voice note" />}
              {memory.text && (
                <span className="text-[12px] italic text-gray-800 inline-flex items-center gap-1">
                  <Quote className="w-3 h-3 text-violet-700" aria-hidden />
                  {memory.text}
                </span>
              )}
            </div>
          )}
          <Link href={`/passbook/${turnedInst.id}`} className="inline-block text-[12px] font-medium text-emerald-800 underline">
            Open this month
          </Link>
        </div>
      )}

      <p className="text-[11px] text-gray-500 leading-relaxed">
        Pieces count confirmed instalments. They don&apos;t show what your goal costs or when you could buy it.
        {!goal?.photo && (
          <>
            {" "}
            <Link href="/start" className="underline">
              Add your goal photo
            </Link>{" "}
            on the Start SIP screen.
          </>
        )}
      </p>
    </section>
  );
}
