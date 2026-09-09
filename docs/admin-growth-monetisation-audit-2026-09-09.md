# Vegan Masala admin growth and monetisation audit

Date: 9 September 2026

## Executive conclusion

The admin backend is already strong at content production and operational publishing, but it is not yet a complete growth analytics system. It can show search discovery, a small set of on-site conversions, affiliate clicks, selected social metrics, subscriber totals and partner transactions. It cannot yet connect the whole journey from acquisition source to landing page, meaningful engagement, return visit and revenue outcome.

The immediate commercial priority should be measurement before increasing publishing volume. The site currently has enough content and scheduled output to learn from, but several of the interactions needed to identify winning pages and placements are not captured.

## Current live position

The live Growth dashboard observed during the audit reported:

- 563 Google impressions and 3 clicks in the latest 28 days (0.5% CTR).
- 15 affiliate clicks, but no reported Awin transactions or commission.
- 38 dinner-plan page views, 1 form start, 0 recorded submissions and 0 confirmations.
- 25 posts published and 38 queued.
- 532 Instagram followers, 6 Facebook followers and 0 Pinterest followers.
- 19 active Kit subscribers.

These figures make the first growth opportunities clear: improve search-result click-through rate, repair/verify dinner-plan conversion measurement, learn which affiliate placements earn outbound clicks and sales, and measure whether social posts produce site sessions rather than only output volume.

## What is working well

- Production admin pages and APIs are protected by administrator authentication.
- Search Console reporting includes clicks, impressions, CTR, position, pages and queries.
- Affiliate links carry network, product, category, placement and page-path information.
- Awin transactions and commissions are read from the partner API.
- Amazon reports can be imported when no suitable live reporting API is available.
- Kit subscriber totals and recent subscriber growth are connected.
- Pinterest and YouTube provide daily analytics where permissions permit.
- The queue records publishing status and platform, with preflight and failure handling.
- Weekly social selection uses least-recently-used history plus seeded variation rather than alphabetical order.
- SEO health covers sitemap presence, metadata, structured data and a basic internal-linking check.
- The custom engagement store avoids collecting names, email addresses or full IP addresses.

## Critical findings

### 1. There is no complete site traffic source

Search Console counts only Google search activity. The custom Redis collector counts seven conversion-style events, not visits. Meta Pixel counts consented Meta page views but those figures are not imported into the Growth dashboard. There is no GA4, Matomo, Plausible or equivalent site-wide analytics connection in the application.

Consequences:

- Total users, sessions and page views are unknown.
- Direct, organic search, organic social, referral and returning traffic cannot be compared.
- Landing pages, exit pages, engagement time, device type and country are unavailable.
- Conversion rates by source, campaign, landing page and device cannot be calculated.
- The chart label “website actions” combines unlike events and is not a traffic line.

Recommendation: install one consent-aware first-party analytics layer and make it the canonical traffic source. GA4 is the practical choice if Google Ads/AdSense integration is important; a privacy-focused analytics product is preferable if simple, cookieless reporting is the priority. Do not run two competing canonical systems.

### 2. The custom event collector is too narrow and can be inflated

The public endpoint accepts only dinner-plan, affiliate and commerce events. It has no bot filtering, rate limiting, idempotency key or duplicate-event protection. Recipe views use a separate weekly counter, also without bot filtering.

Consequences:

- Automated traffic or repeated requests can inflate totals.
- A double click can become two affiliate clicks.
- Recipe popularity cannot be attributed to a source or campaign.
- The reported counts are useful directional signals, not audit-grade visitor analytics.

Recommendation: validate origin, add rate limiting and short-lived event deduplication, exclude known bots and previews, and attach a non-identifying session/event ID. Store daily aggregates and approximate unique sessions without retaining raw visitor identifiers.

### 3. High-value visitor actions are not recorded

Missing events include:

- Recipe save, unsave, share, print and jump-to-recipe.
- Ingredient-section and method-section visibility.
- 25%, 50%, 75% and 90% scroll milestones.
- Engaged visit (for example 30 seconds with the tab visible).
- Recipe search terms, filters used and zero-result searches.
- Related-recipe, related-guide and dinner-plan CTA clicks.
- Meal-planner start, preferences completed, plan generated, plan saved, recipe swapped, cooking mode started/completed and shopping list exported.
- Store product view and confirmed Payhip sale.
- Contact form success/failure and recipe issue reports.
- Ad viewability/revenue imported from AdSense.
- 404s, client errors, API failures and Core Web Vitals.

