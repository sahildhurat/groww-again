import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "SIP locker (concept)",
  description:
    "A concept prototype for a Groww case study. Digital receipts, memories, and break assistance for first-year SIPs.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 flex justify-center min-h-screen font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>
          <div className="w-full max-w-[430px] min-h-screen bg-white shadow-2xl flex flex-col relative border-x border-gray-100">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
