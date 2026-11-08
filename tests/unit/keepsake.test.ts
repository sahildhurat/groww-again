import { describe, it, expect, beforeEach } from "vitest";
import {
  clearAll,
  deleteMemory,
  getMemory,
  getReason,
  hasContent,
  isValidMonth,
  listMemories,
  saveMemory,
  saveReason,
  formatSeconds,
} from "@/lib/keepsake";

// Final MVP (8 Nov 2026): the version B keepsake store. In Node there is no IndexedDB, so this exercises the
// in-memory fallback, which shares the same logic.
describe("keepsake store", () => {
  beforeEach(async () => {
    await clearAll();
  });

  it("accepts only YYYY-MM months", () => {
    expect(isValidMonth("2026-10")).toBe(true);
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("26-10")).toBe(false);
  });

  it("saves, lists in month order and deletes a memory", async () => {
    await saveMemory({ month: "2026-10", text: "  First month at the new job  " });
    await saveMemory({ month: "2026-03", text: "Holi at home" });
    const list = await listMemories();
    expect(list.map((m) => m.month)).toEqual(["2026-03", "2026-10"]);
    expect((await getMemory("2026-10"))?.text).toBe("First month at the new job");
    await deleteMemory("2026-10");
    expect(await getMemory("2026-10")).toBeUndefined();
  });

  it("rejects an invalid month and drops an empty memory", async () => {
    await expect(saveMemory({ month: "2026-1", text: "x" })).rejects.toThrow();
    await saveMemory({ month: "2026-04", text: "x" });
    await saveMemory({ month: "2026-04", text: "   " });
    expect(await getMemory("2026-04")).toBeUndefined();
  });

  it("limits a line to 200 characters and a reason to 280", async () => {
    await saveMemory({ month: "2026-05", text: "a".repeat(500) });
    expect((await getMemory("2026-05"))?.text?.length).toBe(200);
    await saveReason({ text: "b".repeat(500) });
    expect((await getReason())?.text?.length).toBe(280);
  });

  it("an empty reason deletes the saved one", async () => {
    await saveReason({ text: "For my first bike" });
    expect((await getReason())?.text).toBe("For my first bike");
    await saveReason({ text: " " });
    expect(await getReason()).toBeUndefined();
  });

  it("clearAll removes the reason and every memory", async () => {
    await saveReason({ text: "x" });
    await saveMemory({ month: "2026-06", text: "y" });
    await clearAll();
    expect(await getReason()).toBeUndefined();
    expect(await listMemories()).toEqual([]);
  });

  it("hasContent and formatSeconds", () => {
    expect(hasContent({ text: " " })).toBe(false);
    expect(hasContent({ photo: "data:image/jpeg;base64,AA" })).toBe(true);
    expect(formatSeconds(65)).toBe("1:05");
    expect(formatSeconds(undefined)).toBe("0:00");
  });
});

describe("friend's name (Ask a friend)", () => {
  it("keeps one first name, trims it to 30 characters, and an empty name removes it", async () => {
    const { getFriend, saveFriend, clearAll: wipe } = await import("@/lib/keepsake");
    await wipe();
    expect(await getFriend()).toEqual({});
    await saveFriend({ name: "  Demo  " });
    expect(await getFriend()).toEqual({ name: "Demo" });
    await saveFriend({ name: "x".repeat(40) });
    expect((await getFriend()).name).toHaveLength(30);
    await saveFriend({ name: "   " });
    expect(await getFriend()).toEqual({});
    await saveFriend({ name: "Demo" });
    await wipe();
    expect(await getFriend()).toEqual({});
  });
});
