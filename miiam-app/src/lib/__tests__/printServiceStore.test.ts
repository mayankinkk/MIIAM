import { describe, it, expect } from "vitest";
import {
  DEFAULT_SERVICES,
  reorderAfterMove,
  selectAllServices,
  selectSortedEnabledServices,
  usePrintServiceStore,
  type PrintServiceConfig,
  type ServicePresetId,
} from "../store/printServiceStore";

const makeState = (services: PrintServiceConfig[]) => ({
  services,
  hydrated: true,
  setHydrated: () => {},
  setService: () => {},
  toggleEnabled: () => {},
  move: () => {},
  resetToDefaults: () => {},
});

describe("DEFAULT_SERVICES", () => {
  it("contains all 11 service presets", () => {
    expect(DEFAULT_SERVICES).toHaveLength(11);
  });

  it("every service has a unique order", () => {
    const orders = DEFAULT_SERVICES.map((s) => s.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it("every service is enabled by default", () => {
    expect(DEFAULT_SERVICES.every((s) => s.enabled)).toBe(true);
  });

  it("only the color service has a default badge", () => {
    const withBadge = DEFAULT_SERVICES.filter((s) => s.badge !== null);
    expect(withBadge).toHaveLength(1);
    expect(withBadge[0].id).toBe("color");
    expect(withBadge[0].badge).toBe("Popular");
  });

  it("every service has non-empty price and eta strings", () => {
    for (const s of DEFAULT_SERVICES) {
      expect(s.price.length).toBeGreaterThan(0);
      expect(s.eta.length).toBeGreaterThan(0);
    }
  });

  it("orders are 0..10 in sequence", () => {
    const sorted = [...DEFAULT_SERVICES].sort((a, b) => a.order - b.order);
    sorted.forEach((s, i) => expect(s.order).toBe(i));
  });
});

describe("selectSortedEnabledServices", () => {
  it("excludes disabled services", () => {
    const state = makeState([
      { id: "bw", enabled: true, price: "x", eta: "x", badge: null, order: 0 },
      { id: "color", enabled: false, price: "x", eta: "x", badge: null, order: 1 },
    ]);
    const result = selectSortedEnabledServices(state as never);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("bw");
  });

  it("sorts by order ascending", () => {
    const state = makeState([
      { id: "color", enabled: true, price: "x", eta: "x", badge: null, order: 5 },
      { id: "bw", enabled: true, price: "x", eta: "x", badge: null, order: 0 },
      { id: "passport", enabled: true, price: "x", eta: "x", badge: null, order: 2 },
    ]);
    const result = selectSortedEnabledServices(state as never);
    expect(result.map((s) => s.id)).toEqual(["bw", "passport", "color"]);
  });

  it("returns empty array when all disabled", () => {
    const state = makeState([
      { id: "bw", enabled: false, price: "x", eta: "x", badge: null, order: 0 },
    ]);
    expect(selectSortedEnabledServices(state as never)).toEqual([]);
  });
});

describe("selectAllServices", () => {
  it("returns all services sorted by order", () => {
    const state = makeState([
      { id: "color", enabled: false, price: "x", eta: "x", badge: null, order: 5 },
      { id: "bw", enabled: true, price: "x", eta: "x", badge: null, order: 0 },
    ]);
    const result = selectAllServices(state as never);
    expect(result).toHaveLength(2);
    expect(result.map((s) => s.id)).toEqual(["bw", "color"]);
  });
});

describe("reorderAfterMove", () => {
  const base = (): PrintServiceConfig[] => [
    { id: "bw", enabled: true, price: "p", eta: "e", badge: null, order: 0 },
    { id: "color", enabled: true, price: "p", eta: "e", badge: null, order: 1 },
    { id: "passport", enabled: true, price: "p", eta: "e", badge: null, order: 2 },
  ];

  it("moves a service up", () => {
    const result = reorderAfterMove(base(), "color", "up");
    expect(result.map((s) => s.id)).toEqual(["color", "bw", "passport"]);
    expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("moves a service down", () => {
    const result = reorderAfterMove(base(), "bw", "down");
    expect(result.map((s) => s.id)).toEqual(["color", "bw", "passport"]);
    expect(result.map((s) => s.order)).toEqual([0, 1, 2]);
  });

  it("first item cannot move up (no-op)", () => {
    const original = base();
    const result = reorderAfterMove(original, "bw", "up");
    expect(result.map((s) => s.id)).toEqual(["bw", "color", "passport"]);
  });

  it("last item cannot move down (no-op)", () => {
    const original = base();
    const result = reorderAfterMove(original, "passport", "down");
    expect(result.map((s) => s.id)).toEqual(["bw", "color", "passport"]);
  });

  it("unknown id is a no-op (returns original order array)", () => {
    const original = base();
    const result = reorderAfterMove(original, "fake" as ServicePresetId, "up");
    expect(result.map((s) => s.id)).toEqual(["bw", "color", "passport"]);
  });

  it("re-sequences order field after swap", () => {
    const unordered: PrintServiceConfig[] = [
      { id: "bw", enabled: true, price: "p", eta: "e", badge: null, order: 5 },
      { id: "color", enabled: true, price: "p", eta: "e", badge: null, order: 3 },
      { id: "passport", enabled: true, price: "p", eta: "e", badge: null, order: 7 },
    ];
    const result = reorderAfterMove(unordered, "bw", "down");
    const orders = result.map((s) => s.order);
    expect(orders).toEqual([0, 1, 2]);
  });
});

describe("usePrintServiceStore actions", () => {
  it("setService patches a single service", () => {
    usePrintServiceStore.setState({ services: DEFAULT_SERVICES.map((s) => ({ ...s })) });
    usePrintServiceStore.getState().setService("bw", { price: "from ₹5/pg" });
    const bw = usePrintServiceStore.getState().services.find((s) => s.id === "bw");
    expect(bw?.price).toBe("from ₹5/pg");
  });

  it("toggleEnabled flips the enabled flag", () => {
    usePrintServiceStore.setState({ services: DEFAULT_SERVICES.map((s) => ({ ...s })) });
    const before = usePrintServiceStore.getState().services.find((s) => s.id === "photo")?.enabled;
    usePrintServiceStore.getState().toggleEnabled("photo");
    const after = usePrintServiceStore.getState().services.find((s) => s.id === "photo")?.enabled;
    expect(after).toBe(!before);
  });

  it("toggleEnabled on unknown id is a no-op", () => {
    usePrintServiceStore.setState({ services: DEFAULT_SERVICES.map((s) => ({ ...s })) });
    const before = usePrintServiceStore.getState().services.length;
    usePrintServiceStore.getState().toggleEnabled("fake" as ServicePresetId);
    expect(usePrintServiceStore.getState().services.length).toBe(before);
  });

  it("move swaps orders and re-sequences", () => {
    usePrintServiceStore.setState({ services: DEFAULT_SERVICES.map((s) => ({ ...s })) });
    usePrintServiceStore.getState().move("color", "up");
    const sorted = [...usePrintServiceStore.getState().services].sort((a, b) => a.order - b.order);
    expect(sorted[0].id).toBe("color");
    expect(sorted[1].id).toBe("bw");
  });

  it("resetToDefaults restores the original catalog", () => {
    usePrintServiceStore.setState({ services: DEFAULT_SERVICES.map((s) => ({ ...s })) });
    usePrintServiceStore.getState().setService("bw", { price: "TEST" });
    usePrintServiceStore.getState().toggleEnabled("color");
    usePrintServiceStore.getState().resetToDefaults();
    const state = usePrintServiceStore.getState();
    expect(state.services).toEqual(DEFAULT_SERVICES);
  });
});
