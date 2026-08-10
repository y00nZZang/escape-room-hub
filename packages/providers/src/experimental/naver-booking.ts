import { ProviderManifestSchema } from "@escape-room-hub/contracts";
import {
  type AvailabilityRequest,
  type EscapeRoomProvider,
  ProviderDisabledError,
} from "@escape-room-hub/provider-kit";

const DISABLED_REASON =
  "network collection is intentionally unimplemented pending an explicit permission and policy review";

export const naverBookingProviderManifest = ProviderManifestSchema.parse({
  schemaVersion: "1",
  providerId: "naver-booking",
  displayName: "Naver Booking (disabled experiment)",
  status: "hold",
  distributionScope: "local-only",
  accessBasis: "experimental-unapproved",
  officialUrl: "https://booking.naver.com/",
  reviewedAt: "2026-08-11T00:00:00+09:00",
  policyRefs: [
    "https://policy.naver.com/rules/disclaimer.html",
    "https://booking.naver.com/robots.txt",
  ],
  allowedFields: ["officialUrl"],
  crawlIntervalSeconds: 86_400,
  providerType: "naver-booking",
  robotsUrl: "https://booking.naver.com/robots.txt",
  termsUrl: "https://policy.naver.com/rules/disclaimer.html",
  notes: "No network implementation. Do not enable without a new policy and permission review.",
});

class DisabledNaverBookingProvider implements EscapeRoomProvider {
  readonly manifest = naverBookingProviderManifest;

  async fetchCatalog(): Promise<never> {
    throw new ProviderDisabledError(this.manifest.providerId, DISABLED_REASON);
  }

  async fetchAvailability(_request: AvailabilityRequest): Promise<never> {
    throw new ProviderDisabledError(this.manifest.providerId, DISABLED_REASON);
  }
}

export const naverBookingProvider = new DisabledNaverBookingProvider();
