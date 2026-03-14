import {
  encodeResultForShare,
  decodeResultFromShare,
  getTwitterShareUrl
} from "../share";

describe("share", () => {
  describe("encodeResultForShare / decodeResultFromShare", () => {
    it("encodes and decodes ASCII content", () => {
      const toolSlug = "tiktok-caption-generator";
      const items = ["Caption 1", "Caption 2"];
      const encoded = encodeResultForShare(toolSlug, items);
      expect(encoded).toBeTruthy();
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");

      const decoded = decodeResultFromShare(encoded);
      expect(decoded).toEqual({ toolSlug, items });
    });

    it("handles Unicode and emoji", () => {
      const toolSlug = "tiktok-caption-generator";
      const items = ["You need to see this 👇", "Nobody is talking about this…"];
      const encoded = encodeResultForShare(toolSlug, items);
      expect(encoded).toBeTruthy();

      const decoded = decodeResultFromShare(encoded);
      expect(decoded).toEqual({ toolSlug, items });
      expect(decoded?.items[0]).toContain("👇");
    });

    it("returns null for invalid encoded string", () => {
      expect(decodeResultFromShare("invalid!!!")).toBeNull();
      expect(decodeResultFromShare("")).toBeNull();
    });
  });

  describe("getTwitterShareUrl", () => {
    it("includes text and url in params", () => {
      const url = getTwitterShareUrl("Check this out", "https://example.com/result/abc");
      expect(url).toContain("twitter.com/intent/tweet");
      expect(url).toContain("text=Check+this+out");
      expect(url).toContain("url=https");
    });

    it("truncates text to 200 chars", () => {
      const long = "a".repeat(300);
      const url = getTwitterShareUrl(long);
      expect(url).toContain("text=");
      expect(url.split("text=")[1]?.length).toBeLessThanOrEqual(250);
    });
  });
});
