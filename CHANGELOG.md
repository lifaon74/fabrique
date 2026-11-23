# fabrique

## 2.1.0 (2026-11-23)

### Minor Changes

- Automated the release flow with [Changesets](https://github.com/changesets/changesets): version bumps and the `CHANGELOG.md` are generated from changeset files — no more manual `package.json` version edits. ([#20](https://github.com/lifaon74/fabrique/pull/20))
  
  - `setup-github-repository` configures a release deploy key that lets the release workflow push the version bump commit to the protected branches.
  - CI releases (pushes to `main` and `develop`) skip the publication when the equivalent version
    is already on npm (docs-only merges stay green), and builds no longer fail without pending changesets.
  - Every build ships the committed or freshly generated `CHANGELOG.md`.
  - Projects created from the `lib` template come with the changesets setup (config, `generate-changeset` agent skill and documentation).
