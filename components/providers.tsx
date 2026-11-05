"use client";

import React from "react";
import { DemoProvider } from "@/lib/demo-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
