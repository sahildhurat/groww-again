import { redirect } from "next/navigation";

// Final MVP (8 Nov 2026): this page was removed; old links land on /passbook.
export default function Page() {
  redirect("/passbook");
}
