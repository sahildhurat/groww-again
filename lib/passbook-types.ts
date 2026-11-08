export type SipStatus = "active" | "paused" | "stopped";
export type EventType = "debit" | "order" | "allotment" | "refund";
export type EventStatus = "confirmed" | "pending" | "failed" | "unknown";
export type Source = "bank" | "order_route" | "registrar";

export interface PassbookEvent {
  id: string;
  instalment_id: string;
  type: EventType;
  status: EventStatus;
  source: Source;
  source_label: string;
  source_event_id: string;
  effective_at: string | null;
  as_of: string;
  reason_code?: string;
}

export interface Instalment {
  id: string;
  due_date: string;
  amount: number;
  nav: number | null;
  units: number | null;
  skipped?: boolean;
  events: PassbookEvent[];
}

export interface PassbookSip {
  id: string;
  name: string;
  fund_label: string;
  amount: number;
  day_of_month: number;
  start_date: string;
  status: SipStatus;
  status_changed_at: string | null;
  latest_nav: number;
  latest_nav_date: string;
  /** How the instalments are paid, e.g. "Groww AutoPay". Sets which allotment timing applies (Groww help 61). */
  payment_route?: string;
  dedication?: string | null;
}

export type InstalmentState =
  | "allotted"
  | "in_progress"
  | "failed"
  | "refunded"
  | "skipped"
  | "unknown";
