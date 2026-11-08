"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import demoSeedData from "@/data/demo-seed.json";
import { DemoInstalment, DemoSip } from "./seed";
import { LockerStore, DemoStore, CloudStore, demoStore, MemoryRecord, PromiseRecord } from "./store";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase";
import { clearAll as clearKeepsake } from "./keepsake";

export interface DemoUser {
  id: string;
  email: string;
}

interface DemoState {
  mode: "demo" | "cloud";
  user: DemoUser | null;
  isConsented: boolean;
  hasSip: boolean;
  store: LockerStore;
  simulatedDate: string;
  version: "A" | "B";
  scenario: "running" | "stopped" | "stale";
  setVersion: (v: "A" | "B") => void;
  setScenario: (s: "running" | "stopped" | "stale") => void;
  sip: DemoSip;
  instalments: DemoInstalment[];
  updateMemory: (instalmentId: string, memory: any) => Promise<void> | void;
  updateSipStatus: (
    status: "active" | "paused" | "stopped",
    returnDate?: string | null,
    returnLabel?: string | null
  ) => Promise<void> | void;
  updatePromise: (promise: {
    text: string;
    oneLine: string;
    goal: string;
    forWhom: string;
    horizon: string;
    showAtCancel: boolean;
    audioPath?: string | null;
  }) => Promise<void> | void;
  updateDedication: (dedication: string) => Promise<void> | void;
  setSimulatedDate: (date: string) => void;
  resetDemoState: () => void;
  startFromDemoSip: () => Promise<void>;
  recordConsent: (version?: string) => Promise<void>;
  refreshState: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  saveError: string | null;
  clearSaveError: () => void;
}

// R36 (Claude): a failed cloud write is shown to the investor. Before, every write error was only logged to the
// console while the screen showed the change as saved, so a memory could vanish on the next device.
const SAVE_ERROR = "This change was not saved. Check your connection and try again.";

const DemoContext = createContext<DemoState | null>(null);

