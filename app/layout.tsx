import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "./globals.css";
import { Providers } from "@/components/providers";
import { FrameScrollReset } from "@/components/ui/frame-scroll-reset";
import { NavHistory } from "@/components/ui/nav-history";
import { StageNote } from "@/components/ui/stage-note";

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
            {/* Desktop only: what this is, beside the phone. On Home it also explains the two ideas (13 Nov 2026). */}
            <StageNote />
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
