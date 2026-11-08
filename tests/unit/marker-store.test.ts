import { describe, it, expect, vi } from "vitest";
import { DemoStore, CloudStore } from "../../lib/store";

describe("Marker Store Operations (§7, §8)", () => {
  it("DemoStore marker CRUD (in-memory & sessionStorage)", async () => {
    const store = new DemoStore();

    // 1. Save marker
    const id = await store.saveMarker({
      month: "2026-11",
      kind: "text",
      caption: "November life milestone",
    });
    expect(id).toBeTruthy();

    // 2. List markers
    let list = await store.listMarkers();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(id);
    expect(list[0].month).toBe("2026-11");
    expect(list[0].caption).toBe("November life milestone");

    // 3. Update marker
    await store.updateMarker(id, { caption: "Updated caption" });
    list = await store.listMarkers();
    expect(list[0].caption).toBe("Updated caption");

    // 4. Delete marker
    await store.deleteMarker(id);
    list = await store.listMarkers();
    expect(list.length).toBe(0);
  });

  it("CloudStore marker operations with mocked Supabase client", async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "cloud-marker-123" },
          error: null,
        }),
      }),
    });

    const mockSelectChain: any = {
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "cloud-marker-123",
            month: "2026-11",
            kind: "photo",
            caption: "Cloud photo",
            storage_path: "user-123/markers/photo.jpg",
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: "cloud-marker-123",
          storage_path: "user-123/markers/photo.jpg",
        },
        error: null,
      }),
    };
    mockSelectChain.eq = vi.fn().mockReturnValue(mockSelectChain);

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(mockSelectChain),
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    const mockSupabase: any = {
      storage: {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({ error: null }),
          upload: vi.fn().mockResolvedValue({ data: { path: "p" }, error: null }),
        }),
      },
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-test-123" } },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "consents") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ id: "consent-1" }],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "sips") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: { id: "sip-123" },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "life_markers") {
          return {
            insert: mockInsert,
            select: mockSelect,
            update: mockUpdate,
            delete: mockDelete,
          };
        }
        return {};
      }),
    };

    const cloudStore = new CloudStore(mockSupabase);

    // List
    const list = await cloudStore.listMarkers();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("cloud-marker-123");

    // Save
    const savedId = await cloudStore.saveMarker({
      month: "2026-11",
      kind: "photo",
      caption: "New marker",
    });
    expect(savedId).toBe("cloud-marker-123");

    // Update
    await expect(
      cloudStore.updateMarker("cloud-marker-123", { caption: "Updated" })
    ).resolves.not.toThrow();

    // Delete
    await expect(
      cloudStore.deleteMarker("cloud-marker-123")
    ).resolves.not.toThrow();
  });
});

