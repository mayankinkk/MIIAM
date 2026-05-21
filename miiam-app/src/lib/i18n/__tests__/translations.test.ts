import { describe, it, expect } from "vitest";
import en from "../en";
import hi from "../hi";

describe("i18n translations", () => {
  it("English translations are complete", () => {
    expect(en.common.appName).toBe("MIIAM");
    expect(en.common.home).toBe("Home");
    expect(en.nav.explore).toBe("Explore");
    expect(en.settings.language).toBe("Language");
  });

  it("Hindi translations exist for all English keys", () => {
    const keys = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === "object" ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : `${prefix}${k}`
      );

    const enKeys = new Set(keys(en));
    const hiKeys = new Set(keys(hi));

    for (const key of enKeys) {
      expect(hiKeys.has(key)).toBe(true);
    }

    expect(hi.common.home).toBe("होम");
    expect(hi.nav.explore).toBe("एक्सप्लोर");
    expect(hi.settings.language).toBe("भाषा");
  });
});
