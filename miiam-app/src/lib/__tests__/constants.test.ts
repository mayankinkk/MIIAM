import { describe, it, expect } from "vitest";
import { SERVICES_VENDOR_ID } from "../constants";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("vendor id constants", () => {
  it("SERVICES_VENDOR_ID is a valid UUID", () => {
    expect(SERVICES_VENDOR_ID).toMatch(UUID_REGEX);
  });
});
