import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabase = {
  from: vi.fn(),
  auth: { getUser: vi.fn() },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

function buildMockSupabase(data: unknown) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
  };
  return chainable;
}

describe("Recurring schedules API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });
    const { GET } = await import("@/app/api/recurring-schedules/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST validates required fields", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const { POST } = await import("@/app/api/recurring-schedules/route");
    const res = await POST(new Request("http://localhost:3000/api/recurring-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: "v1" }),
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing required fields");
  });

  it("POST creates schedule with valid data", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const mockData = { id: "s1", vendor_id: "v1", frequency: "weekly", status: "active" };
    mockSupabase.from.mockReturnValue(buildMockSupabase(mockData));

    const { POST } = await import("@/app/api/recurring-schedules/route");
    const res = await POST(new Request("http://localhost:3000/api/recurring-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: "v1",
        frequency: "weekly",
        day_of_week: 1,
        delivery_time: "09:00 AM - 11:00 AM",
        delivery_address: "123 Main St",
        payment_method: "card",
        items: [{ menu_item_id: "p1", name: "Apple", price: 50, quantity: 2 }],
      }),
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("s1");
  });

  it("PATCH updates schedule status", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const mockData = { id: "s1", status: "paused" };
    mockSupabase.from.mockReturnValue(buildMockSupabase(mockData));

    const { PATCH } = await import("@/app/api/recurring-schedules/[id]/route");
    const req = new Request("http://localhost:3000/api/recurring-schedules/s1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paused" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("paused");
  });

  it("DELETE removes schedule", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSupabase.from.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    });

    const { DELETE } = await import("@/app/api/recurring-schedules/[id]/route");
    const req = new Request("http://localhost:3000/api/recurring-schedules/s1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "s1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("next delivery date calculation", () => {
  const calculateNextDeliveryDate = (
    frequency: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
    from: Date = new Date()
  ): Date => {
    const next = new Date(from);
    next.setHours(0, 0, 0, 0);

    if (frequency === "daily") {
      next.setDate(next.getDate() + 1);
      return next;
    }

    if (frequency === "weekly" && dayOfWeek !== undefined) {
      const diff = (dayOfWeek - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + diff);
      return next;
    }

    if (frequency === "biweekly" && dayOfWeek !== undefined) {
      const diff = (dayOfWeek - next.getDay() + 7) % 7;
      next.setDate(next.getDate() + diff + 14);
      return next;
    }

    if (frequency === "monthly" && dayOfMonth !== undefined) {
      next.setDate(1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(dayOfMonth, lastDay));
      if (next <= from) {
        next.setDate(1);
        next.setMonth(next.getMonth() + 1);
        const lastDayNext = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(dayOfMonth, lastDayNext));
      }
      return next;
    }

    return next;
  };

  it("returns next day for daily frequency", () => {
    const from = new Date(2026, 4, 26);
    const next = calculateNextDeliveryDate("daily", undefined, undefined, from);
    const diff = Math.round((next.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(1);
  });

  it("returns next Monday for weekly on Monday", () => {
    const from = new Date(2026, 4, 26); // Tuesday May 26
    const next = calculateNextDeliveryDate("weekly", 1, undefined, from); // Monday = 1
    const diff = Math.round((next.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(6);
  });

  it("returns biweekly date", () => {
    const from = new Date(2026, 4, 26); // Tuesday May 26
    const next = calculateNextDeliveryDate("biweekly", 3, undefined, from); // Wednesday = 3
    const diff = Math.round((next.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(15); // 1 day to Wednesday + 14 days = 15
  });

  it("returns next month for monthly frequency", () => {
    const from = new Date(2026, 4, 26); // May 26
    const next = calculateNextDeliveryDate("monthly", undefined, 15, from);
    const diff = Math.round((next.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(20); // May 15 is before May 26, so next = June 15, which is 20 days
  });

  it("handles end-of-month clamping", () => {
    const from = new Date(2026, 0, 31);
    const next = calculateNextDeliveryDate("monthly", undefined, 31, from);
    const diff = next.getTime() - from.getTime();
    expect(diff).toBeGreaterThan(0);
    expect(next.getDate()).toBeLessThanOrEqual(28);
  });
});
