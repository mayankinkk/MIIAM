import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

function createDefaultFromMock() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
}

const mockSelect = vi.fn((_table?: string) => createDefaultFromMock());

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
const mockSubscribe = vi.fn().mockResolvedValue({});
const mockRemoveChannel = vi.fn();
const mockOnHandler = vi.fn(() => ({
  on: vi.fn(() => ({ subscribe: mockSubscribe })),
  subscribe: mockSubscribe,
}));
const mockChannelObj = vi.fn(() => ({
  on: mockOnHandler,
  subscribe: mockSubscribe,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: mockSelect,
    auth: { getUser: mockGetUser },
    channel: mockChannelObj,
    removeChannel: mockRemoveChannel,
  })),
}));

vi.mock("@/lib/store/toastStore", () => ({
  useToastStore: Object.assign(
    vi.fn(() => ({ addToast: vi.fn() })),
    {
      getState: vi.fn(() => ({ addToast: vi.fn() })),
      subscribe: vi.fn(),
      setState: vi.fn(),
    }
  ),
}));

vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { useOrderTracking } from "./useOrderTracking";

function eqChain(resolveValue: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(resolveValue),
        single: vi.fn().mockResolvedValue(resolveValue),
      }),
    }),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
}

describe("useOrderTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReset();
    mockSelect.mockImplementation(() => createDefaultFromMock());
  });

  it("starts with loading true and order null", () => {
    const { result } = renderHook(() => useOrderTracking("order-1"));
    expect(result.current.loading).toBe(true);
    expect(result.current.order).toBeNull();
  });

  it("fetches order data and sets loading to false", async () => {
    const orderData = {
      id: "order-1",
      status: "pending",
      total_amount: 500,
      user_id: "user-1",
      vendor_id: "v1",
      rider_id: null,
    };

    const calls: string[] = [];
    mockSelect.mockImplementation((table?: string) => {
      calls.push(table ?? "unknown");
      switch (table) {
        case "orders":
          return eqChain({ data: orderData, error: null });
        case "vendors":
          return eqChain({ data: { id: "v1", shop_name: "Test Shop" }, error: null });
        case "order_items":
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ data: [], error: null }),
            }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        case "rider_locations":
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        default:
          return createDefaultFromMock();
      }
    });

    const { result } = renderHook(() => useOrderTracking("order-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toBeDefined();
    expect(result.current.order?.id).toBe("order-1");
  });

  it("sets up realtime subscription", async () => {
    const { result } = renderHook(() => useOrderTracking("order-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockChannelObj).toHaveBeenCalledWith("order-tracking-order-1");
  });

  it("cleans up channel on unmount", async () => {
    const { unmount, result } = renderHook(() => useOrderTracking("order-1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  it("sets order to null on fetch error", async () => {
    mockSelect.mockReset();
    mockSelect.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
        }),
      }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const { result } = renderHook(() => useOrderTracking("order-missing"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toBeNull();
  });
});
