"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import demoSeedData from "@/data/demo-seed.json";
import { DemoInstalment, DemoSip } from "./seed";

interface DemoState {
  simulatedDate: string;
  sip: DemoSip;
  instalments: DemoInstalment[];
  updateMemory: (instalmentId: string, memory: any) => void;
  updateSipStatus: (
    status: "active" | "paused" | "stopped",
    returnDate?: string | null,
    returnLabel?: string | null
  ) => void;
  updatePromise: (promise: {
    text: string;
    oneLine: string;
    goal: string;
    forWhom: string;
    horizon: string;
    showAtCancel: boolean;
  }) => void;
  setSimulatedDate: (date: string) => void;
  resetDemoState: () => void;
}

const DemoContext = createContext<DemoState | null>(null);

const STORAGE_KEY = "sip_locker_demo_state_v1";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [simulatedDate, setSimulatedDateState] = useState<string>("2026-11-05");
  const [sip, setSip] = useState<DemoSip>(demoSeedData.sip as unknown as DemoSip);
  const [instalments, setInstalments] = useState<DemoInstalment[]>(
    demoSeedData.instalments as unknown as DemoInstalment[]
  );

  // Load from sessionStorage on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sip) setSip(parsed.sip);
        if (parsed.instalments) setInstalments(parsed.instalments);
        if (parsed.simulatedDate) setSimulatedDateState(parsed.simulatedDate);
      }
    } catch (e) {
      // Ignore storage errors in private mode
    }
  }, []);

  // Sync to sessionStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ simulatedDate, sip, instalments })
      );
    } catch (e) {
      // Ignore
    }
  }, [simulatedDate, sip, instalments, isClient]);

  const updateMemory = (instalmentId: string, memory: any) => {
    setInstalments((prev) =>
      prev.map((inst) =>
        inst.id === instalmentId ? { ...inst, memory } : inst
      )
    );
  };

  const updateSipStatus = (
    status: "active" | "paused" | "stopped",
    returnDate?: string | null,
    returnLabel?: string | null
  ) => {
    setSip((prev) => ({
      ...prev,
      status,
      return_date: returnDate ?? prev.return_date,
      return_label: returnLabel ?? prev.return_label,
    }));
  };

  const updatePromise = (p: {
    text: string;
    oneLine: string;
    goal: string;
    forWhom: string;
    horizon: string;
    showAtCancel: boolean;
  }) => {
    setSip((prev) => ({
      ...prev,
      promise_text: p.text,
      promise_one_line: p.oneLine,
      promise_goal: p.goal,
      promise_for_whom: p.forWhom,
      promise_horizon: p.horizon,
      show_promise_at_cancel: p.showAtCancel,
    }));
  };

  const setSimulatedDate = (date: string) => {
    setSimulatedDateState(date);
  };

  const resetDemoState = () => {
    setSip(demoSeedData.sip as unknown as DemoSip);
    setInstalments(demoSeedData.instalments as unknown as DemoInstalment[]);
    setSimulatedDateState("2026-11-05");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  return (
    <DemoContext.Provider
      value={{
        simulatedDate,
        sip,
        instalments,
        updateMemory,
        updateSipStatus,
        updatePromise,
        setSimulatedDate,
        resetDemoState,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
