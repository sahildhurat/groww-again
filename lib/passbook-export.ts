import { formatDate, formatDateTime, formatMonthYear } from "./format";
import { instalmentState } from "./passbook";
import { Instalment } from "./passbook-types";
import { MarkerRecord } from "./store";

export function generatePassbookHtml(params: {
  scenario: "running" | "stopped" | "stale";
  version: "A" | "B";
  sip: {
    name: string;
    fund_label: string;
    amount: number;
    dedication?: string | null;
  };
  instalments: Instalment[];
  futureThreadLine?: string | null;
  markers?: MarkerRecord[];
}): string {
  const esc = (v: unknown) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c] as string));

  const sortedInsts = [...params.instalments].sort((a, b) =>
    b.due_date.localeCompare(a.due_date)
  );

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SIP Passbook: personal record</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #111; line-height: 1.5; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .lead { color: #555; font-size: 14px; margin-bottom: 20px; }
    .meta { font-size: 13px; color: #444; background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 24px; }
    .entry { border-bottom: 1px solid #eee; padding: 14px 0; }
    .entry-header { display: flex; justify-content: space-between; font-weight: 600; font-size: 14px; margin-bottom: 6px; }
    .stamps { font-size: 13px; color: #444; margin-left: 8px; }
    .stamp-row { margin-bottom: 3px; }
    .markers-section { margin-top: 32px; border-top: 2px solid #eee; padding-top: 20px; }
    .marker-item { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 10px; margin-bottom: 10px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>SIP Passbook: personal record</h1>
  <p class="lead">Personal record. Not an official statement. Your official record is your CAS.</p>

  <div class="meta">
    <div><strong>Fund:</strong> ${esc(params.sip.fund_label)}</div>
    <div><strong>Monthly Instalment:</strong> ₹${params.sip.amount.toLocaleString("en-IN")}</div>`;

  if (params.version === "B") {
    if (params.sip.dedication) {
      html += `\n    <div><strong>Passbook Name:</strong> ${esc(params.sip.dedication)}</div>`;
    }
    if (params.futureThreadLine) {
      html += `\n    <div><strong>Future Thread:</strong> ${esc(params.futureThreadLine)}</div>`;
    }
  }

  html += `\n  </div>\n\n  <h2>Instalments (${sortedInsts.length})</h2>\n  <div class="entries">`;

  for (const inst of sortedInsts) {
    const state = instalmentState(inst);
    const debit = inst.events.find((e) => e.type === "debit");
    const order = inst.events.find((e) => e.type === "order");
    const allotment = inst.events.find((e) => e.type === "allotment");
    const refund = inst.events.find((e) => e.type === "refund");

    let debitText = "— Not attempted";
    if (debit?.status === "confirmed") {
      debitText = `Debited (${formatDateTime(debit.effective_at || debit.as_of)})`;
    } else if (debit?.status === "failed") {
      debitText = `Not debited (${formatDateTime(debit.effective_at || debit.as_of)})`;
    }

    let orderText = "— Not attempted";
    if (order?.status === "confirmed") {
      orderText = `Order placed (${formatDateTime(order.effective_at || order.as_of)})`;
    } else if (order?.status === "failed") {
      orderText = `Order failed (${formatDateTime(order.effective_at || order.as_of)})`;
    }

    let unitsText = "— Not attempted";
    if (state === "skipped") {
      unitsText = "Skipped by investor";
    } else if (allotment?.status === "confirmed") {
      unitsText = `${inst.units ? inst.units.toFixed(3) + " units" : "Allotted"} (${formatDateTime(allotment.effective_at || allotment.as_of)})`;
    } else if (refund?.status === "confirmed") {
      unitsText = `Refunded (${formatDateTime(refund.effective_at || refund.as_of)})`;
    } else if (allotment?.status === "pending" || state === "in_progress") {
      unitsText = "Units not confirmed yet";
    }

    html += `\n    <div class="entry">
      <div class="entry-header">
        <span>${formatDate(inst.due_date)}</span>
        <span>₹${inst.amount.toLocaleString("en-IN")}</span>
      </div>
      <div class="stamps">
        ${
          state === "skipped"
            ? `<div class="stamp-row">— Skipped by investor</div>`
            : `
        <div class="stamp-row"><strong>Bank debit:</strong> ${esc(debitText)}</div>
        <div class="stamp-row"><strong>Order placed:</strong> ${esc(orderText)}</div>
        <div class="stamp-row"><strong>Units allotted:</strong> ${esc(unitsText)}</div>`
        }
      </div>
    </div>`;
  }

  html += `\n  </div>`;

  if (params.version === "B" && params.markers && params.markers.length > 0) {
    html += `\n\n  <div class="markers-section">
    <h2>Life Markers (${params.markers.length})</h2>`;
    for (const m of params.markers) {
      const monthLabel = formatMonthYear(m.month);
      const filename = m.storage_path ? m.storage_path.split("/").pop() : "";
      html += `\n    <div class="marker-item">
      <div><strong>${esc(monthLabel)}</strong> [${esc(m.kind)}]</div>
      ${m.caption ? `<div>${esc(m.caption)}</div>` : ""}
      ${filename ? `<div><em>Attached file: media/${esc(filename)}</em></div>` : ""}
    </div>`;
    }
    html += `\n  </div>`;
  }

  html += `\n</body>\n</html>`;
  return html;
}

