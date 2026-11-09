import { redirect } from "next/navigation";

// Owner, 9 Nov 2026 (08:50): every month is back on the passbook itself, in one scroll. Old links land there.
export default function Page() {
  redirect("/passbook");
}
