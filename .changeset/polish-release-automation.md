---
'fabrique': patch
---

pr: #21

Polished the release automation: the version bump commits are now authored as `github-actions[bot]` (with the bot badge on GitHub), and the generated `CHANGELOG.md` is exempt from the format check so it cannot break `fb:format:check` after a release.
