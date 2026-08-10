import { afterEach, describe, expect, it, vi } from "vitest";

import { bootstrapWorker } from "../src/worker.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("worker bootstrap", () => {
  it("starts idle with no provider or network activity", async () => {
    const fetchSpy = vi.fn<typeof fetch>();
    globalThis.fetch = fetchSpy;

    await expect(bootstrapWorker({ dataProfile: "public-safe" })).resolves.toEqual({
      dataProfile: "public-safe",
      networkRequestsMade: 0,
      registeredProviderIds: [],
      status: "idle",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("refuses provider registration during the scaffold milestone", async () => {
    const provider = {} as Parameters<typeof bootstrapWorker>[0] extends {
      providers?: readonly (infer T)[];
    }
      ? T
      : never;

    await expect(bootstrapWorker({ providers: [provider] })).rejects.toThrow(
      "Live provider registration is disabled",
    );
  });
});
