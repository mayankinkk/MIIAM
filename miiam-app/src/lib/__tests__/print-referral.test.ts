import { describe, it, expect, beforeEach } from "vitest";
import {
  generateReferralCode,
  applyReferralCode,
  markReferralRewarded,
  totalEarnedPages,
  pendingRewardsCount,
  buildReferralLink,
} from "../print-referral";

describe("print-referral", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates a code with the email prefix", () => {
    const code = generateReferralCode("priya@example.com");
    expect(code).toMatch(/^PRIY[A-Z0-9]{4}$/);
  });

  it("generates a code without a valid prefix", () => {
    const code = generateReferralCode("----");
    expect(code).toMatch(/^PRT[A-Z0-9]{4}$/);
  });

  it("stores referrals and reports pending count", () => {
    applyReferralCode("ABCD1234", "friend1@x.com");
    applyReferralCode("XYZ9", "friend2@x.com");
    expect(pendingRewardsCount()).toBe(2);
    expect(totalEarnedPages()).toBe(0);
  });

  it("marks referral rewarded and accumulates earned pages", () => {
    applyReferralCode("A1", "a@x.com");
    applyReferralCode("B2", "b@x.com");
    markReferralRewarded("A1");
    markReferralRewarded("B2");
    expect(pendingRewardsCount()).toBe(0);
    expect(totalEarnedPages()).toBe(10);
  });

  it("uppercases and trims referral codes", () => {
    const r = applyReferralCode("  ab12  ", "z@x.com");
    expect(r.code).toBe("AB12");
  });

  it("builds a referral link with code", () => {
    const link = buildReferralLink("ABCD1234");
    expect(link).toMatch(/[?&]ref=ABCD1234$/);
  });
});
