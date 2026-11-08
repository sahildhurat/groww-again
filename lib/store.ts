import { SupabaseClient } from "@supabase/supabase-js";
import demoSeedData from "@/data/demo-seed.json";
import passbookSeedData from "@/data/passbook-seed.json";
import { DemoInstalment, DemoSip } from "./seed";
import { generatePassbookHtml } from "./passbook-export";
import JSZip from "jszip";

export interface MemoryRecord {
  kind: "photo" | "voice" | "text";
  text?: string | null;
  storage_path?: string | null;
  illustration?: string | null;
  transcript?: string | null;
}

export interface PromiseRecord {
  text: string;
  oneLine: string;
  goal: string;
  forWhom: string;
  horizon: string;
  audioPath?: string | null;
  showAtCancel: boolean;
}

export interface YearTwoNoteRecord {
  text?: string | null;
  audioPath?: string | null;
}

export interface MarkerRecord {
  id: string;
  month: string; // "YYYY-MM"
  kind: "photo" | "voice" | "text";
  caption?: string | null;
  storage_path?: string | null;
}

/**
 * Universal Store Interface (§5, §7, §10, §11)
 * One abstraction powering both Demo mode (sessionStorage) and Cloud mode (Supabase RLS).
 */
export interface LockerStore {
  readonly mode: "demo" | "cloud";
  isConsented(): Promise<boolean>;
  recordConsent(version?: string): Promise<void>;
  getSip(): Promise<DemoSip | null>;
  getInstalments(): Promise<DemoInstalment[]>;
  saveMemory(instalmentId: string, memory: MemoryRecord): Promise<void>;
  savePromise(promise: PromiseRecord): Promise<void>;
  saveDedication(dedication: string): Promise<void>;
  updateSipStatus(
    status: "active" | "paused" | "stopped",
    returnDate?: string | null,
    returnLabel?: string | null
  ): Promise<void>;
  saveYearTwoNote(note: YearTwoNoteRecord): Promise<void>;
  getYearTwoNote(): Promise<YearTwoNoteRecord | null>;
  startFromDemo(): Promise<void>;
  uploadMedia(file: Blob | File, filename: string, subfolder?: string): Promise<string>;
  getMediaUrl(path: string): Promise<string | null>;
  exportLocker(
    scenario?: "running" | "stopped" | "stale",
    version?: "A" | "B"
  ): Promise<Blob>;
  deleteEverything(): Promise<void>;
  listMarkers(): Promise<MarkerRecord[]>;
  saveMarker(m: Omit<MarkerRecord, "id">): Promise<string>;
  updateMarker(id: string, patch: Partial<Omit<MarkerRecord, "id">>): Promise<void>;
  deleteMarker(id: string): Promise<void>;
}

const DEMO_STORAGE_KEY = "sip_locker_demo_state_v1";
const DEMO_CONSENT_KEY = "sip_locker_demo_consent_v1";
const DEMO_YEAR_TWO_KEY = "sip_locker_demo_year_two_v1";
const DEMO_MARKERS_KEY = "sip_passbook_markers_v1";

/**
 * Demo Store Implementation (in-memory / sessionStorage only; no network calls)
 */
export class DemoStore implements LockerStore {
  readonly mode = "demo" as const;
  private inMemoryData: { sip: DemoSip; instalments: DemoInstalment[] } | null = null;
  private inMemoryConsent = false;
  private inMemoryYearTwo: YearTwoNoteRecord | null = null;
  private inMemoryMarkers: MarkerRecord[] = [];

