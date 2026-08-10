import { filterVisibleByScope, parseDataProfile } from "@escape-room-hub/config";
import type { DistributionScope, Theme } from "@escape-room-hub/contracts";
import { type CallToolResult, McpServer } from "@modelcontextprotocol/server";
import type { z } from "zod/v4";

import {
  findAvailableThemesInputSchema,
  getAvailabilityInputSchema,
  getBookingLinkInputSchema,
  searchThemesInputSchema,
} from "./tool-contracts.js";

const NOT_CONFIGURED = {
  code: "NOT_CONFIGURED",
  message: "No approved data provider is configured for this MCP surface.",
} as const;

const readOnlyAnnotations = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const;

function notConfiguredResult(): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(NOT_CONFIGURED) }],
    isError: true,
    structuredContent: NOT_CONFIGURED,
  };
}

export interface McpThemeRecord extends Theme {
  readonly distributionScope: DistributionScope;
  readonly region: string;
}

export interface EscapeRoomMcpServerOptions {
  readonly dataProfile?: unknown;
  readonly surface?: "mcp-http" | "mcp-stdio";
  readonly themeRecords?: readonly McpThemeRecord[];
}

export function createEscapeRoomMcpServer(options: EscapeRoomMcpServerOptions = {}) {
  const server = new McpServer({
    name: "escape-room-hub",
    version: "0.0.0",
  });

  const searchThemes = (input: z.infer<typeof searchThemesInputSchema>): CallToolResult => {
    if (options.themeRecords === undefined) {
      return notConfiguredResult();
    }

    const query = input.query?.toLocaleLowerCase("ko-KR");
    const themes = filterVisibleByScope(options.themeRecords, {
      profile: parseDataProfile(options.dataProfile),
      surface: options.surface ?? "mcp-http",
    })
      .filter((theme) => input.area === undefined || theme.region === input.area)
      .filter(
        (theme) => query === undefined || theme.name.toLocaleLowerCase("ko-KR").includes(query),
      )
      .slice(0, input.limit)
      .map(({ distributionScope: _distributionScope, ...theme }) => theme);
    const structuredContent = { themes };

    return {
      content: [{ type: "text", text: JSON.stringify(structuredContent) }],
      structuredContent,
    };
  };

  server.registerTool(
    "search_themes",
    {
      annotations: readOnlyAnnotations,
      description: "Search indexed escape-room themes without triggering a live crawl.",
      inputSchema: searchThemesInputSchema,
      title: "Search themes",
    },
    searchThemes,
  );

  server.registerTool(
    "find_available_themes",
    {
      annotations: readOnlyAnnotations,
      description: "Find indexed themes with stored availability for a date.",
      inputSchema: findAvailableThemesInputSchema,
      title: "Find available themes",
    },
    notConfiguredResult,
  );

  server.registerTool(
    "get_availability",
    {
      annotations: readOnlyAnnotations,
      description: "Read stored availability for one indexed theme and date.",
      inputSchema: getAvailabilityInputSchema,
      title: "Get availability",
    },
    notConfiguredResult,
  );

  server.registerTool(
    "get_booking_link",
    {
      annotations: readOnlyAnnotations,
      description: "Get the official booking page stored for an indexed theme.",
      inputSchema: getBookingLinkInputSchema,
      title: "Get official booking link",
    },
    notConfiguredResult,
  );

  return server;
}
