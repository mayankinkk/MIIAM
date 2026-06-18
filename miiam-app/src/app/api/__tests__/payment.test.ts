/// <reference types="vitest/globals" />
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

interface QueryChain {
  select: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

const mockQueryChain = (): QueryChain => {
  const chain: QueryChain = {
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

interface QueryResult {
  data: unknown;
  error: unknown;
}

let profileQueryResult: QueryResult = { data: null, error: null };
let orderQueryResult: QueryResult = { data: null, error: null };

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
    default: vi.fn().mockImplementation(function() {
      return {
        orders: {
          create: vi.fn().mockResolvedValue({
            id: "order_test123",
            amount: 10000,
            currency: "INR",
          }),
        },
        payments: {
          fetch: vi.fn().mockResolvedValue({
            id: "pay_test123",
            status: "captured",
            amount: 10000,
            method: "upi",
          }),
        },
      };
    }),
  };
});

vi.mock("@/lib/security", () => ({
  checkCsrf: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  checkIpRateLimit: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/logger", () => ({
  createRouteLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

function mockRequest(method: string, url: string, body?: unknown, headers?: Record<string, string>) {
  const requestHeaders = new Headers();
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });
  }
  return {
    url,
    method,
    json: async () => body,
    headers: requestHeaders,
    nextUrl: new URL(url),
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  profileQueryResult = { data: null, error: null };
  orderQueryResult = { data: null, error: null };
  mockGetUser.mockResolvedValue({ data: { user: { id: "test-user" } }, error: null });
});

describe("Payment Create Order API", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "test_key";
    process.env.RAZORPAY_KEY_SECRET = "test_secret";
  });

  it("POST returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../payment/create-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/create-order", {
      amount: 500,
      currency: "INR",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 400 with missing amount", async () => {
    const { POST } = await import("../payment/create-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/create-order", {
      currency: "INR",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("POST returns 400 with invalid amount", async () => {
    const { POST } = await import("../payment/create-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/create-order", {
      amount: -100,
      currency: "INR",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
  });

  it("POST returns 503 when Razorpay not configured", async () => {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    const { POST } = await import("../payment/create-order/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/create-order", {
      amount: 500,
      currency: "INR",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.error).toContain("Payment gateway not configured");
  });
});

describe("Payment Verify API", () => {
  it("POST returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const { POST } = await import("../payment/verify/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/verify", {
      razorpay_order_id: "order_test123",
      razorpay_payment_id: "pay_test123",
      razorpay_signature: "test_signature",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("POST returns 400 with missing parameters", async () => {
    const { POST } = await import("../payment/verify/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/verify", {
      razorpay_order_id: "order_test123",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Missing payment verification parameters");
  });

  it("POST returns 400 with invalid signature", async () => {
    const { POST } = await import("../payment/verify/route");
    const req = mockRequest("POST", "http://localhost:3000/api/payment/verify", {
      razorpay_order_id: "order_test123",
      razorpay_payment_id: "pay_test123",
      razorpay_signature: "invalid_signature_that_does_not_match",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("Payment signature verification failed");
  });
});

describe("Health Check - Critical API Routes", () => {
  it("payment routes exist and export handlers", async () => {
    const routes = [
      { path: "../payment/create-order/route", methods: ["POST"] },
      { path: "../payment/verify/route", methods: ["POST"] },
    ];

    for (const route of routes) {
      const mod = await import(route.path);
      for (const method of route.methods) {
        expect(typeof mod[method]).toBe("function");
      }
    }
  });
});
