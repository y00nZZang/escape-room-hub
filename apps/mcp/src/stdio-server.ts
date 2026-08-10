import { type StdioServerHandle, serveStdio } from "@modelcontextprotocol/server/stdio";

import { logMcpError } from "./logging.js";
import { createEscapeRoomMcpServer } from "./server.js";

export function startStdioServer(): StdioServerHandle {
  return serveStdio(() => createEscapeRoomMcpServer({ surface: "mcp-stdio" }), {
    legacy: "serve",
    onerror: logMcpError,
  });
}