  private getSessionMarkers(): MarkerRecord[] {
    if (typeof window === "undefined") {
      return this.inMemoryMarkers;
    }
    try {
      const saved = sessionStorage.getItem(DEMO_MARKERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return this.inMemoryMarkers;
  }

  private setSessionMarkers(markers: MarkerRecord[]): void {
    this.inMemoryMarkers = markers;
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(DEMO_MARKERS_KEY, JSON.stringify(markers));
    } catch {}
  }

  async listMarkers(): Promise<MarkerRecord[]> {
    return this.getSessionMarkers();
  }

  async saveMarker(m: Omit<MarkerRecord, "id">): Promise<string> {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `marker-${Date.now()}`;
    const newMarker: MarkerRecord = { id, ...m };
    const markers = this.getSessionMarkers();
    markers.push(newMarker);
    this.setSessionMarkers(markers);
    return id;
  }

  async updateMarker(
    id: string,
    patch: Partial<Omit<MarkerRecord, "id">>
  ): Promise<void> {
    const markers = this.getSessionMarkers();
    const idx = markers.findIndex((m) => m.id === id);
    if (idx !== -1) {
      markers[idx] = { ...markers[idx], ...patch };
      this.setSessionMarkers(markers);
    }
  }

  async deleteMarker(id: string): Promise<void> {
    const markers = this.getSessionMarkers();
    const filtered = markers.filter((m) => m.id !== id);
    this.setSessionMarkers(filtered);
  }

  private getSessionData(): { sip: DemoSip; instalments: DemoInstalment[] } {
    if (typeof window === "undefined") {
      if (!this.inMemoryData) {
        this.inMemoryData = {
          sip: JSON.parse(JSON.stringify(demoSeedData.sip)) as DemoSip,
          instalments: JSON.parse(JSON.stringify(demoSeedData.instalments)) as DemoInstalment[],
        };
      }
      return this.inMemoryData;
    }
    try {
      const saved = sessionStorage.getItem(DEMO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sip && parsed.instalments) {
          return parsed;
        }
      }
    } catch {}
    return {
      sip: demoSeedData.sip as unknown as DemoSip,
      instalments: demoSeedData.instalments as unknown as DemoInstalment[],
    };
  }

