# Volnay Academy sign-up page

Static GitHub Pages landing page behind Paddy's Volnay Academy QR slide. No framework or installed dependencies are required.

## Storage and tracking

- **Durable, acknowledged record:** private Supabase `public.form_submissions`. The browser can insert bounded records but cannot read, update, or delete them. The UI shows success only after HTTP 201, or a confirmed duplicate retry of its unchanged UUID.
- **Secondary copy:** the existing Volnay Academy Google Form receives the same questionnaire fields after the database save. Google returns an opaque response, so `google form request completed` does **not** mean a verified Google response record.
- **Analytics:** PostHog project **712854**, in the separate **Volnay Academy** organization. Standard page views, autocapture outside the protected form, performance, exceptions, and masked session replay are enabled automatically on the production site (except when Do Not Track is enabled). Questionnaire answers are not analytics properties. Inputs, form text, network bodies/headers and console replay are protected.
- **Retargeting:** Meta dataset/pixel **4490650331206832**, owned by Volnay Academy portfolio **1851560458243074**. PageView and FormStarted load automatically unless Global Privacy Control or Do Not Track is enabled; Lead fires only after an acknowledged database save. No campaigns or spend are enabled by this repository.
- **Local previews:** neither analytics nor Meta loads on localhost. The configured database is still real, so do not submit extra records without approval.

## Run locally

1. Copy `.env.example` to `.env.local`, then fill the five public configuration values from the verified projects. Never use a personal API key, database password, service-role key or Supabase secret key.
2. Run `npm test` and `npm run build` with Node 22 or newer.
3. Run `npm run preview` and open `http://127.0.0.1:4173/volnayacademy/`.

`dist/` is a generated deployment artifact, not source. It contains the public runtime configuration. `.env.local`, response exports and verification output are ignored by Git. `npm run prepare:release` generates a versioned **public** `tracking-config.js` at the repository root so the existing legacy Pages deployment can serve the exact reviewed configuration without changing the host. The project tokens/publishable keys in that artifact are designed for browsers and grant no private response read access.

## Where to see saved responses

Authorized operators can open the [Supabase project](https://supabase.com/dashboard/project/jhqtirahcczngpioryhj/editor) and select `form_submissions`. Each column has a descriptive comment and matches a field in [the data dictionary](docs/form-fields.md). Do **not** enable public SELECT or build an unauthenticated response viewer.

Exclude `is_test = true` from prospect totals. The database derives this flag from the `test-lead` name marker or an `@example.com` email; the public client cannot override it. A single synthetic QA identity was submitted to the old live Google flow; its matching database verification record is retained, not deleted.

## Release

See [deployment and rollback](docs/release.md). The site keeps legacy Pages publishing from `main`. Generate the public runtime artifact with `npm run prepare:release`, review the exact changes, then merge only after release approval. No Pages setting changes, new hosting provider or repository-admin access is required.

## Event attribution

Use the dedicated QR destination:

`https://paddytbf.github.io/volnayacademy/?event=northeastern-2026-11-05`

Only that exact marker creates the Northeastern event-source label. Untagged traffic stays `unattributed`; it is not automatically called event attendance. A forwarded tagged link also does not prove physical attendance. If the existing QR is static and untagged, update the slide QR or change its redirect destination if supported. Do not claim retroactive event isolation.

## Important limitations

- Google Form storage is not independently confirmed until an authorized editor locates the labeled QA response. The old live page's thank-you is not that proof.
- The public database API is append-only and field-bounded, but not a CAPTCHA or per-IP rate limiter. Monitor spam and usage; add server-side bot verification if abuse appears.
- Google delivery is best effort; database records remain the authoritative receipt. Failed Google copies are not automatically retried, and unchanged duplicate retries are not mirrored twice.
- A timeout followed by reloading the page loses the in-memory retry UUID; a manual resubmission after reload may create a second legitimate-looking record. No PII is persisted in browser storage to avoid that risk.
