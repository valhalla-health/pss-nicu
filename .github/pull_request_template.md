## Summary

<!-- What this PR changes, for whom. -->

## Release

<!--
  docs/release-ladder.md. Merging into main is live at KCMH and SPR at once (GitHub Pages
  serves main). A site backend goes test → KCMH → SPR, SPR no sooner than 7 days after KCMH.
  Delete this section for a PR that changes nothing a user reaches (docs, CI).
-->

**What changes where**

- [ ] Frontend (`index.html`, `*.jsx`): live at both sites when this merges
- [ ] Gateway (`gas/Gateway*.gs`): both sites, by `clasp update-deployment` after the merge
- [ ] Site backend code, copied into the KCMH and SPR Apps Script projects

**Rollback targets** (the versions live before this release; `clasp list-deployments` in each mirror)

| Piece | Deployment | Live before this release |
|---|---|---|
| Frontend | `main` | `<sha before the merge>` |
| Gateway | `AKfycby4Owhm…` | `@<n>` |
| KCMH | `AKfycbxdIS1…` | `@<n>` |
| SPR | `AKfycbx1QaCG…` | `@<n>` |

**Rungs** (each result also goes in a dated comment)

- Test deployment: `@<n>`, roles walked, what each saw:
- KCMH: `@<n>` from YYYY-MM-DD; failed runs in Executions since then:
- SPR, from KCMH's date + 7 days at the earliest: `@<n>` from YYYY-MM-DD
