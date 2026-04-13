import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/fr-config", () => ({
  getEnvironments: () => ([
    { name: "dev", label: "dev", color: "blue", envFile: "dev.env" },
    { name: "prod", label: "prod", color: "red", envFile: "prod.env" },
  ]),
  runDiffSummary: vi.fn(async () => ([
    { scope: "journeys", added: 2, modified: 5, removed: 1 },
  ])),
}));

import { GET } from "@/app/api/diff/route";

describe("/api/diff", () => {
  it("returns 400 when params missing", async () => {
    const res = await GET(new Request("http://localhost/api/diff"));
    expect(res.status).toBe(400);
  });

  it("returns diff summary for valid request", async () => {
    const res = await GET(new Request("http://localhost/api/diff?source=dev&target=prod&scopes=journeys"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual([{ scope: "journeys", added: 2, modified: 5, removed: 1 }]);
  });
});
