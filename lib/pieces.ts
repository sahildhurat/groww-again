// Piece by piece (final feature, 8 Nov 2026). The goal photo is split into 12 pieces for the first year. A piece is
// added only when an instalment's units are confirmed by the registrar, in order of confirmed instalments, so a failed,
// refunded or skipped month leaves no hole (the passbook still lists it). Pieces count confirmed instalments; they say
// nothing about how much the goal costs or when it could be bought.
import type { Instalment } from "@/lib/passbook-types";
import { instalmentState } from "@/lib/passbook";

export const PIECES = 12;

export type Slot =
  | { kind: "filled"; n: number; inst: Instalment }
  | { kind: "waiting"; n: number; inst: Instalment }
  | { kind: "empty"; n: number };

export function piecesFor(instalments: Instalment[]): { slots: Slot[]; filled: number } {
  const asc = [...instalments].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const confirmed = asc.filter((i) => instalmentState(i) === "allotted").slice(0, PIECES);
  const latest = asc[asc.length - 1];
  const latestState = latest ? instalmentState(latest) : null;
  const waiting = latest && (latestState === "in_progress" || latestState === "unknown") ? latest : null;

  const slots: Slot[] = [];
  for (let n = 1; n <= PIECES; n++) {
    const inst = confirmed[n - 1];
    if (inst) slots.push({ kind: "filled", n, inst });
    else if (waiting && n === confirmed.length + 1) slots.push({ kind: "waiting", n, inst: waiting });
    else slots.push({ kind: "empty", n });
  }
  return { slots, filled: confirmed.length };
}