Recommendation: adopt a small, documented event taxonomy and instrument actions that lead to retention, email growth or revenue. Avoid tracking every click; capture events that support a decision.

### 4. Attribution is lost after the first dinner-plan page view

The dinner-plan page view records UTM source, campaign and placement, but the later start, submit, confirmation and download events do not carry that acquisition context. Attribution is not persisted across pages.

The confirmation counter can also undercount if another client-side process marks the signup complete first, while a direct visit to the confirmation URL can create a synthetic signup ID.

Recommendation: persist first-touch and last-touch attribution for the session, attach it to every funnel event, and verify confirmations server-side using Kit webhooks where possible. A confirmation page view should not be treated as proof of a subscriber without a pending signup or webhook match.

### 5. Affiliate reporting stops at outbound clicks for most placements

The link wrapper captures useful click dimensions, and Awin supplies network-level transactions. However, the dashboard does not reliably join a transaction back to the originating page, product, placement, campaign or creative. Amazon reporting is manual and can become stale. Payhip records outbound intent rather than completed sales.

Recommendation:

- Use unique click references/sub-IDs on every Awin link, containing a compact placement and content identifier.
- Map returned Awin click references into transaction reporting.
- Add Amazon report age warnings and a regular import reminder.
- Connect Payhip webhooks or sales exports for completed orders and refunds.
- Report EPC (earnings per click), conversion rate, revenue per 1,000 page views and commission by page/placement.
- Run placement experiments with stable variant IDs, not unlabelled design changes.

### 6. Social reporting measures output more completely than outcomes

The queue gives a good operational record of posted, queued and failed items. Pinterest and YouTube have daily metrics, while Meta currently supplies follower/content counts but not daily reach. TikTok reporting remains limited by permissions. Published post identifiers are not used to build a unified per-post performance table.

Recommendation: store the platform post ID and permanent URL for every successful publish, then collect 1-day, 7-day and 28-day results per post: reach, impressions, views, watch time, completion rate, saves, shares, comments, profile visits, follows and outbound clicks where available. Join those results to format, topic, recipe, hook, CTA and generation cost.

The useful question is not “how many posts went out?” but “which post format generated the lowest-cost engaged website visits, subscribers and affiliate revenue?”

### 7. The Growth dashboard is informative but not decision-led enough

The dashboard combines lines scaled to separate peaks, which is useful for direction but cannot show magnitude or causal relationships. It lacks source-to-conversion funnels, per-page denominators and revenue efficiency.

Add:

- Users, sessions, page views, engaged sessions and returning-user rate.
- Channel and campaign acquisition tables.
- Landing-page conversion table with page views, email conversions, affiliate CTR and revenue.
- Full dinner-plan funnel by source and landing page.
- Affiliate funnel: impressions/viewable placements → clicks → orders → approved commission.
- Social content leaderboard by website sessions and conversions.
- Revenue overview: AdSense, Amazon, Awin and direct products, with RPM/EPC.
- Automated data freshness and connection-health warnings.
- Comparisons for 7, 28 and 90 days, plus previous period and year-on-year when available.

### 8. SEO health checks structure, not enough commercial opportunity

The SEO dashboard validates repository coverage, but it does not prioritise pages using live opportunity data. It should combine Search Console data with page quality and monetisation.

Add opportunity groups:

- High impressions, position 4–20, low CTR: rewrite title/meta first.
- Position 8–30 with strong commercial intent: expand and strengthen internal links.
- Traffic winners with weak affiliate CTR: improve contextual placements.
- Affiliate-click winners with low search impressions: build supporting content and links.
- Cannibalising queries/pages, declining pages, orphan pages and broken internal links.
- Rich-result validation and schema errors, not only schema presence.

### 9. Performance warnings may suppress traffic and revenue

The strict content audit passed all 111 recipes but produced 94 warnings, predominantly hero source files exceeding 1 MB. Large hero assets can reduce mobile speed, search performance, ad viewability and affiliate engagement.

Recommendation: batch-convert oversized sources to modern responsive formats, enforce dimensions/file-size budgets at import time and expose Core Web Vitals by template in admin.

### 10. Engineering quality checks are not currently clean

The production build succeeds, but the repository-wide lint run reports 207 errors and 64 warnings. Many are type-safety debt in admin and social-generation code; others include hook dependency, accessibility and image warnings.