  private setSessionData(data: { sip: DemoSip; instalments: DemoInstalment[] }): void {
    if (typeof window === "undefined") {
      this.inMemoryData = data;
      return;
    }
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  async isConsented(): Promise<boolean> {
    if (typeof window === "undefined") return this.inMemoryConsent;
    try {
      return sessionStorage.getItem(DEMO_CONSENT_KEY) === "true";
    } catch {
      return true;
    }
  }

  async recordConsent(_version = "v1.0"): Promise<void> {
    if (typeof window === "undefined") {
      this.inMemoryConsent = true;
      return;
    }
    try {
      sessionStorage.setItem(DEMO_CONSENT_KEY, "true");
    } catch {}
  }

  async getSip(): Promise<DemoSip | null> {
    return this.getSessionData().sip;
  }

  async getInstalments(): Promise<DemoInstalment[]> {
    return this.getSessionData().instalments;
  }

  async saveMemory(instalmentId: string, memory: MemoryRecord): Promise<void> {
    const data = this.getSessionData();
    data.instalments = data.instalments.map((inst) =>
      inst.id === instalmentId ? { ...inst, memory: memory as any } : inst
    );
    this.setSessionData(data);
  }

  async savePromise(p: PromiseRecord): Promise<void> {
    const data = this.getSessionData();
    data.sip = {
      ...data.sip,
      promise_text: p.text,
      promise_one_line: p.oneLine,
      promise_goal: p.goal,
      promise_for_whom: p.forWhom,
      promise_horizon: p.horizon,
      promise_audio_path: p.audioPath ?? data.sip.promise_audio_path,
      show_promise_at_cancel: p.showAtCancel,
    };
    this.setSessionData(data);
  }

  async saveDedication(dedication: string): Promise<void> {
    const data = this.getSessionData();
    data.sip = {
      ...data.sip,
      dedication,
    };
    this.setSessionData(data);
  }

  async updateSipStatus(
    status: "active" | "paused" | "stopped",
    returnDate?: string | null,
    returnLabel?: string | null
  ): Promise<void> {
    const data = this.getSessionData();
    data.sip = {
      ...data.sip,
      status,
      return_date: returnDate ?? data.sip.return_date,
      return_label: returnLabel ?? data.sip.return_label,
    };
    this.setSessionData(data);
  }

  async saveYearTwoNote(note: YearTwoNoteRecord): Promise<void> {
    if (typeof window === "undefined") {
      this.inMemoryYearTwo = note;
      return;
    }
    try {
      sessionStorage.setItem(DEMO_YEAR_TWO_KEY, JSON.stringify(note));
    } catch {}
  }

  async getYearTwoNote(): Promise<YearTwoNoteRecord | null> {
    if (typeof window === "undefined") return this.inMemoryYearTwo;
    try {
      const saved = sessionStorage.getItem(DEMO_YEAR_TWO_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  async startFromDemo(): Promise<void> {
    this.setSessionData({
      sip: demoSeedData.sip as unknown as DemoSip,
      instalments: demoSeedData.instalments as unknown as DemoInstalment[],
    });
  }

  async uploadMedia(file: Blob | File, _filename: string): Promise<string> {
    // R36 (Claude): demo media stays in this browser session. Files up to 1.5 MB become data URLs, so they
    // still play after a page reload; larger ones become object URLs (this tab only). It was
    // "/audio/<filename>", a path that does not exist, so a demo visitor's own recording never played.
    if (typeof window === "undefined") return "";
    if (file.size <= 1.5 * 1024 * 1024 && typeof FileReader !== "undefined") {
      return await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Could not read the file."));
        r.readAsDataURL(file);
      });
    }
    return URL.createObjectURL(file);
  }

  async getMediaUrl(path: string): Promise<string | null> {
    return path;
  }

  async exportLocker(
    scenario?: "running" | "stopped" | "stale",
    version?: "A" | "B"
  ): Promise<Blob> {
    const zip = new JSZip();
    const effectiveScenario: "running" | "stopped" | "stale" =
      scenario ||
      ((typeof window !== "undefined" &&
        (sessionStorage.getItem("sip_passbook_scenario_v1") as any)) ||
        "running");
    const effectiveVersion: "A" | "B" =
      version ||
      ((typeof window !== "undefined" &&
        (sessionStorage.getItem("sip_passbook_version_v1") as any)) ||
        "B");

    const scenarioData =
      (passbookSeedData.scenarios as any)[effectiveScenario] ||
      passbookSeedData.scenarios.running;
    const sessionData = this.getSessionData();
    const markers = this.getSessionMarkers();

    const passbookJson = {
      scenario: effectiveScenario,
      version: effectiveVersion,
      exported_at: new Date().toISOString(),
      sip: {
        ...scenarioData.sip,
        dedication:
          effectiveVersion === "B"
            ? sessionData.sip?.dedication || scenarioData.sip.dedication
            : null,
      },
      instalments: scenarioData.instalments,
      ...(effectiveVersion === "B"
        ? {
            future_thread: sessionData.sip?.promise_one_line || null,
            markers,
          }
        : {}),
    };

    zip.file("passbook.json", JSON.stringify(passbookJson, null, 2));

    const html = generatePassbookHtml({
      scenario: effectiveScenario,
      version: effectiveVersion,
      sip: {
        name: scenarioData.sip.name,
        fund_label: scenarioData.sip.fund_label,
        amount: scenarioData.sip.amount,
        dedication:
          effectiveVersion === "B" ? sessionData.sip?.dedication : undefined,
      },
      instalments: scenarioData.instalments as any,
      futureThreadLine:
        effectiveVersion === "B"
          ? sessionData.sip?.promise_one_line
          : undefined,
      markers: effectiveVersion === "B" ? markers : undefined,
    });
    zip.file("passbook.html", html);

    if (effectiveVersion === "B" && markers.length > 0) {
      const mediaFolder = zip.folder("media");
      for (const m of markers) {
        if (m.storage_path && mediaFolder) {
          try {
            if (m.storage_path.startsWith("data:")) {
              const base64Part = m.storage_path.split(",")[1];
              const ext = m.kind === "photo" ? "jpg" : "webm";
              mediaFolder.file(
                `marker-${m.id}.${ext}`,
                base64Part,
                { base64: true }
              );
            } else if (m.storage_path.startsWith("blob:")) {
              const res = await fetch(m.storage_path);
              const blob = await res.blob();
              const ext = m.kind === "photo" ? "jpg" : "webm";
              mediaFolder.file(`marker-${m.id}.${ext}`, blob);
            }
          } catch {}
        }
      }
    }

    return await zip.generateAsync({ type: "blob" });
  }

  clearMarkers(): void {
    this.inMemoryMarkers = [];
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(DEMO_MARKERS_KEY);
      } catch {}
    }
  }

