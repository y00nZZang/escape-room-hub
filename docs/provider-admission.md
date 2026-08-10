# Provider admission

A provider starts in `hold` and may become active only after the following metadata is reviewed:

1. Official source owner and URL
2. Access basis and written permission when available
3. Terms and robots URLs with review date
4. Exact allowlisted fields
5. Minimum request interval and cache TTL
6. Distribution scope (`public` or `local-only`)
7. Operator contact and takedown path

Provider implementations accept only registered source identifiers. User-supplied arbitrary URLs,
authentication, CAPTCHA handling, proxy/IP rotation, fingerprint spoofing, and retries after
`401`/`403`/`429` are prohibited.

The intended retained data is limited to venue/branch/theme identifiers, region, duration, optional
factual price/capacity values, slot status, observation/expiry timestamps, and the official URL. Raw
responses and booking-customer data are never persisted.
