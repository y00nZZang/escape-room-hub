# ADR 0001: Source policy and Naver boundary

- Status: accepted
- Date: 2026-08-11

## Context

The portfolio requires a public-safe hosted path and reserves a public namespace for a future local
Naver Booking experiment. Naver's current policy prohibits automated collection except where Naver
has explicitly approved it, an official API is used under its terms, or robots guidance permits the
requested path. The Naver Booking robots policy currently disallows crawling its paths.

References:

- <https://policy.naver.com/rules/disclaimer.html>
- <https://booking.naver.com/robots.txt>

## Decision

- The scaffold contains a disabled `experimental/naver-booking` adapter with zero network behavior.
- No Naver-derived data may enter Web, REST API, or Streamable HTTP MCP output.
- A future implementation must be a separate reviewed change, local-only, explicitly enabled, and
  must not authenticate, bypass CAPTCHA or rate limits, reverse-engineer private endpoints, or retry
  after access denial.
- These technical restrictions do not make automated collection authorized or legally safe.

## Consequences

The current milestone demonstrates the policy boundary without performing collection. A future
working adapter remains an explicit source-policy risk and requires renewed review before work begins.
