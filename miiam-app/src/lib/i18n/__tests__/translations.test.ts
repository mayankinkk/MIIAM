import { describe, it, expect } from "vitest";
import en from "../en";
import hi from "../hi";
import as from "../as";

describe("i18n translations", () => {
  it("English translations are complete", () => {
    expect(en.common.appName).toBe("MIIAM");
    expect(en.common.home).toBe("Home");
    expect(en.nav.explore).toBe("Explore");
    expect(en.settings.language).toBe("Language");
    expect(en.print.heroTitle).toBe("Print Store");
    expect(en.print.testimonials.length).toBe(3);
  });

  it("Hindi translations exist for all English keys", () => {
    const keys = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === "object" && !Array.isArray(v)
          ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
          : `${prefix}${k}`
      );

    const enKeys = new Set(keys(en));
    const hiKeys = new Set(keys(hi));

    for (const key of enKeys) {
      expect(hiKeys.has(key), `Hindi missing key: ${key}`).toBe(true);
    }

    expect(hi.common.home).toBe("होम");
    expect(hi.nav.explore).toBe("एक्सप्लोर");
    expect(hi.settings.language).toBe("भाषा");
    expect(hi.print.heroTitle).toBe("प्रिंट स्टोर");
    expect(hi.print.testimonials.length).toBe(3);
  });

  it("Assamese translations exist for all English keys", () => {
    const keys = (obj: Record<string, unknown>, prefix = ""): string[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === "object" && !Array.isArray(v)
          ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
          : `${prefix}${k}`
      );

    const enKeys = new Set(keys(en));
    const asKeys = new Set(keys(as));

    for (const key of enKeys) {
      expect(asKeys.has(key), `Assamese missing key: ${key}`).toBe(true);
    }

    expect(as.common.home).toBe("হোম");
    expect(as.nav.explore).toBe("অন্বেষণ");
    expect(as.settings.language).toBe("ভাষা");
    expect(as.print.heroTitle).toBe("প্ৰিণ্ট ষ্ট'ৰ");
    expect(as.print.testimonials.length).toBe(3);
  });
});
