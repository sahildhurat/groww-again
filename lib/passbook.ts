import { Instalment, InstalmentState } from "./passbook-types";

export function instalmentState(i: Instalment): InstalmentState {
  if (i.skipped) return "skipped";

  const debit = i.events.find((e) => e.type === "debit");
  const order = i.events.find((e) => e.type === "order");
  const allotment = i.events.find((e) => e.type === "allotment");
  const refund = i.events.find((e) => e.type === "refund");

  // unknown: any needed event is unknown
  const anyUnknown = i.events.some((e) => e.status === "unknown");
  if (anyUnknown && !allotment?.status?.match(/confirmed/)) return "unknown";

  // allotted: allotment confirmed
  if (allotment && allotment.status === "confirmed") return "allotted";

  // failed: debit failed
  if (debit && debit.status === "failed") return "failed";

  // refunded: debit confirmed, order failed, refund confirmed or pending
  if (
    debit &&
    debit.status === "confirmed" &&
    order &&
    order.status === "failed" &&
    (refund?.status === "confirmed" || refund?.status === "pending")
  )
    return "refunded";

  // in_progress: debit confirmed, allotment pending
  if (debit && debit.status === "confirmed") return "in_progress";

  return "unknown";
}

export function lastFullyConfirmed(instalments: Instalment[]): Instalment | null {
  const allotted = instalments
    .filter((i) => instalmentState(i) === "allotted")
    .sort((a, b) => b.due_date.localeCompare(a.due_date));
  return allotted[0] ?? null;
}

export function latestInstalment(instalments: Instalment[]): Instalment | null {
  if (instalments.length === 0) return null;
  return [...instalments].sort((a, b) =>
    b.due_date.localeCompare(a.due_date)
  )[0];
}

export interface ConfirmedTotals {
  units: number;
  amount_put_in: number;
  count: number;
}

export function confirmedTotals(instalments: Instalment[]): ConfirmedTotals {
  const allotted = instalments.filter((i) => instalmentState(i) === "allotted");
  const rawUnits = allotted.reduce((sum, i) => sum + (i.units ?? 0), 0);
  return {
    units: Math.round(rawUnits * 1000) / 1000,
    amount_put_in: allotted.reduce((sum, i) => sum + i.amount, 0),
    count: allotted.length,
  };
}

export function valueAt(totals: { units: number }, nav: number): number {
  return Math.round(totals.units * nav);
}
