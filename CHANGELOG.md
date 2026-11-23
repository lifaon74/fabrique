# fabrique

## 2.1.2 (2026-11-23)

### Patch Changes

- Projects generated from the `lib` template now ignore the `.superpowers/` directory in both `.gitignore` and `.prettierignore`, keeping generated repositories clean of superpowers artifacts. ([#22](https://github.com/lifaon74/fabrique/pull/22))

## 2.1.1 (2026-11-23)

### Patch Changes

- Polished the release automation: the version bump commits are now authored as `github-actions[bot]` (with the bot badge on GitHub), and the generated `CHANGELOG.md` is exempt from the format check so it cannot break `fb:format:check` after a release. ([#21](https://github.com/lifaon74/fabrique/pull/21))

## 2.1.0 (2026-11-23)

### Minor Changes

- Automated the release flow with [Changesets](https://github.com/changesets/changesets): version bumps and the `CHANGELOG.md` are generated from changeset files — no more manual `package.json` version edits. ([#20](https://github.com/lifaon74/fabrique/pull/20))
  
  - `setup-github-repository` configures a release deploy key that lets the release workflow push the version bump commit to the protected branches.
  - CI releases (pushes to `main` and `develop`) skip the publication when the equivalent version
    is already on npm (docs-only merges stay green), and builds no longer fail without pending changesets.
  - Every build ships the committed or freshly generated `CHANGELOG.md`.
  - Projects created from the `lib` template come with the changesets setup (config, `generate-changeset` agent skill and documentation).
