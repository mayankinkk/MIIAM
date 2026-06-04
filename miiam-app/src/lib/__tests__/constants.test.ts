import { describe, it, expect } from "vitest";
import {
  PRINTING_VENDOR_ID,
  PRINT_MENU_ITEM_ID,
  SERVICES_VENDOR_ID,
} from "../constants";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("vendor id constants", () => {
  it("PRINTING_VENDOR_ID is a valid UUID", () => {
    expect(PRINTING_VENDOR_ID).toMatch(UUID_REGEX);
  });

  it("SERVICES_VENDOR_ID is a valid UUID", () => {
    expect(SERVICES_VENDOR_ID).toMatch(UUID_REGEX);
  });

  it("PRINT_MENU_ITEM_ID is a valid UUID", () => {
    expect(PRINT_MENU_ITEM_ID).toMatch(UUID_REGEX);
  });

  it("PRINT_MENU_ITEM_ID is unique (not the same as any vendor id)", () => {
    expect(PRINT_MENU_ITEM_ID).not.toBe(PRINTING_VENDOR_ID);
    expect(PRINT_MENU_ITEM_ID).not.toBe(SERVICES_VENDOR_ID);
  });
});
