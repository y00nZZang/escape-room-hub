import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { logMcpError } from "../src/logging.js";
import { createEscapeRoomMcpServer } from "../src/server.js";
import { MCP_TOOL_NAMES } from "../src/tool-contracts.js";

const closeCallbacks: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(closeCallbacks.splice(0).map((close) => close()));
  vi.restoreAllMocks();
});

describe("MCP tool surface", () => {
  it("lists the shared read-only tools and returns NOT_CONFIGURED", async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = createEscapeRoomMcpServer();
    const client = new Client({ name: "escape-room-hub-test", version: "0.0.0" });

    closeCallbacks.push(async () => {
      await client.close();
      await server.close();
    });

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(MCP_TOOL_NAMES);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);

    const result = await client.callTool({
      arguments: { query: "미스터리" },
      name: "search_themes",
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({
      code: "NOT_CONFIGURED",
      message: "No approved data provider is configured for this MCP surface.",
    });
  });

  it("routes diagnostics to stderr and never stdout", () => {
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((() => true) as typeof process.stderr.write);
    const stdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((() => true) as typeof process.stdout.write);

    logMcpError(new Error("diagnostic"));

    expect(stderr).toHaveBeenCalledWith("[escape-room-hub:mcp] diagnostic\n");
    expect(stdout).not.toHaveBeenCalled();
  });
});
