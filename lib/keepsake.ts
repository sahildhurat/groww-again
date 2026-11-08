/**
 * Keepsake store (version B personal layer), final MVP, 8 Nov 2026 (Claude).
 *
 * Holds what the investor adds for their future self: "Why I started" (text or a voice note) and one memory per
 * month (a photo, a voice note and/or a line), plus the first name of the one friend they ask (Ask a friend). Everything stays in this browser (IndexedDB); nothing is uploaded,
 * nothing is sent to the AI. Falls back to memory only when IndexedDB is unavailable (private mode, tests).
 */

export interface ReasonRecord {
  text?: string;
  voice?: Blob;
  voiceSec?: number;
  updatedAt: string;
}

export interface MemoryRecord {
  month: string; // YYYY-MM
  text?: string;
  photo?: string; // data URL of a compressed JPEG, location data removed
  voice?: Blob;
  voiceSec?: number;
  updatedAt: string;
}

export interface FriendRecord {
  name?: string; // first name or nickname only; no phone number is collected
}

const DB_NAME = "sip_passbook_keepsake_v1";
const STORE = "kv";
const REASON_KEY = "reason";
const FRIEND_KEY = "friend";
const MEMORY_PREFIX = "memory:";
export const KEEPSAKE_EVENT = "keepsake-changed";

const memoryFallback = new Map<string, unknown>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  if (!db) return memoryFallback.get(key) as T | undefined;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => resolve(memoryFallback.get(key) as T | undefined);
    } catch {
      resolve(memoryFallback.get(key) as T | undefined);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  memoryFallback.set(key, value);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function idbDelete(key: string): Promise<void> {
  memoryFallback.delete(key);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbKeys(): Promise<string[]> {
  const db = await openDb();
  if (!db) return Array.from(memoryFallback.keys());
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
      req.onerror = () => resolve(Array.from(memoryFallback.keys()));
    } catch {
      resolve(Array.from(memoryFallback.keys()));
    }
  });
}

function changed() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(KEEPSAKE_EVENT));
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

export function hasContent(r: { text?: string; voice?: Blob; photo?: string } | undefined | null): boolean {
  return Boolean(r && ((r.text && r.text.trim()) || r.voice || r.photo));
}

export async function getReason(): Promise<ReasonRecord | undefined> {
  return idbGet<ReasonRecord>(REASON_KEY);
}

export async function saveReason(r: Omit<ReasonRecord, "updatedAt">): Promise<void> {
  const text = r.text?.trim().slice(0, 280) || undefined;
  if (!text && !r.voice) return deleteReason();
  await idbSet(REASON_KEY, { text, voice: r.voice, voiceSec: r.voiceSec, updatedAt: new Date().toISOString() });
  changed();
}

export async function deleteReason(): Promise<void> {
  await idbDelete(REASON_KEY);
  changed();
}

export async function getMemory(month: string): Promise<MemoryRecord | undefined> {
  if (!isValidMonth(month)) return undefined;
  return idbGet<MemoryRecord>(MEMORY_PREFIX + month);
}

export async function saveMemory(m: Omit<MemoryRecord, "updatedAt">): Promise<void> {
  if (!isValidMonth(m.month)) throw new Error("Invalid month");
  const record: MemoryRecord = {
    month: m.month,
    text: m.text?.trim().slice(0, 200) || undefined,
    photo: m.photo,
    voice: m.voice,
    voiceSec: m.voiceSec,
    updatedAt: new Date().toISOString(),
  };
  if (!hasContent(record)) return deleteMemory(m.month);
  await idbSet(MEMORY_PREFIX + m.month, record);
  changed();
}

export async function deleteMemory(month: string): Promise<void> {
  await idbDelete(MEMORY_PREFIX + month);
  changed();
}

export async function listMemories(): Promise<MemoryRecord[]> {
  const keys = (await idbKeys()).filter((k) => k.startsWith(MEMORY_PREFIX));
  const out: MemoryRecord[] = [];
  for (const k of keys) {
    const m = await idbGet<MemoryRecord>(k);
    if (m && hasContent(m)) out.push(m);
  }
  return out.sort((a, b) => a.month.localeCompare(b.month));
}

export async function getFriend(): Promise<FriendRecord> {
  return (await idbGet<FriendRecord>(FRIEND_KEY)) ?? {};
}

/** The one person the investor asks (version B, Ask a friend). Name only, on this device. */
export async function saveFriend(f: FriendRecord): Promise<void> {
  const name = f.name?.trim().slice(0, 30) || undefined;
  if (!name) {
    await idbDelete(FRIEND_KEY);
  } else {
    await idbSet(FRIEND_KEY, { name });
  }
  changed();
}

export async function deleteAllMemories(): Promise<void> {
  const keys = (await idbKeys()).filter((k) => k.startsWith(MEMORY_PREFIX));
  for (const k of keys) await idbDelete(k);
  changed();
}

/** Removes everything the investor added: reason, memories, friend's name (Your data → Delete everything; Demo tools → Reset). */
export async function clearAll(): Promise<void> {
  const keys = await idbKeys();
  for (const k of keys) await idbDelete(k);
  memoryFallback.clear();
  changed();
}

export function formatSeconds(sec?: number): string {
  const s = Math.max(0, Math.round(sec ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Reads a Blob as a data URL (used to keep a compressed photo as a string). */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
