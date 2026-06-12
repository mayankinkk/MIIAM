/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockQueryChain = () => {
  const chain: any = {
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
  };
  return chain;
};

let profileQueryResult: any = { data: null, error: null };

const mockFrom = vi.fn(() => {
  const chain = mockQueryChain();
  chain.single.mockImplementation(() => Promise.resolve(profileQueryResult));
  chain.maybeSingle.mockImplementation(() => Promise.resolve(profileQueryResult));
  return chain;
});

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        getUserById: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
      },
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://test.com/file.png" } }),
      }),
    },
  })),
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
}));

vi.mock("razorpay", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: vi.fn().mockResolvedValue({
          id: "order_test123",
          amount: 10000,
          currency: "INR",
        }),
      },
    })),
  };
});

function mockRequest(method: string, url: string, body?: unknown) {
  return {
    url,
    method,
    json: async () => body,
    headers: new Headers(),
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  profileQueryResult = { data: null, error: null };
  mockGetUser.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
});

describe("Addresses API", () => {
  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("../addresses/route");
    const req = mockRequest("GET", "http://localhost:3000/api/addresses");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("GET returns addresses when authenticated", async () => {
    const { GET } = await import("../addresses/route");
    const req = mockRequest("GET", "http://localhost:3000/api/addresses");
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toHaveProperty("addresses");
  });

  it("POST returns 400 with missing fields", async () => {
    const { POST } = await import("../addresses/route");
    const req = mockRequest("POST", "http://localhost:3000/api/addresses", { user_id: "123" });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing required fields");
  });

  it("POST returns 403 when user_id mismatch", async () => {
    const { POST } = await import("../addresses/route");
    const req = mockRequest("POST", "http://localhost:3000/api/addresses", {
      user_id: "other-user",
      label: "Home",
      address: "123 Main St",
      city: "Delhi",
      pincode: "110001",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });

  it("DELETE returns 400 without ID", async () => {
    const { DELETE } = await import("../addresses/route");
    const req = mockRequest("DELETE", "http://localhost:3000/api/addresses");
    const res = await DELETE(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Address ID required");
  });

  it("PUT returns 400 without ID", async () => {
    const { PUT } = await import("../addresses/route");
    const req = mockRequest("PUT", "http://localhost:3000/api/addresses", { label: "Home" });
    const res = await PUT(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Address ID required");
  });
});

describe("Settings API", () => {
  it("GET returns 403 when not admin", async () => {
    profileQueryResult = { data: { role: "user" }, error: null };
    const { GET } = await import("../settings/route");
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("../settings/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns 200 when admin", async () => {
    profileQueryResult = { data: { role: "admin" }, error: null };
    const { GET } = await import("../settings/route");
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("PUT returns 400 without key", async () => {
    profileQueryResult = { data: { role: "admin" }, error: null };
    const { PUT } = await import("../settings/route");
    const req = mockRequest("PUT", "http://localhost:3000/api/settings", { value: "test" });
    const res = await PUT(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Key is required");
  });

  it("POST returns 400 without settings object", async () => {
    profileQueryResult = { data: { role: "admin" }, error: null };
    const { POST } = await import("../settings/route");
    const req = mockRequest("POST", "http://localhost:3000/api/settings", {});
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Settings object required");
  });
});

describe("Rider Cancel Order API", () => {
  it("POST returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../rider/cancel-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/rider/cancel-order", {
      order_id: "ord-1",
      rider_id: "rider-1",
      reason: "Too far",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 400 with missing fields", async () => {
    const { POST } = await import("../rider/cancel-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/rider/cancel-order", {
      order_id: "ord-1",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing fields");
  });

  it("POST returns 403 when rider not owned by user", async () => {
    profileQueryResult = { data: null, error: { message: "not found" } };
    const { POST } = await import("../rider/cancel-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/rider/cancel-order", {
      order_id: "ord-1",
      rider_id: "other-rider",
      reason: "Too far",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });
});

describe("Bookings API", () => {
  it("GET returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { GET } = await import("../bookings/route");
    const req = mockRequest("GET", "http://localhost:3000/api/bookings");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../bookings/route");
    const req = mockRequest("POST", "http://localhost:3000/api/bookings", {
      service_id: "svc-1",
      user_id: "test-user",
      provider_id: "prov-1",
      scheduled_date: "2026-06-15",
      scheduled_time: "10:00",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 400 with missing fields", async () => {
    const { POST } = await import("../bookings/route");
    const req = mockRequest("POST", "http://localhost:3000/api/bookings", {
      service_id: "svc-1",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing required fields");
  });

  it("GET returns 403 when querying other user's bookings", async () => {
    const { GET } = await import("../bookings/route");
    const req = mockRequest("GET", "http://localhost:3000/api/bookings?user_id=other-user");
    const res = await GET(req);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
  });
});

describe("Health Check - API Routes Exist", () => {
  it("core route files exist and export handlers", async () => {
    const routes = [
      { path: "../addresses/route", methods: ["GET", "POST", "PUT", "DELETE"] },
      { path: "../settings/route", methods: ["GET", "PUT", "POST"] },
      { path: "../bookings/route", methods: ["GET", "POST"] },
      { path: "../rider/cancel-order/route", methods: ["POST"] },
    ];

    for (const route of routes) {
      const mod = await import(route.path);
      for (const method of route.methods) {
        expect(typeof mod[method]).toBe("function");
      }
    }
  });
});
