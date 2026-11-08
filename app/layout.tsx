import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "./globals.css";
import { Providers } from "@/components/providers";
import { FrameScrollReset } from "@/components/ui/frame-scroll-reset";
import { NavHistory } from "@/components/ui/nav-history";

export const metadata: Metadata = {
  title: "SIP Passbook (concept)",
  description:
    "A concept prototype for a Groww case study. Step-by-step SIP instalment passbook.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14213D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>
          <NavHistory />
          <div className="stage">
            {/* Desktop only: what this is, beside the phone */}
            <aside className="stage-note" aria-hidden="true">
              <p className="stage-title">SIP Passbook</p>
              <p className="stage-line">
                Your bank&apos;s SMS shows the money leaving. The passbook shows what it became: every month, from your
                bank to the units in your name. A concept for first-year SIP investors, shown at phone size.
              </p>
              <p className="stage-small">Not affiliated with Groww. All data is synthetic demo data.</p>
            </aside>
            <div className="device">
              <div id="app-scroll" className="device-scroll">
                <FrameScrollReset />
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
