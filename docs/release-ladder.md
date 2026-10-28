# PSS:NICU — release ladder

A change reaches a test deployment first, then KCMH, and reaches SPR only after KCMH has run it for
**7 days** with no new failed run. Every step names the version it replaces as its rollback target.

Written 2026-10-28 for NF-05 in Pp's apply list, the staged release for PSS:NICU's two sites. **Nothing
in it runs yet:** the test deployment, its Sheet and its accounts are Pp's one-time setup at the end.
The number of days, and the questions marked *Pp* below, are hers to set.

## How each piece deploys today

Checked 2026-10-28 with `clasp list-deployments` in each Apps Script mirror under `~/nicu-tools/`,
`gh api repos/valhalla-health/pss-nicu/pages`, and the code in this repo.

| Piece | Code | Goes live by | Live now = rollback target | Reaches |
|---|---|---|---|---|
| Frontend (`index.html`, `*.jsx`) | this repo | GitHub Pages serves `main` from `/` (legacy build), so every merge into `main` is live at once. `main` has no branch protection. | the `main` commit before the merge | both sites |
| Gateway, the login router | `gas/Gateway*.gs` here, and its Apps Script mirror `praewxtvl/nicu-pss-gateway` | `clasp update-deployment` on `AKfycby4Owhm…`, the `PSS_GATEWAY_URL` in `index.html` | `@4` | both sites |
| KCMH backend | private `praewxtvl/nicu-pss` | `clasp update-deployment` on `AKfycbxdIS1…`, the `KCMH_API` in `gas/Gateway_Setup.gs` | `@29` "v5.1 + header trim fix" | KCMH |
| SPR backend | private `praewxtvl/nicu-spr` | `clasp update-deployment` on `AKfycbx1QaCG…`, the `SPR_API` there | `@7` "v5.1 verifyToken via Gateway session (clean)" | SPR |

What this means for a ladder:

- **The registry, not the frontend, picks a user's backend.** After sign-in the gateway returns the
  `apiUrl` on that user's row of its registry sheet, and the frontend sends every call there. So a
  site's backend can move on its own; the frontend and the gateway cannot, because both sites use them.
- **The two site backends are two codebases.** On 2026-10-28 the KCMH mirror's `รหัส.js` has 658
  lines (multi-hospital scoping, PDPA deletes, POST-only), the SPR mirror's 428 (a copy of 2026-05-29).
  "The same release" at both sites is the same change applied to each copy, until PSS-08 makes them
  one.
- **A second deployment of a site's project is not a test.** Every deployment of one Apps Script
  project shares its Script Properties, so it reads `SPREADSHEET_ID` and writes the real Sheet. The
  test rung is therefore a separate project with its own Sheet.
- **There is no error-log tab at either site.** The log is each project's Apps Script ▸ Executions
  page, Status = Failed, and it keeps 7 days.
- The registry rows are what `gas/Gateway_Setup.gs` `AUDIT_REGISTRY()` checks; confirm in its log that
  every KCMH row ends in the `KCMH_API` tail and every SPR row in the `SPR_API` tail before the first
  ladder run, since the table above assumes they do.
- `index.html` also keeps a legacy `PSS_API_URL` (`AKfycbwuKOR…`, `@28` in the KCMH project), used
  only when there is no gateway URL. `deploy.ps1` patches that URL in `index.html` and in
  `index_spr.html`, which no longer exists; the ladder does not use it.

## The ladder

```text
rung 1: test deployment ──(walk-through passes)──→ rung 2: KCMH ──(7 days, no new failed run)──→ rung 3: SPR
        synthetic Sheet, synthetic accounts               live                                       live
```

### Rung 1 · the test deployment

1. Apply the change to the test project (`~/nicu-tools/pss-nicu-test/`, a copy of the KCMH code),
   then `clasp push`, `clasp create-version "<what> (<PR>)"` and
   `clasp update-deployment <test id> -V <n>`.
2. **Frontend changed?** Serve this branch on your own machine:
   `python -m http.server 8000 --bind 127.0.0.1` in the checkout, then open `http://127.0.0.1:8000/`.
   Sign in with a test account by email and password; Google sign-in would need `127.0.0.1` as an
   authorized origin, and the password path does not. Never use `PSS_DEV_MODE`.
3. **Gateway changed?** Make a second deployment of the gateway project for the test
   (`clasp create-deployment -V <n> -d "gateway test"`) and point a local, uncommitted copy of
   `index.html` at it. It reads the live registry and shares the gateway's session cache, so it is a
   test of the code, not of separate data.
4. As each test role, open every screen the change touches, add a made-up family, assessment and
   intervention, and confirm nothing from KCMH or SPR appears. PSS-03 is the fuller form of this
   walk-through.
