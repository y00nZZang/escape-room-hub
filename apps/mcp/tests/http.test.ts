import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it } from "vitest";

import { createMcpHttpRuntime, type McpHttpRuntime } from "../src/http-server.js";
import { MCP_TOOL_NAMES } from "../src/tool-contracts.js";

let client: Client | undefined;
let runtime: McpHttpRuntime | undefined;

afterEach(async () => {
  await client?.close();
  await runtime?.close();
  client = undefined;
  runtime = undefined;
});

describe("Streamable HTTP transport", () => {
  it("initializes and lists the shared tools", async () => {
    runtime = createMcpHttpRuntime();

    await new Promise<void>((resolve, reject) => {
      runtime?.server.once("error", reject);
      runtime?.server.listen(0, "127.0.0.1", resolve);
    });

    const address = runtime.server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected an internet socket address");
    }

    client = new Client(
      { name: "escape-room-hub-http-test", version: "0.0.0" },
      { versionNegotiation: { mode: "auto" } },
    );
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`)),
    );

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(MCP_TOOL_NAMES);
  });

  it("never returns local-only records over Streamable HTTP", async () => {
    runtime = createMcpHttpRuntime({
      themeRecords: [
        {
          id: "public-theme",
          venueId: "public-venue",
          name: "Public theme",
          distributionScope: "public",
          region: "Seoul",
          source: {
            providerId: "public-provider",
            officialUrl: "https://example.invalid/public",
            observedAt: "2026-08-11T00:00:00Z",
            expiresAt: "2026-08-11T00:30:00Z",
          },
        },
        {
          id: "local-theme",
          venueId: "local-venue",
          name: "Local theme",
          distributionScope: "local-only",
          region: "Seoul",
          source: {
            providerId: "local-provider",
            officialUrl: "https://example.invalid/local",
            observedAt: "2026-08-11T00:00:00Z",
            expiresAt: "2026-08-11T00:30:00Z",
          },
        },
      ],
    });

    await new Promise<void>((resolve, reject) => {
      runtime?.server.once("error", reject);
      runtime?.server.listen(0, "127.0.0.1", resolve);
    });

    const address = runtime.server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected an internet socket address");
    }

    client = new Client(
      { name: "escape-room-hub-http-policy-test", version: "0.0.0" },
      { versionNegotiation: { mode: "auto" } },
    );
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`)),
    );

    const result = await client.callTool({
      arguments: {},
      name: "search_themes",
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({
      themes: [
        {
          id: "public-theme",
          venueId: "public-venue",
          name: "Public theme",
          region: "Seoul",
          source: {
            providerId: "public-provider",
            officialUrl: "https://example.invalid/public",
            observedAt: "2026-08-11T00:00:00Z",
            expiresAt: "2026-08-11T00:30:00Z",
          },
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("local-theme");
  });
});