Recommendation: establish a clean changed-files lint gate immediately, then reduce the existing backlog by subsystem. Add tests for event validation, attribution persistence, queue deduplication, timezone scheduling, transaction parsing and campaign generation failure modes.

## Admin surface audit

| Surface | Current value | Main improvement |
|---|---|---|
| Admin hub | Central navigation and service status | Add one consolidated alert inbox and data-freshness status |
| Growth | Broad overview of connected sources | Add canonical traffic, funnels, attribution and revenue efficiency |
| SEO health | Good static repository checks | Rank live traffic/CTR/content opportunities and detect regressions |
| Recipe health | Useful content data repair | Add performance budgets, broken-link checks and schema validation |
| Import/pipeline | Powerful recipe workflow | Add validation gates, change preview, audit log and rollback status |
| Social generator | Extensive creative control | Record creative metadata and later performance against each asset |
| Campaign Studio | Useful preview/approval flow | Add conversion objective, variant ID and per-campaign results |
| Queue | Strong publishing operations | Add post-level analytics snapshots and outcome-based ranking |
| Automation | Useful scheduled production | Add spend/unit limits, failure alerts and quality sampling |
| Video library | Generates and queues assets | Add watch-time results, aspect/safe-zone QA and cost per asset |
| Social health | Connection and publishing diagnostics | Add token-expiry forecast and permission-level analytics checklist |

## Recommended implementation order

### Phase 1 — trustworthy measurement

1. Add canonical site analytics with consent handling.
2. Define and instrument the commercial event taxonomy.
3. Persist first/last-touch attribution through each session and funnel.
4. Protect custom tracking from duplicate and automated events.
5. Fix dinner-plan confirmation measurement and add Kit webhook verification.
6. Add data freshness indicators and tracking diagnostics.

### Phase 2 — revenue attribution

1. Add unique affiliate click references and join Awin transactions.
2. Connect direct-product completed sales.
3. Import AdSense revenue and page/ad-unit performance.
4. Build page, placement and partner EPC/RPM reporting.
5. Add controlled placement experiments.

### Phase 3 — traffic growth intelligence

1. Build live SEO opportunity scoring.
2. Add source/landing-page/content funnels.
3. Collect per-post social outcomes and website sessions.
4. Rank content ideas using search demand, engagement and revenue evidence.
5. Feed winning formats and topics back into the weekly planner.

### Phase 4 — reliability and performance

1. Reduce large hero assets and monitor Core Web Vitals.
2. Clear the lint/type backlog and add subsystem tests.
3. Add an admin audit log, error monitoring and automated alerts.
4. Add retention/back-up rules for analytics and queue data.

## Proposed event taxonomy

Keep events anonymous and decision-focused:

- Acquisition: `page_view`, `session_start`, `engaged_visit`.
- Content: `recipe_view`, `recipe_save`, `recipe_share`, `recipe_print`, `scroll_depth`, `site_search`.
- Navigation: `internal_cta_click`, `related_content_click`.
- Lead: `dinner_plan_view`, `dinner_plan_start`, `dinner_plan_submit`, `dinner_plan_confirmed`, `dinner_plan_download`.
- Planner: `planner_start`, `preferences_complete`, `plan_created`, `plan_saved`, `cook_started`, `cook_completed`, `shopping_exported`.
- Revenue intent: `affiliate_impression`, `affiliate_click`, `product_view`, `checkout_start`.
- Revenue outcome: `affiliate_order`, `affiliate_commission`, `product_purchase`, `refund`, `ad_revenue`.
- Quality: `client_error`, `api_failure`, `web_vital`.

Common dimensions should include date, page path, content type/slug, source, medium, campaign, placement, creative/variant, device class and country/region at an aggregate level. Do not store names, email addresses, full IP addresses or precise fingerprints in the growth analytics store.

## Definition of a complete commercial dashboard

The audit is complete when the dashboard can answer, with a visible freshness date:

1. How many people visited, from where, and which landing pages did they enter on?
2. Which pages and visitor sources generated saves, shares, subscribers and revenue?
3. Which affiliate product, placement and creative produced orders and commission?
4. Which social post produced site sessions and conversions, not just reach?
5. Where do visitors abandon the dinner-plan and meal-planner journeys?
6. Which SEO changes offer the highest likely traffic and revenue return?
7. What is total revenue, revenue per session/page and generation cost by channel?
8. Which data source is stale, disconnected or statistically unreliable?

“All possible information” should mean all commercially useful, privacy-respecting information. Collecting personal data or low-value behavioural noise would increase legal and operational risk without improving decisions.
