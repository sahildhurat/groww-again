// Single date and time formatting helper per SPEC-07 R37
// All times format in Asia/Kolkata timezone with "IST" suffix.

const TIMEZONE = "Asia/Kolkata";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats a date string (e.g. "2026-10-05" or ISO) into "5 Oct 2026".
 * Preserves the exact date regardless of the client machine's local timezone.
 */
export function formatDate(isoStrOrDate: string | Date | null | undefined): string {
  if (!isoStrOrDate) return "";

  if (typeof isoStrOrDate === "string") {
    // Pure date string "YYYY-MM-DD"
    const match = isoStrOrDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES[monthIdx]} ${year}`;
      }
    }
  }

  const d = typeof isoStrOrDate === "string" ? new Date(isoStrOrDate) : isoStrOrDate;
  if (isNaN(d.getTime())) return String(isoStrOrDate);

  // Use Intl with timeZone Asia/Kolkata to extract date components
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
  const parts = formatter.formatToParts(d);
  let day = "";
  let month = 0;
  let year = "";
  for (const p of parts) {
    if (p.type === "day") day = p.value;
    else if (p.type === "month") month = parseInt(p.value, 10);
    else if (p.type === "year") year = p.value;
  }

  const monthLabel = MONTH_NAMES[month - 1] || "";
  return `${day} ${monthLabel} ${year}`;
}

/**
 * Formats an ISO timestamp into "6 Nov 2026, 10:00 IST" (Asia/Kolkata).
 */
export function formatDateTime(isoStrOrDate: string | Date | null | undefined): string {
  if (!isoStrOrDate) return "";
  const d = typeof isoStrOrDate === "string" ? new Date(isoStrOrDate) : isoStrOrDate;
  if (isNaN(d.getTime())) return String(isoStrOrDate);

  const datePart = formatDate(d);

  const timePart = d.toLocaleTimeString("en-IN", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${datePart}, ${timePart} IST`;
}

/**
 * Formats a month string "YYYY-MM" into "Dec 2026".
 */
export function formatMonthYear(monthStr: string | null | undefined): string {
  if (!monthStr) return "";
  const match = monthStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    }
  }
  return monthStr;
}
