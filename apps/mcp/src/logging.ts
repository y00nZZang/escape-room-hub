function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/** stdout is reserved exclusively for MCP stdio JSON-RPC frames. */
export function logMcpError(error: unknown) {
  process.stderr.write(`[escape-room-hub:mcp] ${normalizeError(error)}\n`);
}
