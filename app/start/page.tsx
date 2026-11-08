import { redirect } from "next/navigation";

// Owner, 9 Nov 2026 (03:20): the Start SIP demo was removed; Piece by piece uses a sample picture. Old links land on Home.
export default function Page() {
  redirect("/");
}
