import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { listSnapshotTypes, readRecord, listRecords } from "./snapshot-fs";

let tmpDir: string;
const ENV = "test-env";

function writeRecord(type: string, id: string, body: Record<string, unknown>) {
  const dir = path.join(tmpDir, ENV, "managed-data", type);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(body));
}

function writeManifest(type: string, count: number, pulledAt = 1700000000000) {
  const dir = path.join(tmpDir, ENV, "managed-data", type);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "_manifest.json"),
    JSON.stringify({ type, pulledAt, count, jobId: "j1" }),
  );
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "data-tab-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("listSnapshotTypes", () => {
  it("returns empty list when no snapshot directory exists", () => {
    expect(listSnapshotTypes(tmpDir, ENV)).toEqual([]);
  });

  it("lists types that have a manifest", () => {
    writeManifest("alpha_user", 3, 1700000000000);
    writeManifest("alpha_role", 2, 1700000001000);
    const out = listSnapshotTypes(tmpDir, ENV);
    expect(out).toEqual([
      { name: "alpha_role", count: 2, pulledAt: 1700000001000 },
      { name: "alpha_user", count: 3, pulledAt: 1700000000000 },
    ].sort((a, b) => a.name.localeCompare(b.name)));
  });

  it("skips directories without a manifest", () => {
    writeManifest("alpha_user", 1);
    fs.mkdirSync(path.join(tmpDir, ENV, "managed-data", "half_pulled"), { recursive: true });
    const out = listSnapshotTypes(tmpDir, ENV);
    expect(out.map((t) => t.name)).toEqual(["alpha_user"]);
  });
});

describe("readRecord", () => {
  it("reads a single record by id", () => {
    writeRecord("alpha_user", "u1", { _id: "u1", userName: "alice" });
    expect(readRecord(tmpDir, ENV, "alpha_user", "u1")).toEqual({
      _id: "u1",
      userName: "alice",
    });
  });

  it("returns null for missing record", () => {
    expect(readRecord(tmpDir, ENV, "alpha_user", "missing")).toBeNull();
  });
});

describe("listRecords", () => {
  beforeEach(() => {
    writeManifest("alpha_user", 3);
    writeRecord("alpha_user", "u1", { _id: "u1", userName: "alice",   mail: "alice@x.co" });
    writeRecord("alpha_user", "u2", { _id: "u2", userName: "bob",     mail: "bob@x.co" });
    writeRecord("alpha_user", "u3", { _id: "u3", userName: "charlie", mail: "alice@y.co" });
  });

  it("returns all records paginated by id order", () => {
    const page = listRecords(tmpDir, ENV, "alpha_user", {
      q: "",
      page: 1,
      limit: 10,
      display: { title: "userName", subtitle: "mail", searchFields: ["userName", "mail"] },
    });
    expect(page.total).toBe(3);
    expect(page.records.map((r) => r.id)).toEqual(["u1", "u2", "u3"]);
    expect(page.records[0]).toEqual({ id: "u1", title: "alice", subtitle: "alice@x.co" });
  });

  it("server-side substring search across searchFields", () => {
    const page = listRecords(tmpDir, ENV, "alpha_user", {
      q: "alice",
      page: 1,
      limit: 10,
      display: { title: "userName", subtitle: "mail", searchFields: ["userName", "mail"] },
    });
    expect(page.total).toBe(2);
    expect(page.records.map((r) => r.id).sort()).toEqual(["u1", "u3"]);
  });

  it("paginates with limit and page", () => {
    const first = listRecords(tmpDir, ENV, "alpha_user", {
      q: "",
      page: 1,
      limit: 2,
      display: { title: "userName", searchFields: ["userName"] },
    });
    expect(first.records.map((r) => r.id)).toEqual(["u1", "u2"]);

    const second = listRecords(tmpDir, ENV, "alpha_user", {
      q: "",
      page: 2,
      limit: 2,
      display: { title: "userName", searchFields: ["userName"] },
    });
    expect(second.records.map((r) => r.id)).toEqual(["u3"]);
  });

  it("handles missing fields gracefully", () => {
    writeRecord("alpha_user", "u4", { _id: "u4" }); // no userName
    const page = listRecords(tmpDir, ENV, "alpha_user", {
      q: "",
      page: 1,
      limit: 10,
      display: { title: "userName", searchFields: ["userName"] },
    });
    const u4 = page.records.find((r) => r.id === "u4");
    expect(u4?.title).toBe("u4"); // falls back to id
  });
});
