import { describe, it, expect, vi } from "vitest";
import { LockerStore, DemoStore, CloudStore, demoStore } from "../../lib/store";

describe("Store Interface & Cloud Consent Enforcement (§5, §7, §10)", () => {
  it("both demoStore and CloudStore implement all required LockerStore methods", () => {
    const requiredMethods: (keyof LockerStore)[] = [
      "mode",
      "isConsented",
      "recordConsent",
      "getSip",
      "getInstalments",
      "saveMemory",
      "savePromise",
      "updateSipStatus",
      "saveYearTwoNote",
      "getYearTwoNote",
      "startFromDemo",
      "uploadMedia",
      "getMediaUrl",
      "exportLocker",
      "deleteEverything",
    ];

    const mockSupabase: any = {
      auth: { getUser: vi.fn(), getSession: vi.fn(), signOut: vi.fn() },
      from: vi.fn(),
      storage: { from: vi.fn() },
    };
    const cloudStore = new CloudStore(mockSupabase);

    for (const method of requiredMethods) {
      expect(demoStore).toHaveProperty(method);
      expect(cloudStore).toHaveProperty(method);
    }
  });

  it("CloudStore strictly refuses writes before consent is recorded", async () => {
    // Mock Supabase client where user is authenticated but consents table has no rows
    const mockSupabase: any = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-123" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    };

    const cloudStore = new CloudStore(mockSupabase);

    // Verify user is not consented
    const consented = await cloudStore.isConsented();
    expect(consented).toBe(false);

    const consentErrorMsg = "Consent required before writing to cloud storage.";

    // 1. saveMemory
    await expect(
      cloudStore.saveMemory("inst-1", { kind: "text", text: "test" })
    ).rejects.toThrow(consentErrorMsg);

    // 2. savePromise
    await expect(
      cloudStore.savePromise({
        text: "My promise",
        oneLine: "One line",
        goal: "savings",
        forWhom: "family",
        horizon: "3 years",
        showAtCancel: false,
      })
    ).rejects.toThrow(consentErrorMsg);

    // 3. updateSipStatus
    await expect(cloudStore.updateSipStatus("paused")).rejects.toThrow(
      consentErrorMsg
    );

    // 4. saveYearTwoNote
    await expect(
      cloudStore.saveYearTwoNote({ text: "Year 2 note" })
    ).rejects.toThrow(consentErrorMsg);

    // 5. startFromDemo
    await expect(cloudStore.startFromDemo()).rejects.toThrow(consentErrorMsg);

    // 6. uploadMedia
    await expect(
      cloudStore.uploadMedia(new Blob(["test-audio"]), "test.webm")
    ).rejects.toThrow(consentErrorMsg);
  });

  it("CloudStore permits writes once consent is recorded", async () => {
    // Mock Supabase client where user is authenticated and consents table has a row
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase: any = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "test-user-123" } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "consents") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: "consent-row-1" }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "sips") {
          return {
            update: mockUpdate,
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    };

    const cloudStore = new CloudStore(mockSupabase);
    expect(await cloudStore.isConsented()).toBe(true);

    // Should succeed without throwing consent error
    await expect(
      cloudStore.updateSipStatus("active", "2027-01-01", "New year")
    ).resolves.not.toThrow();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        return_date: "2027-01-01",
        return_label: "New year",
      })
    );
  });

  it("demoStore operates in memory / sessionStorage and exports valid ZIP bundle", async () => {
    const freshDemoStore = new DemoStore();
    expect(freshDemoStore.mode).toBe("demo");

    const sip = await freshDemoStore.getSip();
    expect(sip).toBeDefined();
    expect(sip?.name).toBe("My first bike");

    const instalments = await freshDemoStore.getInstalments();
    expect(instalments.length).toBe(11);

    // Update memory in demo store
    await freshDemoStore.saveMemory(instalments[0].id, {
      kind: "text",
      text: "Updated demo note",
    });

    const updatedInsts = await freshDemoStore.getInstalments();
    expect(updatedInsts[0].memory?.text).toBe("Updated demo note");

    // Export ZIP
    const zipBlob = await freshDemoStore.exportLocker();
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(100);
  });
});
