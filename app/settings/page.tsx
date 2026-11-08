import { redirect } from "next/navigation";

// Final MVP (8 Nov 2026): this page was removed; old links land on /your-data.
export default function Page() {
  redirect("/your-data");
}
