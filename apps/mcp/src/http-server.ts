import { createServer, type Server as NodeHttpServer } from "node:http";

import {
  localhostHostValidation,
  localhostOriginValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import { createMcpHandler, type McpHttpHandler } from "@modelcontextprotocol/server";

import { logMcpError } from "./logging.js";
import { createEscapeRoomMcpServer, type EscapeRoomMcpServerOptions } from "./server.js";

export interface McpHttpRuntime {
  close: () => Promise<void>;
  handler: McpHttpHandler;
  server: NodeHttpServer;
}

export function createMcpHttpRuntime(
  options: Pick<EscapeRoomMcpServerOptions, "themeRecords"> = {},
): McpHttpRuntime {
  const handler = createMcpHandler(
    () =>
      createEscapeRoomMcpServer({
        ...options,
        dataProfile: "public-safe",
        surface: "mcp-http",
      }),
    {
      legacy: "stateless",
      onerror: logMcpError,
      responseMode: "json",
    },
  );
  const handleMcpRequest = toNodeHandler(handler, { onerror: logMcpError });
  const validateHost = localhostHostValidation();
  const validateOrigin = localhostOriginValidation();

  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

    if (pathname === "/health" && request.method === "GET") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ dataSurface: "mcp-http", service: "mcp", status: "ok" }));
      return;
    }

    if (pathname !== "/mcp") {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found" } }));
      return;
    }

    if (!validateHost(request, response) || !validateOrigin(request, response)) {
      return;
    }

    try {
      // The SDK's structural Node request type uses a narrower optional `method` declaration than
      // Node's IncomingMessage when exactOptionalPropertyTypes is enabled.
      await handleMcpRequest(request as Parameters<typeof handleMcpRequest>[0], response);
    } catch (error: unknown) {
      logMcpError(error);

      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
        response.end(
          JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Internal error" } }),
        );
      }
    }
  });

  return {
    handler,
    server,
    async close() {
      await handler.close();

      if (!server.listening) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}