5. Write in a comment on the PR: the test version, the roles walked, what each saw.

### Rung 2 · KCMH

1. In `~/nicu-tools/pss-nicu`: diff against the test project's code (they differ only in Script
   Properties, which are not in the files), then `clasp push`, `clasp create-version "<what> (<PR>)"`
   and `clasp update-deployment AKfycbxdIS1… -V <n>`, signed in as `peeraporn.po@chula.ac.th`.
2. Write in a comment on the PR: the date, the new version, and the rollback target (`@29` today).
3. For 7 days: KCMH project ▸ Executions ▸ Status = Failed, read on day 3 and on day 7, compared with
   the week before; anything the KCMH site nurse reports; and how many assessments reached the new
   version (*Pp*: how many are enough), counted in the KCMH Sheet by date, counts only.

### Rung 3 · SPR

Not before KCMH has had 7 days with no new failed run and the assessments Pp set.

1. Apply the same change to `~/nicu-tools/pss-nicu-spr-new`. Where the SPR copy differs from KCMH's
   around the change, run rung 1 again with SPR's code first.
2. `clasp update-deployment AKfycbx1QaCG… -V <n>`; rollback target `@7` today.
3. Watch SPR's Executions and the SPR site nurse the same way for 7 days.

### The frontend and the gateway reach both sites at once

They cannot stop at KCMH, so:

- **A frontend change must work with both site backends as they are**, SPR's older copy included,
  because it is live at both the moment it merges. A frontend change that needs a backend change
  merges after SPR has that backend, as the last step.
- Before the merge: rung 1 with the local frontend. After it: both sites' Executions for 7 days.
- **Gateway:** rung 1 as above, then `clasp update-deployment AKfycby4Owhm… -V <n>` (rollback `@4`),
  and watch both sites.

## Rolling back

- **A site backend or the gateway:** `clasp update-deployment <deployment> -V <rollback target>`. It
  takes effect on the next request. Rows the new version wrote stay in the Sheet, so a change that
  writes a new column or a new format must be one the old version can read.
- **The frontend:** revert the merge on `main` by PR. GitHub Pages republishes in a minute or two;
  there is no faster switch.

## The release PR

Any PR whose change goes live (frontend, gateway, or code to copy into a site backend) fills the
release block of `.github/pull_request_template.md`: what changes where, the rollback target per
site, and the rungs. The body holds the plan; each rung's result goes in a dated comment.

## One-time setup (Pp)

All free: an Apps Script project, its deployment and a Google Sheet cost nothing.

1. **The test Sheet.** A new blank Google Sheet, "PSS-NICU TEST (synthetic only)", in
   `peeraporn.po@chula.ac.th`'s Drive. Seven tabs, the ones SPR's `VERIFY_SHEETS()` checks:
   `families`, `assessments`, `interventions`, `notes`, `carePlans`, `staff`, `hospitals`. Into row 1
   of each, copy the header row of the same tab in the KCMH Sheet: row 1 only, never a data row. In
   `hospitals`, add `TEST | โรงพยาบาลทดสอบ (synthetic)`.
2. **The test backend.** `mkdir ~/nicu-tools/pss-nicu-test`, then in it
   `clasp create-script --type standalone --title "PSS-NICU TEST backend"`. Copy `รหัส.js` and
   `appsscript.json` from `~/nicu-tools/pss-nicu` and `clasp push` (answer yes to overwriting the
   manifest). In the editor's Project Settings ▸ Script properties set `SPREADSHEET_ID` to the test
   Sheet's ID and `GATEWAY_URL` to the gateway's live URL; run `AUDIT_SCRIPT_PROPS()`. Then
   `clasp create-deployment -d "TEST synthetic"`; the copied manifest already sets
   `USER_DEPLOYING` and `ANYONE_ANONYMOUS`, as the live sites have.
3. **The test accounts.** In the gateway's registry sheet, two rows: role `nurse` and role `doctor`,
   `hospitalCode` `TEST`, `apiUrl` the test deployment's URL, `active` `TRUE`, and a made-up address
   each, such as `pss-test-nurse@example.invalid`. From the gateway's editor run
   `setInitialPassword("<address>", "<password>")` for each and keep the passwords in your password
   manager. Set `active` to `FALSE` between test runs.
4. **An admin test account only when a change touches admin screens** (*Pp*). The KCMH code lets
   `admin` see every hospital's rows, so a TEST admin row whose `apiUrl` named a live site would show
   real families. Add it for that test, check its `apiUrl` first, and set it inactive after.
5. **Before the first use:** sign in as each test account and confirm the families list is empty
   apart from what the tests added.
