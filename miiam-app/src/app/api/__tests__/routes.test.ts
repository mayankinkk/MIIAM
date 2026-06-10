import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
    auth: { admin: { listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }) } },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: { from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn() }) },
  })),
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
    },
    from: mockFrom,
  })),
}));

function mockRequest(method: string, url: string, body?: unknown) {
  return {
    url,
    method,
    json: async () => body,
    headers: new Headers(),
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

describe("Addresses API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/addresses returns addresses when authenticated", async () => {
    const { GET } = await import("../addresses/route");
    const req = mockRequest("GET", "http://localhost:3000/api/addresses");
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty("addresses");
  });

  it("POST /api/addresses returns 400 with missing fields", async () => {
    const { POST } = await import("../addresses/route");
    const req = mockRequest("POST", "http://localhost:3000/api/addresses", { user_id: "123" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing required fields");
  });
});

describe("Settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/settings returns 401 when not admin", async () => {
    const { GET } = await import("../settings/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET /api/settings returns valid response when admin", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const queryMock = {
      select: vi.fn(() => queryMock),
      eq: vi.fn(() => queryMock),
      single: vi.fn(() => Promise.resolve({ data: { role: "admin" }, error: null })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    };
    const mockSupabase = {
      from: vi.fn(() => queryMock),
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "admin-user" } }, error: null })),
      },
    };
    (createClient as vi.Mock).mockResolvedValue(mockSupabase);

    const { GET } = await import("../settings/route");
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("Health check", () => {
  it("API route files exist and export handlers", async () => {
    const addrMod = await import("../addresses/route");
    expect(typeof addrMod.GET).toBe("function");
    expect(typeof addrMod.POST).toBe("function");

    const settingsMod = await import("../settings/route");
    expect(typeof settingsMod.GET).toBe("function");
    expect(typeof settingsMod.POST).toBe("function");

    const bookingsMod = await import("../bookings/route");
    expect(typeof bookingsMod.POST).toBe("function");
  });
});
