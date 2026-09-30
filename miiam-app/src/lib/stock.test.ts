import { describe, it, expect, vi, beforeEach } from "vitest";

const hoisted = vi.hoisted(() => {
  const inArgs: string[][] = [];
  let response: { data: unknown; error: unknown } = { data: [], error: null };
  const fromMock = vi.fn();
  return { inArgs, responseRef: { get: () => response, set: (v: typeof response) => (response = v) }, fromMock };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: hoisted.fromMock }),
}));

vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { checkStock, decrementStock, restoreStock } from "@/lib/stock";

type Result = { data: unknown; error: unknown };

function chain(result: Result) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = vi.fn(self);
  builder.in = vi.fn((_column: string, values: string[]) => {
    hoisted.inArgs.push(values);
    return builder;
  });
  builder.eq = vi.fn(self);
  builder.gte = vi.fn(self);
  builder.update = vi.fn(self);
  builder.insert = vi.fn((_rows: unknown) => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.then = (onFulfilled: unknown, onRejected: unknown) =>
    Promise.resolve(result).then(onFulfilled as never, onRejected as never);
  return builder as never;
}

beforeEach(() => {
  hoisted.inArgs.length = 0;
  hoisted.responseRef.set({ data: [], error: null });
  hoisted.fromMock.mockReset();
  hoisted.fromMock.mockImplementation(() => chain(hoisted.responseRef.get()));
});

const uuid = "ccc2aa64-268d-47d6-aad7-c6a7dd076125";

describe("checkStock", () => {
  it("never queries PostgREST with ids that are not UUIDs", async () => {
    const result = await checkStock([
      { menu_item_id: "combo-3ff244f5-4196-4411-9f37-33cbe961de87", quantity: 1, name: "Family combo", vendor_id: uuid },
    ]);

    expect(hoisted.fromMock).not.toHaveBeenCalled();
    expect(result.checked).toBe(true);
    expect(result.available).toBe(true);
    expect(result.items[0]?.in_stock).toBe(true);
  });

  it("sends only real UUIDs and reports untracked lines as available", async () => {
    hoisted.responseRef.set({ data: [{ id: uuid, name: "Paneer pizza", stock: 1, is_available: true }], error: null });

    const result = await checkStock([
      { menu_item_id: uuid, quantity: 2, name: "Paneer pizza", vendor_id: uuid },
      { menu_item_id: "combo-not-a-uuid", quantity: 1, name: "Combo", vendor_id: uuid },
      { menu_item_id: "66dedf8b-629e-4612-b553-0a0661e07b77", quantity: 1, name: "Store item", vendor_id: uuid },
    ]);

    expect(hoisted.inArgs[0]).toEqual([uuid, "66dedf8b-629e-4612-b553-0a0661e07b77"]);
    expect(result.checked).toBe(true);
    expect(result.items).toHaveLength(3);
    expect(result.items.find((i) => i.menu_item_id === uuid)?.in_stock).toBe(false);
    expect(result.items.find((i) => i.menu_item_id === "combo-not-a-uuid")?.in_stock).toBe(true);
    expect(result.available).toBe(false);
  });

  it("returns checked=false when the lookup itself fails", async () => {
    hoisted.responseRef.set({ data: null, error: { message: "boom" } });

    const result = await checkStock([
      { menu_item_id: uuid, quantity: 1, name: "Paneer pizza", vendor_id: uuid },
    ]);

    expect(result.checked).toBe(false);
    expect(result.available).toBe(true);
  });
});

describe("decrementStock", () => {
  it("skips untracked ids and still succeeds when stock_movements is missing", async () => {
    const calls: string[] = [];
    hoisted.fromMock.mockImplementation((table: string) => {
      calls.push(table);
      const result: Result =
        table === "stock_movements"
          ? { data: null, error: { message: "relation \"stock_movements\" does not exist" } }
          : { data: [{ id: uuid }], error: null };
      return chain(result);
    });

    const result = await decrementStock(
      [
        { menu_item_id: uuid, quantity: 1, name: "Paneer pizza", vendor_id: uuid },
        { menu_item_id: "combo-not-a-uuid", quantity: 1, name: "Combo", vendor_id: uuid },
      ],
      "862cc9ba-78b6-453f-9467-1d133fe55a8b"
    );

    expect(result.success).toBe(true);
    expect(calls.filter((t) => t === "stock_movements")).toHaveLength(1);
  });
});

describe("restoreStock", () => {
  it("does not throw when stock_movements does not exist", async () => {
    hoisted.fromMock.mockImplementation(() =>
      chain({ data: null, error: { message: "relation \"stock_movements\" does not exist" } })
    );

    await expect(restoreStock("862cc9ba-78b6-453f-9467-1d133fe55a8b")).resolves.toBeUndefined();
  });
});
