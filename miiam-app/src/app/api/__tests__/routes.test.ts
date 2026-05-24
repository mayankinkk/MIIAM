import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
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
    vi.resetModules();
  });

  it("GET /api/addresses returns 400 without user_id", async () => {
    const { GET } = await import("../addresses/route");
    const req = mockRequest("GET", "http://localhost:3000/api/addresses");
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("user_id required");
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
    vi.resetModules();
  });

  it("GET /api/settings returns valid response", async () => {
    const { GET } = await import("../settings/route");
    const req = mockRequest("GET", "http://localhost:3000/api/settings");
    const res = await GET(req);
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
