# Release, verification and rollback

## Before release

1. Review the branch/PR and local preview. Keep the original source commit `47c556c94d72262a547717c6badb641fb6405545` as the rollback reference.
2. Fill `.env.local` with the five public browser configuration values. Never put a privileged credential there. Run `npm run prepare:release` to generate the versioned public `tracking-config.js` from that environment.
3. Keep legacy Pages publishing from `main` at `/`. The root files are ready-to-serve static source plus the generated public runtime artifact. No hosting settings change is needed.
4. Obtain Alvaro's explicit approval to push/merge/release, then commit the exact reviewed source and generated artifact together. On 2026-11-05 Alvaro explicitly authorized pushing, deploying and live verification in this chat.
5. After the approved merge, verify the legacy Pages build points to the exact reviewed commit and save the deployment/run ID and URL in the vault release note. The Actions validation workflow checks tests/syntax but does not replace or reconfigure the Pages deployment. Do not equate a local test or accepted workflow run with verified production.

## Verify live

- Confirm `tracking-config.js`, `tracking.js`, `form.js`, images and privacy page all return successfully under `/volnayacademy/`.
- No permission prompt or tracking-settings button. Both providers load automatically on production; GPC blocks Meta and DNT blocks both. Form submission remains usable.
- Without clicking any permission controls, verify PostHog page views, form-start/attempt/save events and a masked replay. Verify Meta PageView and a test Lead only after a database-acknowledged save. Do not include an actual prospect's data in QA.
- Obtain approval for any additional live QA record. Locate its UUID in Supabase and check all ten questionnaire columns and `is_test = true`. Public reads must remain denied.
- Google response row: an authorized Google Form editor must locate the test marker in Responses or its linked Sheet. An opaque fetch response is not evidence of that row.
- Check the QR destination itself. Event-specific cohorts require the exact tagged URL; an untagged static QR cannot be retroactively distinguished from other root-page visits.

## Existing verification

The original live page accepted one QA interaction and displayed its thank-you. Its actual Google response record was not independently readable through the connected Drive account. The same synthetic identity was used for a single private database verification row (`196ac112-9edc-42db-b388-25058bc1653f`); insertion returned 201, unchanged retry returned 409/23505, public reading was denied, and timestamp spoofing was denied. The row is retained as `is_test = true`; no deletion is authorized.

`npm test` contains deterministic, offline tests. `scripts/verify-storage.mjs --write-qa` is a separate explicit external-write test; do not rerun casually or reinterpret a duplicate response as a new successful insertion.

## Rollback

- Do not delete the database or response records.
- For a source rollback, prepare a scoped revert PR to restore the original landing-page behavior; do not force-push or reset shared history. Release only after approval and record the deployed rollback commit.
- The known original Pages configuration (legacy publishing from `main` at `/`) is preserved. A source rollback still requires approval and a matching deployed version.
- The old version can still send Google Form responses but has no verified database acknowledgment and its blank Meta pixel is inactive. State that regression explicitly rather than calling it a feature-equivalent rollback.
