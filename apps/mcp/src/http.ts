import { pathToFileURL } from "node:url";

import { createMcpHttpRuntime } from "./http-server.js";
import { logMcpError } from "./logging.js";

function parsePort(value: string | undefined) {
  const port = Number(value ?? "4200");

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("MCP_HTTP_PORT must be an integer between 1 and 65535");
  }

  return port;
}

export async function startMcpHttpServer() {
  const host = process.env.MCP_HTTP_HOST ?? "127.0.0.1";

  if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
    throw new Error("The scaffold MCP HTTP server may bind only to a loopback host");
  }

  const runtime = createMcpHttpRuntime();

  await new Promise<void>((resolve, reject) => {
    runtime.server.once("error", reject);
    runtime.server.listen(parsePort(process.env.MCP_HTTP_PORT), host, () => {
      runtime.server.off("error", reject);
      resolve();
    });
  });

  return runtime;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  startMcpHttpServer().catch((error: unknown) => {
    logMcpError(error);
    process.exitCode = 1;
  });
}
