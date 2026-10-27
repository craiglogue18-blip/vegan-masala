# Recipe Publisher

Open `/admin/publisher`, sign in with the existing administrator username and password, choose a recipe, edit individual ingredient/step rows, and upload a finished MP4 or replacement hero. Save draft, inspect Preview, then Publish saved draft. Preview is an isolated content/media preview inside the editor; the public page retains its existing layout. Unsaved edits cannot be published. Reload warns before discarding edits when switching recipes. Draft edits use atomic revision checks so another tab cannot silently overwrite a saved draft.

## Required setup

Set these server environment variables in Vercel and locally for development:

- `ADMIN_USERNAME` (default `vegan-masala`) and a strong `ADMIN_PASSWORD` (or existing `ADMIN_TOKEN`). Publisher fails closed even locally when credentials are absent. Use HTTPS in production. Browser Basic authentication reuses the site's existing admin protection. No admin secret is stored in browser storage or client bundles.
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`: a persistent Redis-compatible store supported by the existing `@vercel/kv` package. Keys are `publisher:v1:<slug>:draft` and `publisher:v1:<slug>:published`. Back up this store: overrides become the source of truth for edited fields. Do not share the production store with untrusted preview deployments.
- `BLOB_READ_WRITE_TOKEN`: connect a public Vercel Blob store for media. Browser uploads go directly to Blob, avoiding server request size limits. Files get unique names; replacements never overwrite old media. MP4 limit 10 GB; JPG/PNG/WebP limit 10 MB. Uploads are public as soon as uploaded, including draft assets. Do not upload private material. Media is not generated or transcoded.
- `PUBLISHER_MEDIA_ORIGIN`: exact HTTPS Blob store origin, such as `https://<store>.public.blob.vercel-storage.com`. Only this origin is accepted for newly selected remote media. Existing recipe media is preserved. This also configures Next image optimization, so configure before building.
- `PUBLISHER_PRODUCTION_ORIGIN`: canonical HTTPS origin, normally `https://www.vegan-masala.com`. No redirects are followed during verification; use the final canonical hostname.

Deploy the code once after configuring these values. Publishing afterwards requires no Git write, AI credit, or rebuild: each recipe request and its metadata read the published override from KV. File recipes remain the fallback for untouched content. Edited instructions take precedence over the repository's editorial depth instructions. Missing storage configuration disables the editor; configured storage errors surface rather than falsely serving stale published data. Public recipe requests now render dynamically, adding a KV read per recipe request. Recipe listing cards, meal planner, home-page showcases, and other file-based consumers retain their original content; this publisher changes the existing recipe detail page and its metadata.

## Optional Vercel rebuild and verification

Set `PUBLISHER_VERCEL_TOKEN` with access to the project, `VERCEL_PROJECT_ID`, `VERCEL_DEPLOYMENT_ID` (Vercel system variable for this deployment), optional `VERCEL_TEAM_ID`, and optionally `PUBLISHER_VERCEL_PROJECT_NAME` (default `vegan-masala`). Secrets remain server-side. The button redeploys the current deployment as production through Vercel's REST API; it does not push or merge code and does not fetch a newer Git commit. It is optional because content is already persistent. Requests are throttled to one per two minutes.

The editor stores the deployment ID server-side and polls every ten seconds while open. READY means the build completed; it does not imply the production domain serves the edited content. Click **Verify production content** to fetch the canonical recipe URL without credentials, without redirects, and with cache bypass. Verification requires HTTP success plus the exact published revision marker in rendered HTML. A mismatch, failure, or timeout never reports live. Keep the editor open for build status updates; no background email notification is installed.

## Checks and recovery

Run `node --test tests/publisher.test.cjs`, `npx tsc --noEmit`, and `npm run build`.

Before production rollout, use a separate preview KV/Blob store: confirm anonymous and cron credentials cannot access the publisher, cross-origin writes are rejected, large MP4 uploads work, draft saves do not alter public pages, stale tabs receive 409, and published ingredients/instructions/hero/video match the preview. Confirm production verification reports a mismatch on an older deployment, then succeeds only after the correct deployment and shared production storage are active. Verify Vercel ERROR/CANCELED states with a test deployment.

To undo an edit, edit and publish the previous values again, or restore the published KV key from backup. Deleting that key restores the file-based recipe. No automatic media deletion occurs; uploaded draft assets and replaced files remain in Blob to avoid breaking old URLs. Review and remove unused assets manually using the Blob dashboard. Draft revisions are private, but this initial implementation keeps only the latest draft and latest publication, not a full revision history.

Vercel reference: https://vercel.com/docs/vercel-blob/client-upload and https://vercel.com/docs/rest-api/deployments/create-a-new-deployment.


## Reliable large-video uploads and local use

Finished MP4 exports up to 10 GB upload directly from the browser in retryable parts. No compression or re-encoding occurs: the uploaded file retains its original picture, sound and size. Files above 10 GB, empty files and unsupported formats are rejected before transfer; photos retain the 10 MB limit. The browser checks media configuration and saves the recipe before transfer, then saves the completed media URL to the draft automatically. Publish remains a separate action.

The upload panel shows filename, transferred bytes, percentage, cancellation, completion and failure. Keep the tab open. Cancelled or interrupted transfers can be retried by selecting the same file. This is retry support, not cross-reload byte-level resumption. Part retries within a live transfer are handled by the Blob SDK. Completed media URLs are checkpointed immediately before the final draft save, so a failed save can be retried without another upload.

The selected recipe, draft revision and unsaved text are kept in this tab's session storage and recovered after a refresh. Recovery never changes the publication. Stale recovered drafts retain their old revision and cannot overwrite newer remote drafts. The browser warns before leaving during unsaved work or upload. Browser storage is best-effort; use Save draft for durable storage. Credentials and file bytes are never put in browser storage.

For a stable local utility, prepare a private environment file with the settings above, then run:

```
npm run publisher:local -- --env-file /absolute/path/to/private.env --build
```

Open `http://127.0.0.1:3141/admin/publisher`. This launcher uses an isolated `.next-publisher` production build and a loopback-only proxy. It does not use Next development live reload, which cannot pass through a plain HTTP proxy and previously caused repeated page refreshes. Stop the old test server before starting it. Subsequent launches can omit `--build` until code or build-time configuration changes. The local proxy keeps credentials server-side and forwards only same-origin writes; large media bypass it and go directly to Blob. The automatic draft save after a browser upload does not depend on a public callback URL or a localhost tunnel.
