import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { normalizeSlug } from "@/server/validation/association";

describe("normalizeSlug", () => {
  test("lowercases and hyphenates spaces", () => {
    assert.equal(normalizeSlug("Lagos Alumni Association"), "lagos-alumni-association");
  });

  test("strips accents", () => {
    assert.equal(normalizeSlug("Ìbàdàn Ex-Students"), "ibadan-ex-students");
  });

  test("collapses non-alphanumeric runs into a single hyphen", () => {
    assert.equal(normalizeSlug("A & B  --  Club!!"), "a-b-club");
  });

  test("trims leading/trailing hyphens", () => {
    assert.equal(normalizeSlug("--edge case--"), "edge-case");
  });
});
