# API Integration — Direct Browser vs Cloud-based (BFF)

Comparison of two ways an EDS block can fetch data, demonstrated by the
`api-demo` block using the free open.er-api exchange-rate endpoint.

- **Direct:** the browser calls the third-party API straight from block JS.
- **BFF:** the browser calls an Adobe App Builder web action, which calls the
  API server-side and returns a trimmed payload.

## Trade-offs

| Dimension | Direct (client-side) | BFF (App Builder, server-side) |
|---|---|---|
| **Secrets / API keys** | Exposed — anything in JS is public | Hidden on the server; never shipped to the browser |
| **Sensitive data** | Unsafe for customer/PII/auth data | Safe — server controls what is returned |
| **CORS** | Depends on the third party allowing it | You set the headers; always works |
| **Aggregation** | One API per call; multiple round-trips | Combine many sources into one response |
| **Response shaping** | Trim client-side (ships full payload first) | Trim server-side; browser gets only what it needs |
| **Caching / rate limits** | Limited to browser cache | Central caching, retries, throttling |
| **Latency** | One hop (browser → API) | Two hops (browser → action → API) |
| **Ops / cost** | None | Requires an App Builder namespace + deploy |
| **Compliance / audit** | Hard to control/log | Single trusted egress point, loggable |

## Measured response times

open.er-api payload: ~2.97 KB.

| Approach | Run 1 | Run 2 | Run 3 | Notes |
|---|---|---|---|---|
| **Direct** | 49 ms | 31 ms | 24 ms | Browser → API, single hop (measured via curl) |
| **BFF** | _pending deploy_ | | | Browser → App Builder action → API; expect Direct + one hop. Fill in from the block's timer after `aio app deploy`. |

> The block shows a live `Response time: N ms` per panel — record those numbers
> here once the BFF action is deployed for an apples-to-apples comparison in the
> browser.

## Recommendation

> Use **Direct** only for public, no-auth, non-sensitive data; use **BFF** for
> anything requiring a key, aggregation, or response shaping.

For a bank site, that means **BFF by default** — card offers, eligibility,
rates behind auth, and any keyed/partner integration must go server-side.
Direct is acceptable only for genuinely public, keyless widgets (e.g. a public
FX or branch-locator feed), and even then a thin BFF adds caching and resilience.
