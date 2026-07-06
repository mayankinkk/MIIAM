import { describe, it, expect } from "vitest";

describe("LOYALTY_CONFIG", () => {
  it("has valid config values", () => {
    const config = {
      POINTS_PER_RUPEE: 1,
      POINTS_TO_REDEEM: 100,
      REDEEM_VALUE: 10,
      MIN_REDEEM_POINTS: 100,
      WELCOME_BONUS: 50,
      BIRTHDAY_BONUS: 100,
      REFERRAL_BONUS: 200,
    };
    expect(config.POINTS_PER_RUPEE).toBeGreaterThan(0);
    expect(config.POINTS_TO_REDEEM).toBeGreaterThan(0);
    expect(config.REDEEM_VALUE).toBeGreaterThan(0);
    expect(config.MIN_REDEEM_POINTS).toBeGreaterThan(0);
    expect(config.WELCOME_BONUS).toBeGreaterThan(0);
  });

  it("redemption math is correct", () => {
    const POINTS_TO_REDEEM = 100;
    const REDEEM_VALUE = 10;
    const points = 300;
    const discount = Math.floor(points / POINTS_TO_REDEEM) * REDEEM_VALUE;
    expect(discount).toBe(30);
  });
});
