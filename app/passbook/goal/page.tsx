import { redirect } from "next/navigation";

// Owner, 9 Nov 2026 (03:47): Piece by piece was removed; the delivery tracker carries the passbook. Old links land on it.
export default function Page() {
  redirect("/passbook");
}
