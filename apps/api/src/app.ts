import { filterVisibleByScope, parseDataProfile } from "@escape-room-hub/config";
import type { ProviderManifest } from "@escape-room-hub/contracts";
import Fastify, { type FastifyInstance, type RouteHandlerMethod } from "fastify";

export const NOT_CONFIGURED_ERROR = {
  error: {
    code: "NOT_CONFIGURED",
    message: "No approved public data provider is configured.",
  },
} as const;

const readRouteSchema = {
  response: {
    503: {
      type: "object",
      additionalProperties: false,
      required: ["error"],
      properties: {
        error: {
          type: "object",
          additionalProperties: false,
          required: ["code", "message"],
          properties: {
            code: { const: "NOT_CONFIGURED", type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
  },
} as const;

const sourceRefJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["providerId", "officialUrl", "observedAt", "expiresAt"],
  properties: {
    providerId: { type: "string" },
    officialUrl: { type: "string", format: "uri" },
    observedAt: { type: "string", format: "date-time" },
    expiresAt: { type: "string", format: "date-time" },
  },
} as const;

const themeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "venueId", "name", "source"],
  properties: {
    id: { type: "string" },
    venueId: { type: "string" },
    name: { type: "string" },
    durationMinutes: { type: "integer", minimum: 1 },
    minimumPlayers: { type: "integer", minimum: 1 },
    maximumPlayers: { type: "integer", minimum: 1 },
    minimumPriceKrw: { type: "integer", minimum: 0 },
    priceUnit: { type: "string", enum: ["per-team", "per-person"] },
    bookingUrl: { type: "string", format: "uri" },
    source: sourceRefJsonSchema,
  },
} as const;

const availabilitySlotJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["themeId", "startsAt", "status", "source"],
  properties: {
    themeId: { type: "string" },
    startsAt: { type: "string", format: "date-time" },
    endsAt: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["available", "unavailable", "unknown"] },
    source: sourceRefJsonSchema,
  },
} as const;

const themesRouteSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      area: { type: "string", minLength: 1 },
      query: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["themes"],
      properties: {
        themes: { type: "array", items: themeJsonSchema },
      },
    },
    ...readRouteSchema.response,
  },
} as const;

const availabilityRouteSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    required: ["themeId", "date"],
    properties: {
      themeId: { type: "string", minLength: 1 },
      date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    },
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["slots"],
      properties: {
        slots: { type: "array", items: availabilitySlotJsonSchema },
      },
    },
    ...readRouteSchema.response,
  },
} as const;

const sourcesRouteSchema = {
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["sources"],
      properties: {
        sources: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["providerId", "displayName", "officialUrl"],
            properties: {
              providerId: { type: "string" },
              displayName: { type: "string" },
              officialUrl: { type: "string" },
            },
          },
        },
      },
    },
    ...readRouteSchema.response,
  },
} as const;

export interface BuildApiOptions {
  dataProfile?: unknown;
  logger?: boolean;
  sourceManifests?: readonly ProviderManifest[];
}

function registerReadContracts(
  app: FastifyInstance,
  options: Pick<BuildApiOptions, "dataProfile" | "sourceManifests">,
) {
  const notConfigured: RouteHandlerMethod = async (_request, reply) => {
    reply.code(503);
    return NOT_CONFIGURED_ERROR;
  };

  app.get("/v1/themes", { schema: themesRouteSchema }, notConfigured);
  app.get("/v1/availability", { schema: availabilityRouteSchema }, notConfigured);
  app.get("/v1/sources", { schema: sourcesRouteSchema }, async (_request, reply) => {
    if (options.sourceManifests === undefined) {
      reply.code(503);
      return NOT_CONFIGURED_ERROR;
    }

    const sources = filterVisibleByScope(options.sourceManifests, {
      profile: parseDataProfile(options.dataProfile),
      surface: "public-api",
    })
      .filter((manifest) => manifest.status === "public")
      .map(({ displayName, officialUrl, providerId }) => ({
        displayName,
        officialUrl,
        providerId,
      }));

    return { sources };
  });
}

export function buildApi(options: BuildApiOptions = {}) {
  const dataProfile = parseDataProfile(options.dataProfile);
  const app = Fastify({ logger: options.logger ?? false });

  app.get("/health", async () => ({
    dataProfile,
    dataSurface: "public-api" as const,
    service: "api" as const,
    status: "ok" as const,
  }));

  registerReadContracts(app, options);

  return app;
}