const STORAGE_KEY = "sip_locker_demo_state_v1";
const VERSION_KEY = "sip_passbook_version_v1";
const SCENARIO_KEY = "sip_passbook_scenario_v1";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const [mode, setMode] = useState<"demo" | "cloud">("demo");
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isConsentedState, setIsConsentedState] = useState(false);
  const [hasSip, setHasSip] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const clearSaveError = useCallback(() => setSaveError(null), []);

  const [version, setVersionState] = useState<"A" | "B">("B");
  const [scenario, setScenarioState] = useState<"running" | "stopped" | "stale">("running");

  const setVersion = useCallback((v: "A" | "B") => {
    setVersionState(v);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(VERSION_KEY, v);
      } catch {}
    }
  }, []);

  const setScenario = useCallback((s: "running" | "stopped" | "stale") => {
    setScenarioState(s);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SCENARIO_KEY, s);
      } catch {}
    }
  }, []);

  const [simulatedDate, setSimulatedDateState] = useState<string>("2026-11-05");
  const [sip, setSip] = useState<DemoSip>(demoSeedData.sip as unknown as DemoSip);
  const [instalments, setInstalments] = useState<DemoInstalment[]>(
    demoSeedData.instalments as unknown as DemoInstalment[]
  );

  // Active store instance
  const activeStore = useMemo<LockerStore>(() => {
    if (mode === "cloud") {
      const client = getSupabaseBrowserClient();
      if (client) {
        return new CloudStore(client);
      }
    }
    return demoStore;
  }, [mode]);

  const loadCloudState = useCallback(async (client: any, userId: string) => {
    try {
      const cloud = new CloudStore(client);
      const consented = await cloud.isConsented();
      setIsConsentedState(consented);

      const cloudSip = await cloud.getSip();
      if (cloudSip) {
        setSip(cloudSip);
        setHasSip(true);
        const cloudInsts = await cloud.getInstalments();
        setInstalments(cloudInsts);
      } else {
        setHasSip(false);
        // Retain seed structure for template math safety if no SIP yet
        setSip({
          ...(demoSeedData.sip as unknown as DemoSip),
          name: "My SIP Passbook",
          dedication: "",
        });
        setInstalments([]);
      }
    } catch {
      // Ignore cloud state fetch failures, fallback to demo state
    }
  }, []);

  // Initialize auth and store on client mount
  useEffect(() => {
    setIsClient(true);

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
            });
            setMode("cloud");
            loadCloudState(supabase, session.user.id);
          } else {
            // R36 (Claude): removed a test switch ("sip_locker_force_mode") that put the app into a fake cloud mode
            // with a made-up user. AG's "cloud" screenshots used it; nothing in them touched Supabase.
            setMode("demo");
            loadDemoSession();
          }
        });

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              email: session.user.email || "",
            });
            setMode("cloud");
            loadCloudState(supabase, session.user.id);
          } else {
            setUser(null);
            setMode("demo");
            loadDemoSession();
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      }
    }

    // Default: demo mode
    loadDemoSession();
  }, [loadCloudState]);

  const loadDemoSession = () => {
    try {
      // Owner, 9 Nov: only version B is shown; version A comes back only through the hidden switch (/demo-tools?ab=1).
      const savedVersion = sessionStorage.getItem(VERSION_KEY);
      const abUnlocked = sessionStorage.getItem("sip_passbook_ab_unlocked_v1") === "1";
      if (abUnlocked && (savedVersion === "A" || savedVersion === "B")) {
        setVersionState(savedVersion);
      }
      const savedScenario = sessionStorage.getItem(SCENARIO_KEY);
      if (
        savedScenario === "running" ||
        savedScenario === "stopped" ||
        savedScenario === "stale"
      ) {
        setScenarioState(savedScenario);
      }

      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sip) setSip(parsed.sip);
        if (parsed.instalments) setInstalments(parsed.instalments);
        if (parsed.simulatedDate) setSimulatedDateState(parsed.simulatedDate);
      } else {
        setSip(demoSeedData.sip as unknown as DemoSip);
        setInstalments(demoSeedData.instalments as unknown as DemoInstalment[]);
      }
      setHasSip(true);
    } catch {}
  };

  // Sync to sessionStorage in demo mode
  useEffect(() => {
    if (!isClient || mode !== "demo") return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ simulatedDate, sip, instalments })
      );
    } catch {}
  }, [simulatedDate, sip, instalments, isClient, mode]);

  const refreshState = useCallback(async () => {
    if (mode === "cloud") {
      const supabase = getSupabaseBrowserClient();
      if (supabase && user) {
        await loadCloudState(supabase, user.id);
      }
    } else {
      loadDemoSession();
    }
  }, [mode, user, loadCloudState]);

  const recordConsent = useCallback(
    async (version = "v1.0") => {
      await activeStore.recordConsent(version);
      setIsConsentedState(true);
    },
    [activeStore]
  );

  const startFromDemoSip = useCallback(async () => {
    await activeStore.startFromDemo();
    await refreshState();
  }, [activeStore, refreshState]);

  const updateMemory = useCallback(
    async (instalmentId: string, memory: any) => {
      // Local optimistic update
      setInstalments((prev) =>
        prev.map((inst) =>
          inst.id === instalmentId ? { ...inst, memory } : inst
        )
      );
      try {
        await activeStore.saveMemory(instalmentId, memory);
      } catch (e) {
        console.warn("saveMemory store write failed", e);
        setSaveError(SAVE_ERROR);
        throw e;
      }
    },
    [activeStore]
  );

  const updateSipStatus = useCallback(
    async (
      status: "active" | "paused" | "stopped",
      returnDate?: string | null,
      returnLabel?: string | null
    ) => {
      // Local optimistic update
      setSip((prev) => ({
        ...prev,
        status,
        return_date: returnDate ?? prev.return_date,
        return_label: returnLabel ?? prev.return_label,
      }));
      try {
        await activeStore.updateSipStatus(status, returnDate, returnLabel);
      } catch (e) {
        console.warn("updateSipStatus store write failed", e);
        setSaveError(SAVE_ERROR);
      }
    },
    [activeStore]
  );

  const updatePromise = useCallback(
    async (p: {
      text: string;
      oneLine: string;
      goal: string;
      forWhom: string;
      horizon: string;
      showAtCancel: boolean;
      audioPath?: string | null;
    }) => {
      // Local optimistic update
      setSip((prev) => ({
        ...prev,
        promise_text: p.text,
        promise_one_line: p.oneLine,
        promise_goal: p.goal,
        promise_for_whom: p.forWhom,
        promise_horizon: p.horizon,
        promise_audio_path: p.audioPath ?? prev.promise_audio_path,
        show_promise_at_cancel: p.showAtCancel,
      }));
      try {
        await activeStore.savePromise({
          text: p.text,
          oneLine: p.oneLine,
          goal: p.goal,
          forWhom: p.forWhom,
          horizon: p.horizon,
          audioPath: p.audioPath,
          showAtCancel: p.showAtCancel,
        });
      } catch (e) {
        console.warn("savePromise store write failed", e);
        setSaveError(SAVE_ERROR);
        throw e;
      }
    },
    [activeStore]
  );

  const updateDedication = useCallback(
    async (dedication: string) => {
      setSip((prev) => ({
        ...prev,
        dedication,
      }));
      try {
        await activeStore.saveDedication(dedication);
      } catch (e) {
        console.warn("saveDedication store write failed", e);
        setSaveError(SAVE_ERROR);
        throw e;
      }
    },
    [activeStore]
  );

  const setSimulatedDate = (date: string) => {
    setSimulatedDateState(date);
  };

  const resetDemoState = () => {
    setSip(demoSeedData.sip as unknown as DemoSip);
    setInstalments(demoSeedData.instalments as unknown as DemoInstalment[]);
    setSimulatedDateState("2026-11-05");
    setVersionState("B");
    setScenarioState("running");
    demoStore.clearMarkers();
    clearKeepsake().catch(() => {});
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(VERSION_KEY);
      sessionStorage.removeItem(SCENARIO_KEY);
      sessionStorage.removeItem("sip_passbook_markers_v1");
    } catch {}
  };

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setMode("demo");
    resetDemoState();
  }, []);

  const deleteAccount = useCallback(async () => {
    await activeStore.deleteEverything();
    setUser(null);
    setMode("demo");
    resetDemoState();
  }, [activeStore]);

  return (
    <DemoContext.Provider
      value={{
        mode,
        user,
        isConsented: isConsentedState,
        hasSip,
        store: activeStore,
        simulatedDate,
        version,
        scenario,
        setVersion,
        setScenario,
        sip,
        instalments,
        updateMemory,
        updateSipStatus,
        updatePromise,
        updateDedication,
        setSimulatedDate,
        resetDemoState,
        startFromDemoSip,
        recordConsent,
        refreshState,
        signOut,
        deleteAccount,
        saveError,
        clearSaveError,
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
