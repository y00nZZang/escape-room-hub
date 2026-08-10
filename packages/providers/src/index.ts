import type { EscapeRoomProvider } from "@escape-room-hub/provider-kit";
import { naverBookingProvider } from "./experimental/naver-booking.js";
import { fixtureProvider } from "./fixture.js";

export {
  naverBookingProvider,
  naverBookingProviderManifest,
} from "./experimental/naver-booking.js";
export type { FixtureProviderOptions } from "./fixture.js";
export {
  createFixtureProvider,
  FixtureProvider,
  fixtureProvider,
  fixtureProviderManifest,
} from "./fixture.js";

/** Providers eligible for ordinary worker execution. */
export const enabledProviders: readonly EscapeRoomProvider[] = [fixtureProvider];

/** Explicitly excluded from ordinary worker execution. */
export const experimentalProviders: readonly EscapeRoomProvider[] = [naverBookingProvider];
