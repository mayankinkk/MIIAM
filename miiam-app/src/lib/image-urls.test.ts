import { describe, expect, it } from "vitest";
import { canOptimizeImage } from "@/lib/image-urls";

describe("canOptimizeImage", () => {
  it("allows local paths", () => {
    expect(canOptimizeImage("/images/hero.png")).toBe(true);
  });

  it("rejects empty and malformed srcs", () => {
    expect(canOptimizeImage("")).toBe(false);
    expect(canOptimizeImage("just-a-filename.png")).toBe(false);
    expect(canOptimizeImage("javascript:alert(1)")).toBe(false);
  });

  it("allows configured https hosts", () => {
    expect(canOptimizeImage("https://images.unsplash.com/photo-1.jpg?w=400")).toBe(true);
    expect(canOptimizeImage("https://ui-avatars.com/api/Ada")).toBe(true);
    expect(canOptimizeImage("https://abc.supabase.co/storage/v1/object/public/img.png")).toBe(true);
    expect(canOptimizeImage("https://tile.openstreetmap.org/1/2/3.png")).toBe(true);
  });

  it("rejects hosts outside remotePatterns", () => {
    expect(canOptimizeImage("https://chatgpt.com/backend-api/estuary/content?id=file_1")).toBe(
      false
    );
    expect(canOptimizeImage("https://evil.com/x.png")).toBe(false);
    expect(canOptimizeImage("https://notsupabase.co/img.png")).toBe(false);
    expect(canOptimizeImage("https://evil.images.unsplash.com/x.png")).toBe(false);
    expect(canOptimizeImage("https://en.wikipedia.org/wiki/map.png")).toBe(false);
  });

  it("rejects non-https remote urls", () => {
    expect(canOptimizeImage("http://images.unsplash.com/photo-1.jpg")).toBe(false);
    expect(canOptimizeImage("data:image/png;base64,AAAA")).toBe(false);
  });
});
