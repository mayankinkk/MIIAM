import { describe, it, expect } from "vitest";
import { getEventCopy, type PrintJobEvent } from "../print-notify";

describe("print-notify", () => {
  it("has copy for every event", () => {
    const events: PrintJobEvent[] = ["print_started", "print_ready", "out_for_delivery", "delivered", "print_failed"];
    for (const e of events) {
      const c = getEventCopy(e);
      expect(c.title.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(0);
    }
  });

  it("delivered has celebratory copy", () => {
    const c = getEventCopy("delivered");
    expect(c.title.toLowerCase()).toContain("delivered");
  });
});
