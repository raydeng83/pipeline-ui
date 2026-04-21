import { describe, it, expect } from "vitest";
import { deriveDisplayFields, fallbackDisplayFields } from "./display-fields";

describe("deriveDisplayFields", () => {
  it("picks userName as title and mail as subtitle when present", () => {
    const schema = {
      schema: {
        properties: {
          userName: { type: "string", searchable: true },
          mail:     { type: "string", searchable: true },
          sn:       { type: "string", searchable: true },
        },
      },
    };
    expect(deriveDisplayFields(schema)).toEqual({
      title: "userName",
      subtitle: "mail",
      searchFields: ["userName", "mail", "sn"],
    });
  });

  it("falls back to name when userName is missing", () => {
    const schema = {
      schema: {
        properties: {
          name: { type: "string" },
          description: { type: "string" },
        },
      },
    };
    const out = deriveDisplayFields(schema);
    expect(out.title).toBe("name");
    expect(out.subtitle).toBe("description");
  });

  it("skips subtitle when same as title", () => {
    const schema = { schema: { properties: { name: { type: "string" } } } };
    const out = deriveDisplayFields(schema);
    expect(out.title).toBe("name");
    expect(out.subtitle).toBeUndefined();
  });

  it("falls back to _id when nothing standard is present", () => {
    const schema = { schema: { properties: { custom_field: { type: "string" } } } };
    expect(deriveDisplayFields(schema).title).toBe("_id");
  });

  it("restricts searchFields to scalar searchable properties", () => {
    const schema = {
      schema: {
        properties: {
          userName: { type: "string", searchable: true },
          members:  { type: "array",  searchable: true }, // not scalar → excluded
          age:      { type: "number", searchable: true },
          secret:   { type: "string", searchable: false }, // excluded
        },
      },
    };
    expect(deriveDisplayFields(schema).searchFields.sort()).toEqual(["age", "userName"]);
  });

  it("falls back to [title, subtitle] when no property is searchable", () => {
    const schema = {
      schema: {
        properties: {
          userName: { type: "string" },
          mail:     { type: "string" },
        },
      },
    };
    expect(deriveDisplayFields(schema).searchFields).toEqual(["userName", "mail"]);
  });
});

describe("fallbackDisplayFields", () => {
  it("uses _id and the first string field from a record", () => {
    const record = { _id: "abc", label: "Alice", count: 7 };
    expect(fallbackDisplayFields(record)).toEqual({
      title: "_id",
      subtitle: "label",
      searchFields: ["_id", "label"],
    });
  });

  it("returns just _id when no string fields exist", () => {
    const record = { _id: "abc", count: 7 };
    expect(fallbackDisplayFields(record)).toEqual({
      title: "_id",
      subtitle: undefined,
      searchFields: ["_id"],
    });
  });
});
