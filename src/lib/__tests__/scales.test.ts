import { describe, it, expect } from "vitest";
import {
  bucket6,
  bucketTone,
  confidenceBadge,
  confidenceLabel,
  confidenceLabels,
  understandingBadge,
  understandingLabel,
  understandingLabels,
} from "@/lib/scales";

/**
 * These tests mirror the inspiration dashboard's scoreMap behaviour exactly
 * (reference/educonnect_dashboard_v4.html:388). If someone changes the bucket
 * ranges here, the teacher compose UI and the parent read UI will drift out
 * of sync — keep them tied to both label arrays.
 */

describe("bucket6", () => {
  it("maps 1-2 to bucket 0 (Struggling / Withdrawn)", () => {
    expect(bucket6(1)).toBe(0);
    expect(bucket6(2)).toBe(0);
  });

  it("maps 3-4 to bucket 1 (Emerging / Hesitant)", () => {
    expect(bucket6(3)).toBe(1);
    expect(bucket6(4)).toBe(1);
  });

  it("maps 5-6 to bucket 2 (Developing)", () => {
    expect(bucket6(5)).toBe(2);
    expect(bucket6(6)).toBe(2);
  });

  it("maps 7-8 to bucket 3 (Secure / Assured)", () => {
    expect(bucket6(7)).toBe(3);
    expect(bucket6(8)).toBe(3);
  });

  it("maps 9 to bucket 4 (Proficient / Confident) — not a range", () => {
    expect(bucket6(9)).toBe(4);
  });

  it("maps 10 to bucket 5 (Mastery / Exceptional)", () => {
    expect(bucket6(10)).toBe(5);
  });

  it("clamps out-of-range values", () => {
    expect(bucket6(0)).toBe(0);
    expect(bucket6(-5)).toBe(0);
    expect(bucket6(15)).toBe(5);
    expect(bucket6(100)).toBe(5);
  });

  it("rounds fractional input before bucketing", () => {
    expect(bucket6(4.4)).toBe(1);
    expect(bucket6(4.6)).toBe(2);
  });

  it("returns bucket 0 for non-finite input", () => {
    expect(bucket6(NaN)).toBe(0);
    expect(bucket6(Infinity)).toBe(0);
  });
});

describe("label helpers", () => {
  it("returns the matching understanding label for each bucket", () => {
    for (let i = 0 as 0 | 1 | 2 | 3 | 4 | 5; i < understandingLabels.length; i++) {
      const representativeScore = [1, 3, 5, 7, 9, 10][i];
      expect(understandingLabel(representativeScore)).toBe(understandingLabels[i]);
    }
  });

  it("returns the matching confidence label for each bucket", () => {
    for (let i = 0 as 0 | 1 | 2 | 3 | 4 | 5; i < confidenceLabels.length; i++) {
      const representativeScore = [1, 3, 5, 7, 9, 10][i];
      expect(confidenceLabel(representativeScore)).toBe(confidenceLabels[i]);
    }
  });
});

describe("bucketTone", () => {
  it("buckets 0-1 are gray (struggling / emerging)", () => {
    expect(bucketTone(0)).toBe("gray");
    expect(bucketTone(1)).toBe("gray");
  });

  it("buckets 2-3 are amber (developing / secure)", () => {
    expect(bucketTone(2)).toBe("amber");
    expect(bucketTone(3)).toBe("amber");
  });

  it("buckets 4-5 are green (proficient+)", () => {
    expect(bucketTone(4)).toBe("green");
    expect(bucketTone(5)).toBe("green");
  });
});

describe("badge helpers", () => {
  it("understandingBadge(8) returns Secure / amber / bucket 3", () => {
    expect(understandingBadge(8)).toEqual({
      label: "Secure",
      tone: "amber",
      bucket: 3,
    });
  });

  it("confidenceBadge(9) returns Confident / green / bucket 4", () => {
    expect(confidenceBadge(9)).toEqual({
      label: "Confident",
      tone: "green",
      bucket: 4,
    });
  });

  it("understandingBadge(10) returns Mastery / green / bucket 5", () => {
    expect(understandingBadge(10)).toEqual({
      label: "Mastery",
      tone: "green",
      bucket: 5,
    });
  });

  it("confidenceBadge(2) returns Withdrawn / gray / bucket 0", () => {
    expect(confidenceBadge(2)).toEqual({
      label: "Withdrawn",
      tone: "gray",
      bucket: 0,
    });
  });
});
