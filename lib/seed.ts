import demoSeedData from "@/data/demo-seed.json";

export interface DemoMemory {
  kind: "photo" | "voice" | "text";
  text?: string | null;
  audio_url?: string | null;
  illustration?: string | null;
  photo_url?: string | null;
}

export interface DemoInstalment {
  id: string;
  due_date: string;
  status: "paid" | "failed" | "skipped" | "paused" | "processing";
  amount: number;
  nav: number | null;
  units: number | null;
  failure_code: string | null;
  failure_text: string | null;
  note: string | null;
  memory: DemoMemory | null;
}

export interface DemoSip {
  id: string;
  name: string;
  dedication: string;
  fund_label: string;
  amount: number;
  day_of_month: number;
  start_date: string;
  status: "active" | "paused" | "stopped";
  current_nav: number;
  promise_text: string;
  promise_one_line: string;
  promise_goal: string;
  promise_for_whom: string;
  promise_horizon: string;
  promise_audio_path: string;
  show_promise_at_cancel: boolean;
  birthday: string | null;
  anniversary: string | null;
  pause_until?: string | null;
  return_date?: string | null;
  return_label?: string | null;
}

export function computeUnits(amount: number, nav: number): number {
  return Math.round((amount / nav) * 1000) / 1000;
}

export function getDemoSeed() {
  return JSON.parse(JSON.stringify(demoSeedData)) as {
    investor_name: string;
    sip: DemoSip;
    instalments: DemoInstalment[];
  };
}

export function calculateLockerSummary(instalments: DemoInstalment[], currentNav: number) {
  const paidInstalments = instalments.filter((inst) => inst.status === "paid");
  const failedInstalments = instalments.filter((inst) => inst.status === "failed");
  const skippedInstalments = instalments.filter((inst) => inst.status === "skipped");

  const totalInvested = paidInstalments.reduce((sum, inst) => sum + inst.amount, 0);
  const totalUnits = paidInstalments.reduce((sum, inst) => {
    const units = inst.units ?? (inst.nav ? computeUnits(inst.amount, inst.nav) : 0);
    return sum + units;
  }, 0);

  // Round units to 3 decimal places
  const roundedUnits = Math.round(totalUnits * 1000) / 1000;
  const currentValue = Math.round(roundedUnits * currentNav * 100) / 100;

  return {
    paidCount: paidInstalments.length,
    failedCount: failedInstalments.length,
    skippedCount: skippedInstalments.length,
    totalInvested,
    totalUnits: roundedUnits,
    currentValue,
    currentNav,
  };
}
