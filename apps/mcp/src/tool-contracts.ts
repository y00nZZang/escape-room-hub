import * as z from "zod/v4";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO calendar date in YYYY-MM-DD format");

const limitSchema = z.number().int().min(1).max(100).default(20);

export const searchThemesInputSchema = z.object({
  area: z.string().trim().min(1).optional(),
  limit: limitSchema,
  query: z.string().trim().min(1).optional(),
});

export const findAvailableThemesInputSchema = z.object({
  area: z.string().trim().min(1).optional(),
  date: dateSchema,
  limit: limitSchema,
  partySize: z.number().int().min(1).max(20).optional(),
});

export const getAvailabilityInputSchema = z.object({
  date: dateSchema,
  themeId: z.string().trim().min(1),
});

export const getBookingLinkInputSchema = z.object({
  themeId: z.string().trim().min(1),
});

export const MCP_TOOL_NAMES = [
  "search_themes",
  "find_available_themes",
  "get_availability",
  "get_booking_link",
] as const;
