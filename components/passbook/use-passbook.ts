"use client";

// Owner, 9 Nov: the passbook is now a cover plus two pages (Every month; Piece by piece / Units by month). This hook
// gives each page the same scenario data and, in version B, the memories kept on this device.
import { useEffect, useMemo, useState } from "react";
import { useDemo } from "@/lib/demo-context";
import passbookSeed from "@/data/passbook-seed.json";
import type { Instalment, PassbookSip } from "@/lib/passbook-types";
import { useKeepsakeTick } from "@/components/keepsake/use-keepsake";
import { listMemories, type MemoryRecord } from "@/lib/keepsake";

export function usePassbook() {
  const { version, scenario } = useDemo();
  const { sip, instalments } = useMemo(() => {
    const scenarios = (passbookSeed as any).scenarios;
    return (scenarios[scenario] || scenarios.running) as { sip: PassbookSip; instalments: Instalment[] };
  }, [scenario]);

  const keepsakeTick = useKeepsakeTick();
  const [memories, setMemories] = useState<Record<string, MemoryRecord>>({});
  useEffect(() => {
    if (version !== "B") {
      setMemories({});
      return;
    }
    listMemories()
      .then((list) => setMemories(Object.fromEntries(list.map((m) => [m.month, m]))))
      .catch(() => setMemories({}));
  }, [version, keepsakeTick]);

  return { version, scenario, sip, instalments, memories };
}
