import { describe, expect, it } from "vitest";
import { validateLeague } from "./lib";
describe("league validation", () => {
  it("accepts valid boundary sizes", () => {
    expect(validateLeague("My League", 4)).toBeNull();
    expect(validateLeague("My League", 20)).toBeNull();
  });
  it("rejects empty, whitespace, short, and oversized names", () => {
    for (const name of ["", "   ", "ab", "a".repeat(61)])
      expect(validateLeague(name, 12)).toBeTruthy();
  });
  it("rejects invalid sizes", () => {
    for (const teams of [3, 21, 4.5, NaN])
      expect(validateLeague("My League", teams)).toBeTruthy();
  });
});
