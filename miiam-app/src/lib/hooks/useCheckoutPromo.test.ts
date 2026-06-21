import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheckoutPromo } from "./useCheckoutPromo";
import type { PromoCode } from "@/lib/checkout-utils";

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

const makePromo = (overrides: Partial<PromoCode> & { code: string }): PromoCode => ({
  discount_value: 10,
  min_order_amount: 100,
  discount_type: "percentage",
  is_active: true,
  ...overrides,
});

describe("useCheckoutPromo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies a valid promo code", () => {
    const promo = makePromo({ code: "SAVE10", discount_value: 10, min_order_amount: 100 });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 500, items: [] })
    );

    act(() => result.current.setPromoCode("SAVE10"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoApplied).toEqual({
      code: "SAVE10",
      discount: 50,
      type: "percent",
    });
    expect(result.current.promoError).toBe("");
  });

  it("rejects an expired promo code", () => {
    const promo = makePromo({
      code: "OLD",
      valid_until: "2020-01-01T00:00:00Z",
    });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 500, items: [] })
    );

    act(() => result.current.setPromoCode("OLD"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoApplied).toBeNull();
    expect(result.current.promoError).toBe("This promo code has expired");
  });

  it("rejects promo below minimum order amount", () => {
    const promo = makePromo({ code: "MIN500", min_order_amount: 500 });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 200, items: [] })
    );

    act(() => result.current.setPromoCode("MIN500"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoApplied).toBeNull();
    expect(result.current.promoError).toBe("Minimum order ₹500 required");
  });

  it("caps discount at max_discount", () => {
    const promo = makePromo({
      code: "CAP",
      discount_value: 50,
      max_discount: 100,
    });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 1000, items: [] })
    );

    act(() => result.current.setPromoCode("CAP"));
    act(() => result.current.handleApplyPromo());

    // 50% of 1000 = 500, capped at 100
    expect(result.current.promoApplied?.discount).toBe(100);
  });

  it("applies flat discount type", () => {
    const promo = makePromo({
      code: "FLAT50",
      discount_type: "flat",
      discount_value: 50,
    });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 300, items: [] })
    );

    act(() => result.current.setPromoCode("FLAT50"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoApplied).toEqual({
      code: "FLAT50",
      discount: 50,
      type: "flat",
    });
  });

  it("rejects invalid promo code", () => {
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [], subtotal: 500, items: [] })
    );

    act(() => result.current.setPromoCode("FAKE"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoApplied).toBeNull();
    expect(result.current.promoError).toBe("Invalid promo code");
  });

  it("rejects promo when usage limit reached", () => {
    const promo = makePromo({
      code: "LIMITED",
      usage_limit: 10,
      used_count: 10,
    });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 500, items: [] })
    );

    act(() => result.current.setPromoCode("LIMITED"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoError).toBe("This promo code has reached its usage limit");
  });

  it("rejects vendor-specific promo for non-matching vendor", () => {
    const promo = makePromo({
      code: "VENDOR_ONLY",
      vendor_id: "vendor-abc",
    });
    const { result } = renderHook(() =>
      useCheckoutPromo({
        promoCodes: [promo],
        subtotal: 500,
        items: [{ vendor_id: "vendor-xyz" }],
      })
    );

    act(() => result.current.setPromoCode("VENDOR_ONLY"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoError).toBe("This promo code is not applicable to items in your cart");
  });

  it("removePromo clears state", () => {
    const promo = makePromo({ code: "TEST", discount_value: 10 });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 500, items: [] })
    );

    act(() => result.current.setPromoCode("TEST"));
    act(() => result.current.handleApplyPromo());
    expect(result.current.promoApplied).not.toBeNull();

    act(() => result.current.removePromo());
    expect(result.current.promoApplied).toBeNull();
    expect(result.current.promoCode).toBe("");
  });

  it("is case-insensitive when matching promo codes", () => {
    const promo = makePromo({ code: "MIXED", discount_value: 20, discount_type: "flat" });
    const { result } = renderHook(() =>
      useCheckoutPromo({ promoCodes: [promo], subtotal: 500, items: [] })
    );

    act(() => result.current.setPromoCode("mixed"));
    act(() => result.current.handleApplyPromo());

    expect(result.current.promoApplied?.code).toBe("MIXED");
  });
});
