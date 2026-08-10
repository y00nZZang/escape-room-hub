import { ProviderManifestSchema } from "@escape-room-hub/contracts";
import {
  AvailabilityBatchSchema,
  type AvailabilityRequest,
  CatalogBatchSchema,
  type EscapeRoomProvider,
} from "@escape-room-hub/provider-kit";

const FIXTURE_PROVIDER_ID = "fixture";
const FIXTURE_OFFICIAL_URL = "https://example.invalid/escape-room-hub-fixture";
const FRESHNESS_MILLISECONDS = 5 * 60 * 1_000;

export const fixtureProviderManifest = ProviderManifestSchema.parse({
  schemaVersion: "1",
  providerId: FIXTURE_PROVIDER_ID,
  displayName: "Escape Room Hub fixture",
  status: "public",
  distributionScope: "public",
  accessBasis: "explicit-permission",
  officialUrl: FIXTURE_OFFICIAL_URL,
  reviewedAt: "2026-08-11T00:00:00+09:00",
  policyRefs: [],
  allowedFields: [
    "venue.name",
    "venue.region",
    "theme.name",
    "theme.durationMinutes",
    "theme.minimumPlayers",
    "theme.maximumPlayers",
    "theme.minimumPriceKrw",
    "theme.priceUnit",
    "availability.startsAt",
    "availability.status",
  ],
  crawlIntervalSeconds: 300,
  providerType: "fixture",
  notes: "Synthetic records for tests and local development only.",
});

export interface FixtureProviderOptions {
  readonly clock?: () => Date;
}

export class FixtureProvider implements EscapeRoomProvider {
  readonly manifest = fixtureProviderManifest;
  readonly #clock: () => Date;

  constructor(options: FixtureProviderOptions = {}) {
    this.#clock = options.clock ?? (() => new Date());
  }

  async fetchCatalog(): Promise<ReturnType<typeof CatalogBatchSchema.parse>> {
    const source = this.#source();

    return CatalogBatchSchema.parse({
      providerId: FIXTURE_PROVIDER_ID,
      observedAt: source.observedAt,
      expiresAt: source.expiresAt,
      venues: [
        {
          id: "fixture:venue",
          name: "Fixture Escape Room",
          branchName: "Test Branch",
          region: "Seoul",
          source,
        },
      ],
      themes: [
        {
          id: "fixture:theme",
          venueId: "fixture:venue",
          name: "The Synthetic Mystery",
          durationMinutes: 60,
          minimumPlayers: 2,
          maximumPlayers: 5,
          minimumPriceKrw: 50_000,
          priceUnit: "per-team",
          bookingUrl: FIXTURE_OFFICIAL_URL,
          source,
        },
      ],
    });
  }

  async fetchAvailability(
    request: AvailabilityRequest,
  ): Promise<ReturnType<typeof AvailabilityBatchSchema.parse>> {
    const source = this.#source();

    return AvailabilityBatchSchema.parse({
      providerId: FIXTURE_PROVIDER_ID,
      observedAt: source.observedAt,
      expiresAt: source.expiresAt,
      slots: [
        {
          themeId: "fixture:theme",
          startsAt: `${request.dateFrom}T19:00:00+09:00`,
          endsAt: `${request.dateFrom}T20:00:00+09:00`,
          status: "available",
          source,
        },
      ],
    });
  }

  #source() {
    const observedAtDate = this.#clock();
    return {
      providerId: FIXTURE_PROVIDER_ID,
      officialUrl: FIXTURE_OFFICIAL_URL,
      observedAt: observedAtDate.toISOString(),
      expiresAt: new Date(observedAtDate.getTime() + FRESHNESS_MILLISECONDS).toISOString(),
    };
  }
}

export function createFixtureProvider(options?: FixtureProviderOptions): FixtureProvider {
  return new FixtureProvider(options);
}

export const fixtureProvider = createFixtureProvider();
