[![npm (scoped)](https://img.shields.io/npm/v/fabrique.svg)](https://www.npmjs.com/package/fabrique)
![npm](https://img.shields.io/npm/dm/fabrique.svg)
![NPM](https://img.shields.io/npm/l/fabrique.svg)
![npm type definitions](https://img.shields.io/npm/types/fabrique.svg)

# Fabrique

`fabrique` is a **CLI to create, build and publish libraries**,
letting the user **focus on the features of their library**, instead of the build/publish process.

With `fabrique`, you'll be able to:

- quickly create a library with all the tools and scripts to:
  - build and publish your library
  - write tests for it
  - format your code
  - and debug it
- upgrade any Fabrique project to get the latest features with a single command.

> `fabrique` is the French word for "factory" (from the verb "fabriquer", "to make")

## Motivation

When we develop JavaScript/TypeScript libraries, we frequently create new repositories
and maintain the scripts to build, test, and debug them.
This quickly becomes cumbersome, especially as their number grows.
We may opt for a _monorepo_, and I'll tell you: yes, in many cases, this is the optimal solution.
However, in many other cases, one library per repo makes sense, and this is where `fabrique` comes in.

Another goal is to focus on simplicity: for newcomers to JavaScript,
learning all the tools and build processes is complicated.
You want to write your library, but you have to learn `vite`, `jest`, how to build and publish a library,
install `prettier`, etc. With `fabrique`, everything comes pre-configured.

## 📝 Documentation

### Requirements

The library requires [Node.js](https://nodejs.org/en/download) `24+` and [yarn](https://yarnpkg.com/getting-started/install) `4+`.

### Installation

We recommend using [npx](https://docs.npmjs.com/cli/v8/commands/npx):

```shell
npx fabrique [cmd]
```

But you may prefer to install `fabrique` globally:

```shell
npm install -g fabrique
```

And run a command with:

```shell
fabrique [cmd]
```

### List of commands

#### \[cmd\]: create

```shell
npx fabrique create [type] [name]
```

##### \[type\]: lib

###### example

```shell
npx fabrique create lib @my-organization/my-library
```

###### action

This command creates a new library with the name `[name]` inside the folder `./[name]` (in our example: `./@my-organization/my-library`).
You'll be prompted for a description, an author and a git URL (required: it feeds the repository metadata and the changelog links).

> [!TIP]
> Run the command where you want to create your project.

###### options

- `[name]`: the library name

> [!NOTE]
> Currently, only the `lib` type is supported. More architectures may be developed in the future.

#### \[cmd\]: upgrade

```shell
# from the root of a "fabrique" project
npx fabrique upgrade
```

##### action

This command updates an existing `fabrique` project: it refreshes the build files, the scripts, etc.
It tries to be non-destructive.

> [!IMPORTANT]
> Run the command **inside** the `fabrique` project.

> [!WARNING]
> The files belonging to the `fabrique` template are **overwritten** on each upgrade.
> Only `src/**/*`, `README.md`, `LICENSE`, `package.json`, `yarn.lock` and `.github/auto_assign.yml` are preserved: every other file present in the template (e.g. `.github/workflows/*`, `tsconfig.json`, `vitest.config.ts`, `.yarnrc.yml`, `.prettierrc`, `.nvmrc`, `.changeset/config.json`, and the `fabrique/` directory) is replaced by the template's version.
> The `{{repo}}` placeholder of the overwritten `.changeset/config.json` is automatically resolved again from your `package.json` repository url.
> Do not hand-edit these files: your changes would be silently lost on the next upgrade. Instead, put your custom configuration in separate files (e.g. an additional workflow file, or a dedicated tsconfig extending the generated one).
> The `package.json` scripts are merged: your scripts are kept as long as they are not prefixed with `fb:` (they are moved under the `=== FB: CUSTOM SCRIPTS ===` section), while `fb:`-prefixed scripts are considered fabrique-owned and replaced by the template's versions.

##### options

- `--force`: forces an upgrade even if the lib is not a `fabrique` project or if the version is identical. _Use with caution._

#### \[cmd\]: build

```shell
# from the root of a "fabrique" project
npx fabrique build
```

##### action

This command builds an existing `fabrique` project.

> [!IMPORTANT]
> Run the command **inside** the `fabrique` project.

###### `lib` project

Summary:

- TypeScript files are transpiled into JavaScript files.
- The public API of your library is defined by a generated barrel file: at build time, a temporary `src/index.ts` re-exporting all non-private, non-test source files is generated, transpiled, then **removed**.
  Never commit it, and don't import it from your sources: import your modules directly instead.
  Only the files transitively imported from this barrel (or from `src/index.protected.ts`) are transpiled and published.
- You can exclude some files or directories by adding the suffix `.private` to the file or directory name (e.g. `src/**/*.private/**`, `src/**/*.private.ts`).
  Private files are excluded from the barrel and are not published, unless they are imported by an exported file.
- Files suffixed with `.test.ts`, `.spec.ts` or `.bench.ts` are excluded from the barrel and are never published (tests run from the sources with `fb:test`).
- You can exclude `protected` files or directories by adding the suffix `.protected` to the file or directory name.
  These files are exported into a separate `src/index.protected.ts` file, which can be imported by `import * from '@my-organization/my-library/protected'`.
- A ready-to-publish package is generated in the `dist` folder.
- The pending changesets (`.changeset/*.md`) are consumed inside `dist`: the package version is bumped and the `CHANGELOG.md` is generated (the repository root is left untouched).

<details>

<summary>Details</summary>

1. A temporary `src/index.ts` re-exporting all `src/**/*.ts` files except `src/**/*.{test,spec,bench,protected,private}.ts` and `src/**/*.{test,spec,bench,protected,private}/**/*.ts`
   is generated (and transpiled into `dist/src/index.js`). This file is removed once the build completes: never commit it.
1. A temporary `src/index.protected.ts` re-exporting all `src/**/*.protected.ts` files except `src/**/*.{test,spec,bench,private}.ts` and `src/**/*.{test,spec,bench,private}/**/*.ts`
   is generated (and transpiled into `dist/src/index.protected.js`).
1. TypeScript is compiled with the barrel files as the only entry points: a file is transpiled into `dist/src/**/*.js` (with its `.js.map` and `.d.ts` files) only if it is transitively imported from `src/index.ts` (or `src/index.protected.ts`).
   All other files (e.g. all `*.test.ts` files, or `*.private.ts` files not imported by an exported file) are not transpiled at all.

> [!NOTE]
> If no `protected` files are found, the `index.protected.ts` file is not generated.

1. The `package.json` is copied into `dist/package.json` with the following modifications:

- The `main` field is set to `dist/src/index.js`
- The `types` field is set to `dist/src/index.d.ts`
- The `exports` field is set to:
  - `.`: `dist/src/index.js`
  - `./protected`: `dist/src/index.protected.js`
- Other fields pointing to `.ts` files are updated to point to the corresponding `.js` files
- Unnecessary fields for publication are removed (e.g. `scripts`, `packageManager`, etc.)

</details>

##### options

- `--mode <mode>` (one of `dev`, `rc`, `prod`, default `prod`): build the project using a specific mode:
  - `dev`: appends `-dev.{prereleaseId}` to the package's version
  - `rc`: appends `-rc.{prereleaseId}` to the package's version
  - `prod`: ready for production

#### \[cmd\]: release

```shell
# from the root of a "fabrique" project
npx fabrique release
```

##### action

This command releases an existing `fabrique` project, performing the following steps in order:

- runs the `fb:test` command to ensure that the tests pass.
  - if `fb:test` does not exist, runs `test` as a replacement.
- runs the `fb:build` command to build the project.
  - if `fb:build` does not exist, runs `build` as a replacement.
  - if `build` does not exist, runs `fabrique build` as a replacement.
- checks that the resulting _build artifact_ can be published on npm.
- publishes the package on npm.
- in `prod` mode only: consumes the pending changesets (`.changeset/*.md`) — bumps the repository version, updates the `CHANGELOG.md`, removes the consumed changesets — then commits and pushes the update to the release branch (as `github-actions[bot]` when run from the CI).
  The push authenticates with the release deploy key, and the commit message carries `[skip ci]` so it does not re-trigger the release.

> [!IMPORTANT]
> Run the command **inside** the `fabrique` project.

##### options

- `--mode <mode>` (one of `dev`, `rc`, `prod`, default `prod`): see `fabrique build --mode <mode>`
- `--dry` (default: false): runs without publishing the package. This is useful to check if the output is correct or not.

#### \[cmd\]: ci

```shell
npx fabrique ci [type]
```

##### \[type\]: release

###### example

```shell
npx fabrique ci release
```

###### action

Starts the CI `release` workflow.

> [!NOTE]
> This command is automatically run from the GitHub Action `release.yml`.

#### \[cmd\]: refactor

```shell
# from the directory we want to refactor
npx fabrique refactor [from] [to]
```

##### example

```shell
npx fabrique refactor my-component my-new-component
```

> Refactors all files and directories whose name contains `my-component` into `my-new-component` (recursively),
> and all text-based files (e.g. html, js, ts, css, etc.) containing `my-component` (or derived casings) into `my-new-component` (keeping the same casing).

If we run this command with the following files structure:

- some-component
- my-component
  - my-component.ts
- my-component-abc
  - my-component-abc.ts

We get:

- some-component
- my-new-component
  - my-new-component.ts
- my-new-component-abc
  - my-new-component-abc.ts

If `my-component.ts` has this content:

```ts
class MyComponent {}

// my-component
const MY_COMPONENT = null;
function my_component(myComponent: MyComponent) {}
```

We get:

```ts
class MyNewComponent {}

// my-new-component
const MY_NEW_COMPONENT = null;
function my_new_component(myNewComponent: MyNewComponent) {}
```

##### action

This command refactors files and directories recursively from the `cwd` (by default, the current directory in which the script is executed).
It preserves the casing of the names (e.g. `dash-case` or `camelCase`).

> [!IMPORTANT]
> Run the command inside the folder you want to refactor.

##### options

- `[from]`: the "source" text to refactor. Must be `dash-case`.
- `[to]`: the "destination" text to refactor. Must be `dash-case`.
- `--dry` (default: false): runs without modifying the files. This is useful to check if your refactoring is safe or not.
- `--cwd` (default: current folder): specifies the directory to start from.

#### \[cmd\]: setup-github-repository

```shell
# from the root of a "fabrique" project
npx fabrique setup-github-repository
```

##### action

This command configures the basic rules of the GitHub repository of the current project, using the [GitHub CLI](https://cli.github.com) (`gh`):

- repository settings:
  - merge commits are allowed, while rebase and squash merges are disabled
  - auto-merge is enabled: pull requests can merge automatically once all their requirements are met
  - head branches are deleted when pull requests are merged
- a branch ruleset on `main` and `develop`:
  - push, force-push and deletion are forbidden: changes must go through a pull request
  - the CI check (`Check`) must pass, with an up-to-date branch, to allow the merge
  - the `fabrique-release` write deploy key can bypass the rules: the release workflow pushes
    the version bump commit with it. Its private key is stored in the `RELEASE_DEPLOY_KEY`
    Actions secret and is rotated on each run of this command.
    Note: GitHub scopes the `DeployKey` bypass to the key type — while it is configured, any
    write deploy key of the repository (including ones you add for other tools) can bypass
    these rules.
- a tag ruleset on release tags (`v*`): deletion and force-push are forbidden

> [!IMPORTANT]
> Requires the GitHub CLI (`gh`) to be installed and authenticated, with **administrator** permission on the repository.
> The command is idempotent: it updates the existing rules instead of duplicating them.

##### options

- `--dry` (default: false): runs without applying the changes. Useful to preview the `gh` commands.
- `--cwd` (default: current folder): the repository directory.
- `--required-checks <names>` (default: `Check`): comma-separated list of CI checks required to merge.
- `--approvals <count>` (default: 0): number of approving reviews required to merge (0 = pull request only).

#### --version

```shell
npx fabrique --version
# or
npx fabrique -v
```

Returns the current `fabrique` version.

#### --help

```shell
npx fabrique --help
# or
npx fabrique -h
```

You may get help on individual commands:

```shell
npx fabrique create -h
```

### Changelog and releases

Versions and changelogs are automated with [Changesets](https://github.com/changesets/changesets):

- every pull request that should affect the published package carries a changeset file in `.changeset/`:
  it declares the package and the bump type (`patch`, `minor`, `major`), followed by a user-facing
  summary prefixed with a `pr: #<pull request number>` line so the changelog links back to the pull
  request. The agent skill `generate-changeset` creates it for you, or write it by hand:

  ```md
  ---
  'my-library': minor
  ---

  pr: #42

  Added a dark mode to the exported components.
  ```

- on merge to `main`, the release workflow publishes the package, then consumes the pending changesets:
  it bumps the version, updates the `CHANGELOG.md`, removes the consumed changesets and pushes a
  version bump commit back to `main` through the release deploy key (as `github-actions[bot]`).
- pull requests labeled `dev` and pushes to `develop` publish suffixed versions
  (e.g. `2.0.39-dev.1234567890123`): they never consume the changesets nor touch the repository version.
- every package published from pending changesets ships a generated `CHANGELOG.md`.

> [!NOTE]
> Manual version bumps are no longer needed: a changeset is the only required release declaration.

> [!IMPORTANT]
> Existing repositories must re-run `fabrique setup-github-repository` once: the branch ruleset must
> allow the `fabrique-release` deploy key to push the version bump commit.

> [!TIP]
> Changelog links are resolved through the GitHub API. When building or releasing locally with pending
> changesets, export a `GITHUB_TOKEN`: without it, the builds skip the changelog links, and the release
> fails at the changeset consumption. Pull requests from
> forks never receive it: their release runs in dry mode without changelog links.
