# Affiliate partner setup

The meal-planner shopping page supports the following optional public environment variables:

- `NEXT_PUBLIC_ETHICAL_SUPERSTORE_AFFILIATE_URL`
- `NEXT_PUBLIC_ABEL_AND_COLE_AFFILIATE_URL`
- `NEXT_PUBLIC_LAKELAND_AFFILIATE_URL`
- `NEXT_PUBLIC_NINJA_AFFILIATE_URL`

Use the complete tracking URL supplied by the approved affiliate programme. A partner is hidden when its variable is absent, so ordinary retailer URLs are never presented as paid links by mistake.

After adding or changing a variable in Vercel, redeploy the site so Next.js includes it in the production build.
