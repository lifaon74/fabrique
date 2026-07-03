[![npm (scoped)](https://img.shields.io/npm/v/fabrique.svg)](https://www.npmjs.com/package/fabrique)
![npm](https://img.shields.io/npm/dm/fabrique.svg)
![NPM](https://img.shields.io/npm/l/fabrique.svg)
![npm type definitions](https://img.shields.io/npm/types/fabrique.svg)

# Fabrique

`fabrique` is a **cli to create, build and publish libraries**,
letting the user **focus on the functionalities** of its library, instead of the build/publish process.

With `fabrique` you'll be able to:

- create rapidly a library with all the tools and scripts to:
  - build and publish your library
  - write tests for it
  - format your code
  - and debug it
- upgrade any Fabrique project to get the last functionalities in one command line.

> `fabrique` is the French word for "made/factory"

## Motivation

When we develop javascript/typescript libraries, we frequently create new repositories
and maintain the scripts to build, test, and debug them.
This tends to become rapidly cumbersome, especially when their number grows.
We may choose to opt in for a _monorepo_, and I'll tell you: yes, in many cases, this is the optimal solution.
However, in many other cases, one library per-repo makes sense, and this is where `fabrique` comes in.

Another goal is to focus on simplicity: for new incomers in javascript,
learning all the tools and build processes is complicated.
You want to write your library, but you have to learn `vite`, `jest`, how to build and publish a lib,
install `prettier`, etc. With `fabrique` all comes in pre-configured.

## 📝 Documentation

### Requirements

The library requires [Node.js](https://nodejs.org/en/download) `24+` and [yarn](https://yarnpkg.com/getting-started/install) `4+`.

### Installation

We recommend using [npx](https://docs.npmjs.com/cli/v8/commands/npx):

```shell
npx fabrique [cmd]
```

But you may prefer to install globally `fabrique`:

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
You'll be prompted for a description, author and git url.

> INFO: run the command where you want to create your project.

###### options

- `[name]`: the library name

> NOTE: currently only the `lib` type is supported. More architectures may be developed in the future.

#### \[cmd\]: upgrade

```shell
# from the root of a "fabrique" project
npx fabrique upgrade
```

##### action

This command updates an existing `fabrique` project: it updates the build files, the scripts, etc.
It tries to be non-destructive.

> INFO: run the command **inside** the `fabrique` project.

##### options

- `--force`: forces an upgrade even if the lib is not a `fabrique` project or if the version is identical. _Use with caution._

#### \[cmd\]: build

```shell
# from the root of a "fabrique" project
npx fabrique build
```

##### action

This command builds an existing `fabrique` project.

> INFO: run the command **inside** the `fabrique` project.

###### `lib` project

Summary:

- TypeScript files are transpiled into JavaScript files.
- You can exclude some files or directories by adding the suffix `.private` to the file or directory name (ex: `src/**/*.private/**/.ts`, `src/**/*.private.ts`).
- You can exclude `protected` files or directories by adding the suffix `.protected` to the file or directory name.
  These files are exported into a separate `src/index.protected.ts` file, that can be imported by `import * from '@my-organization/my-library/protected'`.
- A ready to publish package is generated in the `dist` folder.

<details>

<summary>Details</summary>

1. All `src/**/*.ts` files are transpiled into `dist/src/**/*.js`, `dist/src/**/*.js.map`, and `dist/src/**/*.d.ts` files.
1. All `src/**/*.ts` files except `src/**/*.{test,spec,bench,protected,private}.ts` and `src/**/*.{test,spec,bench,protected,private}/**/*.ts`
   are exported into a temporatry `src/index.ts` file (and transpiled into `dist/src/index.js`).
1. All `src/**/*.protected.ts` files except `src/**/*.{test,spec,bench,private}.ts` and `src/**/*.{test,spec,bench,private}/**/*.ts`
   are exported into a temporatry `src/index.protected.ts` file (and transpiled into `dist/src/index.protected.js`).

- NOTE: if no `protected` files are found, the `index.protected.ts` file is not generated

1. The `package.json` is copied into `dist/package.json` with the foloowing modifications:

- The `main` field is set to `dist/src/index.js`
- The `types` field is set to `dist/src/index.d.ts`
- The `exports` field is set to:
  - `.`: `dist/src/index.js`
  - `./protected`: `dist/src/index.protected.js`
- Other fields pointing to `.ts` files are updated to point on the corresponing `.js` files
- Unnecessary fields for publication are removed (ex: `scripts`, `packageManager`, etc.)

</details>

##### options

- `--force`: forces an upgrade even if the lib is not a `fabrique` project or if the version is identical. _Use with caution._

#### \[cmd\]: refactor

```shell
# from the directory we want to refactor
npx fabrique refactor [from] [to]
```

##### example

```shell
npx fabrique refactor my-component my-new-component
```

> Refactors all files and directories having `my-component` as name into `my-new-component` (recursively).
> AND all text-based files (ex: html, js, ts, css, etc...) containing `my-component` (or derived cases) into `my-new-component` (keeping the same case).

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
It preserves the case of the names (ex: `dash-case`, or `cameCase`).

> INFO: run the command inside the folder you want to refactor.

##### options

- `[from]`: the "source" text to refactor. Must be `dash-case`.
- `[to]`: the "destination" text to refactor. Must be `dash-case`.
- `--dry` (default: false): runs without modifying the files. This is useful to check if your refactoring is safe or not.
- `--cwd` (default: current folder): specifies the directory to start from.

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