  async deleteEverything(): Promise<void> {
    this.inMemoryData = null;
    this.inMemoryConsent = false;
    this.inMemoryYearTwo = null;
    this.inMemoryMarkers = [];
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(DEMO_STORAGE_KEY);
      sessionStorage.removeItem(DEMO_CONSENT_KEY);
      sessionStorage.removeItem(DEMO_YEAR_TWO_KEY);
      sessionStorage.removeItem(DEMO_MARKERS_KEY);
    } catch {}
  }
}

export const demoStore = new DemoStore();

/**
 * Cloud Store Implementation (Supabase Cloud + Row-Level Security)
 * Refuses all writes before explicit consent.
 */
export class CloudStore implements LockerStore {
  readonly mode = "cloud" as const;
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await this.client.auth.getUser();
    if (error || !user) {
      throw new Error("User is not authenticated in cloud mode.");
    }
    return user.id;
  }

  async isConsented(): Promise<boolean> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await this.client
        .from("consents")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      if (error || !data) return false;
      return data.length > 0;
    } catch {
      return false;
    }
  }

  async recordConsent(version = "v1.0"): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client.from("consents").insert({
      user_id: userId,
      version,
    });
    if (error) {
      throw new Error(`Failed to record consent: ${error.message}`);
    }
  }

  /**
   * Enforces Rule §10: Cloud store strictly refuses any write before consent is recorded.
   */
  private async ensureConsent(): Promise<void> {
    const consented = await this.isConsented();
    if (!consented) {
      throw new Error("Consent required before writing to cloud storage.");
    }
  }

  async getSip(): Promise<DemoSip | null> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await this.client
        .from("sips")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        dedication: data.dedication || "",
        fund_label: data.fund_label,
        amount: Number(data.amount),
        day_of_month: data.day_of_month || 5,
        start_date: data.start_date,
        current_nav: 108.2, // Live NAV reference for illustrative valuation (§6)
        status: data.status,
        return_date: data.return_date,
        return_label: data.return_label,
        promise_text: data.promise_text || "",
        promise_one_line: data.promise_one_line || "",
        promise_goal: data.promise_goal || "",
        promise_for_whom: data.promise_for_whom || "",
        promise_horizon: data.promise_horizon || "",
        promise_audio_path: data.promise_audio_path || "",
        show_promise_at_cancel: Boolean(data.show_promise_at_cancel),
        birthday: data.birthday || null,
        anniversary: data.anniversary || null,
      };
    } catch {
      return null;
    }
  }

  async getInstalments(): Promise<DemoInstalment[]> {
    try {
      const userId = await this.getUserId();
      const { data: sip } = await this.client
        .from("sips")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (!sip) return [];

      const { data: instRows, error } = await this.client
        .from("instalments")
        .select(`
          id,
          due_date,
          status,
          amount,
          nav,
          units,
          failure_code,
          failure_text,
          note,
          memories (
            id,
            kind,
            text,
            storage_path,
            transcript
          )
        `)
        .eq("sip_id", sip.id)
        .order("due_date", { ascending: true });

      if (error || !instRows) return [];

      return instRows.map((row: any) => {
        const mem = Array.isArray(row.memories) && row.memories.length > 0 ? row.memories[0] : null;
        return {
          id: row.id,
          due_date: row.due_date,
          status: row.status,
          amount: Number(row.amount),
          nav: row.nav ? Number(row.nav) : null,
          units: row.units ? Number(row.units) : null,
          failure_code: row.failure_code,
          failure_text: row.failure_text,
          note: row.note,
          // R36 (Claude): a voice memory's file is audio, not an image (it was mapped to `illustration`
          // and shown as a broken picture).
          memory: mem
            ? {
                kind: mem.kind,
                text: mem.text,
                illustration: mem.kind === "voice" ? null : mem.storage_path,
                audio_url: mem.kind === "voice" ? mem.storage_path : null,
              }
            : null,
        };
      });
    } catch {
      return [];
    }
  }

  async saveMemory(instalmentId: string, memory: MemoryRecord): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    const { data: existing } = await this.client
      .from("memories")
      .select("id")
      .eq("instalment_id", instalmentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await this.client
        .from("memories")
        .update({
          kind: memory.kind,
          text: memory.text ?? null,
          storage_path: memory.storage_path ?? null,
          transcript: memory.transcript ?? null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await this.client.from("memories").insert({
        instalment_id: instalmentId,
        user_id: userId,
        kind: memory.kind,
        text: memory.text ?? null,
        storage_path: memory.storage_path ?? null,
        transcript: memory.transcript ?? null,
      });
      if (error) throw new Error(error.message);
    }
  }

  async savePromise(p: PromiseRecord): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    const { error } = await this.client
      .from("sips")
      .update({
        promise_text: p.text,
        promise_one_line: p.oneLine,
        promise_goal: p.goal,
        promise_for_whom: p.forWhom,
        promise_horizon: p.horizon,
        promise_audio_path: p.audioPath,
        show_promise_at_cancel: p.showAtCancel,
      })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async saveDedication(dedication: string): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    const { error } = await this.client
      .from("sips")
      .update({
        dedication,
      })
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async updateSipStatus(
    status: "active" | "paused" | "stopped",
    returnDate?: string | null,
    returnLabel?: string | null
  ): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    const updatePayload: any = { status };
    if (returnDate !== undefined) updatePayload.return_date = returnDate;
    if (returnLabel !== undefined) updatePayload.return_label = returnLabel;

    const { error } = await this.client
      .from("sips")
      .update(updatePayload)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
  }

  async saveYearTwoNote(note: YearTwoNoteRecord): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();
    const sip = await this.getSip();
    if (!sip?.id) throw new Error("No active SIP found to link Year Two note.");

    const { data: existing } = await this.client
      .from("notes")
      .select("id")
      .eq("user_id", userId)
      .eq("kind", "year_two")
      .maybeSingle();

    if (existing) {
      const { error } = await this.client
        .from("notes")
        .update({
          text: note.text ?? null,
          audio_path: note.audioPath ?? null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await this.client.from("notes").insert({
        sip_id: sip.id,
        user_id: userId,
        kind: "year_two",
        text: note.text ?? null,
        audio_path: note.audioPath ?? null,
      });
      if (error) throw new Error(error.message);
    }
  }

  async getYearTwoNote(): Promise<YearTwoNoteRecord | null> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await this.client
        .from("notes")
        .select("text, audio_path")
        .eq("user_id", userId)
        .eq("kind", "year_two")
        .maybeSingle();

      if (error || !data) return null;
      return { text: data.text, audioPath: data.audio_path };
    } catch {
      return null;
    }
  }

  /**
   * "Start from the demo SIP": Copies seed's SIP, 11 instalments, and text memories.
   * Units and totals are computed from amount and NAV in code, never typed.
   */
  async startFromDemo(): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    // Clean any prior SIP for this user (one SIP per account in prototype)
    await this.client.from("sips").delete().eq("user_id", userId);

    const seedSip = demoSeedData.sip as any;
    const { data: newSip, error: sipError } = await this.client
      .from("sips")
      .insert({
        user_id: userId,
        name: seedSip.name,
        dedication: seedSip.dedication,
        fund_label: seedSip.fund_label,
        amount: seedSip.amount,
        day_of_month: 5,
        start_date: seedSip.start_date,
        status: seedSip.status,
        return_date: seedSip.return_date,
        return_label: seedSip.return_label,
        promise_text: seedSip.promise_text,
        promise_one_line: seedSip.promise_one_line,
        promise_goal: seedSip.promise_goal,
        promise_for_whom: seedSip.promise_for_whom,
        promise_horizon: seedSip.promise_horizon,
        promise_audio_path: seedSip.promise_audio_path,
        show_promise_at_cancel: false, // Default false per A1
      })
      .select()
      .single();

    if (sipError || !newSip) {
      throw new Error(`Failed to create SIP from demo: ${sipError?.message}`);
    }

    // Insert 11 instalments with code-computed units (§6: round(2000/NAV, 3))
    for (const inst of demoSeedData.instalments) {
      const computedUnits =
        inst.nav && inst.amount
          ? Math.round((inst.amount / inst.nav) * 1000) / 1000
          : null;

      const { data: newInst, error: instError } = await this.client
        .from("instalments")
        .insert({
          sip_id: newSip.id,
          user_id: userId,
          due_date: inst.due_date,
          status: inst.status,
          amount: inst.amount,
          nav: inst.nav,
          units: computedUnits,
          failure_code: inst.failure_code,
          failure_text: inst.failure_text,
          note: inst.note,
        })
        .select()
        .single();

      if (instError || !newInst) continue;

      if (inst.memory) {
        await this.client.from("memories").insert({
          instalment_id: newInst.id,
          user_id: userId,
          kind: inst.memory.kind || "text",
          text: inst.memory.text,
          storage_path: inst.memory.illustration || null,
        });
      }
    }
  }

  /**
   * Uploads file to private storage bucket: <user_id>/<sip_id>/<uuid>.<ext>
   */
  async uploadMedia(file: Blob | File, filename: string, subfolder?: string): Promise<string> {
    await this.ensureConsent();
    const userId = await this.getUserId();
    const sip = await this.getSip();
    const sipId = sip?.id || "default";

    const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}`;
    const ext = filename.split(".").pop() || "bin";
    const storagePath = subfolder === "markers"
      ? `${userId}/markers/${uuid}.${ext}`
      : `${userId}/${sipId}/${uuid}.${ext}`;

    const { data, error } = await this.client.storage
      .from("memories")
      .upload(storagePath, file, {
        // R36 (Claude): send the base type only. Browsers label recordings "audio/webm;codecs=opus", which is
        // not in the bucket's allowed list ("audio/webm"), so the upload could be refused.
        contentType: (file.type || "application/octet-stream").split(";")[0].trim(),
        upsert: false,
      });

    if (error) {
      throw new Error(`Media upload failed: ${error.message}`);
    }

    return data.path;
  }

  async listMarkers(): Promise<MarkerRecord[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await this.client
        .from("life_markers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error || !data) return [];
      return data.map((d: any) => ({
        id: d.id,
        month: d.month,
        kind: d.kind,
        caption: d.caption,
        storage_path: d.storage_path,
      }));
    } catch {
      return [];
    }
  }

  async saveMarker(m: Omit<MarkerRecord, "id">): Promise<string> {
    await this.ensureConsent();
    const userId = await this.getUserId();
    const sip = await this.getSip();
    const { data, error } = await this.client
      .from("life_markers")
      .insert({
        user_id: userId,
        sip_id: sip?.id || null,
        month: m.month,
        kind: m.kind,
        caption: m.caption ?? null,
        storage_path: m.storage_path ?? null,
      })
      .select("id")
      .single();
    if (error || !data) {
      throw new Error(`Failed to save marker: ${error?.message}`);
    }
    return data.id;
  }

  async updateMarker(
    id: string,
    patch: Partial<Omit<MarkerRecord, "id">>
  ): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    if (patch.storage_path !== undefined) {
      const { data } = await this.client
        .from("life_markers")
        .select("storage_path")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.storage_path && data.storage_path !== patch.storage_path) {
        try {
          await this.client.storage.from("memories").remove([data.storage_path]);
        } catch {}
      }
    }

    const updatePayload: any = {};
    if (patch.month !== undefined) updatePayload.month = patch.month;
    if (patch.kind !== undefined) updatePayload.kind = patch.kind;
    if (patch.caption !== undefined) updatePayload.caption = patch.caption;
    if (patch.storage_path !== undefined)
      updatePayload.storage_path = patch.storage_path;

    const { error } = await this.client
      .from("life_markers")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to update marker: ${error.message}`);
    }
  }

  async deleteMarker(id: string): Promise<void> {
    await this.ensureConsent();
    const userId = await this.getUserId();

    const { data } = await this.client
      .from("life_markers")
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.storage_path) {
      try {
        await this.client.storage.from("memories").remove([data.storage_path]);
      } catch {}
    }

    const { error } = await this.client
      .from("life_markers")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Failed to delete marker: ${error.message}`);
    }
  }

  /**
   * Generates a 1-hour signed URL for private bucket media.
   */
  async getMediaUrl(path: string): Promise<string | null> {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("/") || path.startsWith("data:") || path.startsWith("blob:")) return path;

    const { data, error } = await this.client.storage
      .from("memories")
      .createSignedUrl(path, 3600);

    if (error || !data) return null;
    return data.signedUrl;
  }

  async exportLocker(
    scenario?: "running" | "stopped" | "stale",
    version?: "A" | "B"
  ): Promise<Blob> {
    const effectiveScenario: "running" | "stopped" | "stale" =
      scenario || "running";
    const effectiveVersion: "A" | "B" = version || "B";

    const sip = await this.getSip();
    const markers = await this.listMarkers();

    const scenarioData =
      (passbookSeedData.scenarios as any)[effectiveScenario] ||
      passbookSeedData.scenarios.running;

    const zip = new JSZip();

    const passbookJson = {
      scenario: effectiveScenario,
      version: effectiveVersion,
      exported_at: new Date().toISOString(),
      sip: {
        ...scenarioData.sip,
        dedication:
          effectiveVersion === "B"
            ? sip?.dedication || scenarioData.sip.dedication
            : null,
      },
      instalments: scenarioData.instalments,
      ...(effectiveVersion === "B"
        ? {
            future_thread: sip?.promise_one_line || null,
            markers,
          }
        : {}),
    };

    zip.file("passbook.json", JSON.stringify(passbookJson, null, 2));

    const html = generatePassbookHtml({
      scenario: effectiveScenario,
      version: effectiveVersion,
      sip: {
        name: scenarioData.sip.name,
        fund_label: scenarioData.sip.fund_label,
        amount: scenarioData.sip.amount,
        dedication: effectiveVersion === "B" ? sip?.dedication : undefined,
      },
      instalments: scenarioData.instalments as any,
      futureThreadLine:
        effectiveVersion === "B" ? sip?.promise_one_line : undefined,
      markers: effectiveVersion === "B" ? markers : undefined,
    });
    zip.file("passbook.html", html);

    if (effectiveVersion === "B" && markers.length > 0) {
      const mediaFolder = zip.folder("media");
      for (const m of markers) {
        if (m.storage_path && mediaFolder) {
          try {
            const { data: fileData } = await this.client.storage
              .from("memories")
              .download(m.storage_path);
            if (fileData) {
              const filename =
                m.storage_path.split("/").pop() || `marker-${m.id}.bin`;
              mediaFolder.file(filename, fileData);
            }
          } catch {}
        }
      }
    }

    return await zip.generateAsync({ type: "blob" });
  }

  async deleteEverything(): Promise<void> {
    const userId = await this.getUserId();

    // 1. Delete files under user's folder in storage
    try {
      const { data: topItems } = await this.client.storage
        .from("memories")
        .list(userId);
      if (topItems && topItems.length > 0) {
        const pathsToDelete: string[] = [];
        for (const item of topItems) {
          pathsToDelete.push(`${userId}/${item.name}`);
          const { data: subFiles } = await this.client.storage
            .from("memories")
            .list(`${userId}/${item.name}`);
          if (subFiles && subFiles.length > 0) {
            for (const sf of subFiles) {
              pathsToDelete.push(`${userId}/${item.name}/${sf.name}`);
            }
          }
        }
        if (pathsToDelete.length > 0) {
          await this.client.storage.from("memories").remove(pathsToDelete);
        }
      }
    } catch {}

    // 2. Delete database rows (RLS allows users to delete own rows)
    await this.client.from("life_markers").delete().eq("user_id", userId);
    await this.client.from("notes").delete().eq("user_id", userId);
    await this.client.from("memories").delete().eq("user_id", userId);
    await this.client.from("instalments").delete().eq("user_id", userId);
    await this.client.from("sips").delete().eq("user_id", userId);
    await this.client.from("consents").delete().eq("user_id", userId);

    // 3. Get user session token and call server route /api/account/delete to delete auth user
    const {
      data: { session },
    } = await this.client.auth.getSession();
    const token = session?.access_token;

    if (token) {
      try {
        await fetch("/api/account/delete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {}
    }

    // 4. Sign out client
    await this.client.auth.signOut();
  }
}
