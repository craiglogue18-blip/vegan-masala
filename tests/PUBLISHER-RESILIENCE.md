# Public recipe storage resilience

The catalogue and recipe detail/metadata pages share a Next Data Cache snapshot of published revisions. A refresh uses one Redis MGET for the sorted recipe slugs, rather than a GET per recipe per visitor. Only published keys are read; drafts and recipe files are unchanged.

- Successful snapshots refresh after 60 seconds. Metadata and page rendering share a request-level snapshot too.
- Successful publishing calls revalidateTag with the `max` profile. The next visitor can receive the prior snapshot while a background refresh runs. Refreshes are demand-driven, so this is not an immediate read-your-write guarantee. The publisher's existing revision verification remains honest and can be retried after refresh.
- Provider errors, invalid batch responses and a two-second timeout throw inside the cached loader. Failed revalidation retains the last successful snapshot. Cold-cache failures are caught outside the cache and use bundled recipes without publisherRevision; these fallbacks do not poison the cache.
- Malformed individual revisions are isolated to their source recipe. They do not remove recipes from the listing or prevent valid neighbours from appearing.
- Public/indexability filtering and ordering stay with the existing source catalogue. Overrides cannot add private/non-indexable recipes.
- Publishing, authentication, compare-and-swap conflicts, draft storage and revision verification retain their existing safeguards. If cache invalidation itself fails after a committed publish, publishing still succeeds; the 60-second refresh policy remains available.

Operational limits: an empty cache cannot preserve an earlier published version, so source content can appear during an outage. Cache availability is supplied by the deployment platform. A timeout bounds visitor waiting, not cancellation of the SDK request. Existing open browser tabs need a refresh to see newly published data. This change does not diagnose the original provider exception; authenticated runtime logs are still needed for that.

## Checks

```
node --test tests/publisher.test.cjs
npm run build
node tests/publisher-cache.integration.cjs
```

The integration test runs the production build against an ephemeral local Redis REST simulator. It never connects to real KV or changes recipe content. It checks batch reuse, publish invalidation, catalogue/detail agreement, retention of stale published content on failure, and cold-cache failure/recovery. Unit tests cover malformed records, deadlines, filtering/order, drafts/conflicts, authentication and strict production revision verification.
