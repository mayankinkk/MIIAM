import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  readGuestOrders,
  rememberGuestOrder,
  getGuestOrder,
  guestOrderRefs,
  fetchGuestOrders,
} from "./guestOrders";

const KEY = "miiam_guest_orders";

describe("guestOrders", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores and reads back a reference", () => {
    rememberGuestOrder("order-1", "+919876543210");

    const refs = readGuestOrders();
    expect(refs).toHaveLength(1);
    expect(refs[0].id).toBe("order-1");
    expect(refs[0].phone).toBe("+919876543210");
    expect(getGuestOrder("order-1")?.phone).toBe("+919876543210");
    expect(getGuestOrder("missing")).toBeNull();
  });

  it("keeps the newest reference first and de-duplicates ids", () => {
    rememberGuestOrder("order-1", "+911111111111");
    rememberGuestOrder("order-2", "+912222222222");
    rememberGuestOrder("order-1", "+919999999999");

    const refs = readGuestOrders();
    expect(refs.map((r) => r.id)).toEqual(["order-1", "order-2"]);
    expect(refs[0].phone).toBe("+919999999999");
  });

  it("ignores empty ids/phones", () => {
    rememberGuestOrder("", "+919876543210");
    rememberGuestOrder("order-1", "");
    expect(readGuestOrders()).toHaveLength(0);
  });

  it("caps stored references at 50", () => {
    for (let i = 0; i < 60; i++) rememberGuestOrder(`order-${i}`, "+919876543210");

    const refs = readGuestOrders();
    expect(refs).toHaveLength(50);
    expect(refs[0].id).toBe("order-59");
    expect(refs[49].id).toBe("order-10");
  });

  it("drops malformed entries and unreadable payloads", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([{ id: "ok", phone: "+911" }, { bogus: true }, 7])
    );
    expect(readGuestOrders().map((r) => r.id)).toEqual(["ok"]);

    window.localStorage.setItem(KEY, "{not json");
    expect(readGuestOrders()).toEqual([]);

    window.localStorage.setItem(KEY, JSON.stringify({ nope: true }));
    expect(readGuestOrders()).toEqual([]);
  });

  it("returns bare id+phone pairs for the API", () => {
    rememberGuestOrder("order-1", "+919876543210");
    expect(guestOrderRefs()).toEqual([{ id: "order-1", phone: "+919876543210" }]);
  });

  it("fetches guest orders from the API", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ orders: [{ id: "order-1" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const orders = await fetchGuestOrders([{ id: "order-1", phone: "+919876543210" }]);
    expect(orders).toEqual([{ id: "order-1" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/orders/guest?refs=");
  });

  it("skips the network when there are no refs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await expect(fetchGuestOrders([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the server rejects the lookup", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 403 }));
    await expect(fetchGuestOrders([{ id: "order-1", phone: "+919876543210" }])).rejects.toThrow(
      "Guest orders lookup failed (403)"
    );
  });
});
