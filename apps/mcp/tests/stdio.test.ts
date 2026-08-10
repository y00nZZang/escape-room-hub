import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterEach, describe, expect, it } from "vitest";

import { MCP_TOOL_NAMES } from "../src/tool-contracts.js";

let client: Client | undefined;

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe("stdio transport", () => {
  it("initializes without writing diagnostics to stdout and lists the shared tools", async () => {
    const entrypoint = fileURLToPath(new URL("../src/stdio.ts", import.meta.url));
    const transport = new StdioClientTransport({
      args: ["--import", "tsx", entrypoint],
      command: process.execPath,
      cwd: fileURLToPath(new URL("..", import.meta.url)),
      stderr: "pipe",
    });
    client = new Client({ name: "escape-room-hub-stdio-test", version: "0.0.0" });
    await client.connect(transport);

    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(MCP_TOOL_NAMES);
    // A successful exchange also proves stdout contained only valid MCP frames. Diagnostics are
    // allowed on stderr; Node or the TypeScript loader may write their own warnings there.
  }, 20_000);
});
