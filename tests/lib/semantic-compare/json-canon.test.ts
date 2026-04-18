import { describe, it, expect } from "vitest";
import { sortKeys, stripFields, normalizeEsvEscapes } from "@/lib/semantic-compare/json-canon";

describe("json-canon", () => {
  it("sortKeys sorts object keys recursively", () => {
    const input = { b: 1, a: { d: 2, c: 3 } };
    const out = sortKeys(input) as Record<string, unknown>;
    expect(Object.keys(out)).toEqual(["a", "b"]);
    expect(Object.keys(out.a as object)).toEqual(["c", "d"]);
  });

  it("sortKeys preserves arrays in order", () => {
    const input = [3, 1, 2];
    expect(sortKeys(input)).toEqual([3, 1, 2]);
  });

  it("stripFields removes matching keys at every depth", () => {
    const input = { _id: "abc", name: "x", nested: { _id: "y", z: 1 } };
    const out = stripFields(input, ["_id"]) as Record<string, unknown>;
    expect(out._id).toBeUndefined();
    expect((out.nested as Record<string, unknown>)._id).toBeUndefined();
    expect(out.name).toBe("x");
  });

  it("normalizeEsvEscapes treats \\${foo} and ${foo} equal", () => {
    expect(normalizeEsvEscapes("\\${foo}")).toBe("${foo}");
    expect(normalizeEsvEscapes("${foo}")).toBe("${foo}");
  });

  it("stripFields + sortKeys composes", () => {
    const input = { z: 1, _id: "x", a: { _rev: "1", b: 2 } };
    const out = sortKeys(stripFields(input, ["_id", "_rev"])) as Record<string, unknown>;
    expect(Object.keys(out)).toEqual(["a", "z"]);
    expect(Object.keys(out.a as object)).toEqual(["b"]);
  });
});
