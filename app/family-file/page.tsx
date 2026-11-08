import { redirect } from "next/navigation";

// Final MVP (8 Nov 2026): the family file was replaced by Ask a friend; old links land on the passbook.
export default function Page() {
  redirect("/passbook");
}
