[![npm (scoped)](https://img.shields.io/npm/v/fabrique.svg)](https://www.npmjs.com/package/fabrique)
![npm](https://img.shields.io/npm/dm/fabrique.svg)
![NPM](https://img.shields.io/npm/l/fabrique.svg)
![npm type definitions](https://img.shields.io/npm/types/fabrique.svg)

# Fabrique

`fabrique` is a **cli to create and build libraries**,
letting the user **focus on the functionalities** of its library, instead of the build process.

With `fabrique` you'll be able to:

- create rapidly a library with all the tools and scripts to:
  - build and publish your library 
  - write tests for it
  - format your code
  - and debug it
- upgrade any Fabrique project to get the last functionalities in one command line.

`fabrique` is not intended to provide ci scripts and pipelines to automate the processes.
Instead, it gives a uniform and simple entry point for everyone, to publish rapidly our own libraries,
on which we may add automation, scripts, and complexity.

> `fabrique` is the French word for "made/factory"

## Motivation

When we develop javascript/typescript libraries, we frequently  create new repositories,
and maintains the scripts to build, test, and debug them.
This tends to become rapidly cumbersome, especially when their number grows.
We may choose to opt in for a _monorepo_, and I'll tell you: yes, in many cases, this is the optimal solution.
However, in many other cases, one library per-repo makes sense, and this is where `fabrique` comes in.

Another goal is to focus on simplicity: for new incomers in javascript,
learning all the tools and build processes is complicated.
You want to write your library, but you have to learn `vite`, `jest`, how to build and publish a lib,
install `prettier`, etc. With `fabrique` all comes in pre-configured.

## 📝 Documentation

### Requirements

The library requires [Node.js](https://nodejs.org/en) `22+` and [yarn](https://yarnpkg.com/) `4+`.

### Installation

We recommend to use [npx](https://docs.npmjs.com/cli/v8/commands/npx):

```shell
npx fabrique [CMD]
```

But, you may prefer to install globally `fabrique`:

```shell
npm install -g fabrique
```
And run a command with:

```shell
fabrique [CMD]
```


### List of commands

#### create

```shell
npx fabrique create lib [name]
```

##### example

```shell
npx fabrique create lib @my-company/my-library
```

##### action

This command creates a new library with the name `[name]` inside the folder `./[name]` (in our example: `./@my-company/my-library`).
You'll be prompted for a description, author and git url.

> INFO: run the command where you want to create your project.

##### options

- `[name]`: the library name

#### upgrade

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

#### refactor

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

> INFO: run the command inside the folder that you want to refactor.

##### options

- `[from]`: the "source" text to refactor. Must be `dash-case`.
- `[to]`: the "destination" text to refactor. Must be `dash-case`.
- `--dry` (default: false): runs without modifying the files. This is useful to check if your refactoring is safe or not.
- `--cwd` (default: current folder): specifies the directory to start from.

#### verdaccio

```shell
npx fabrique verdaccio
```

Installs and launches [verdaccio](https://verdaccio.org/). This is useful to debug interdependent libraries.

Let's say we have:

- a library `my-lib-a`
- another library `my-lib-b` with `my-lib-a` as `dependency`

When working on `my-lib-a`, if we want to test if our changes works properly on `my-lib-b`, we'll publish a `dev` version of `my-lib-a` on a local `verdaccio`,
then, we'll consume this dev version on `my-lib-b`.

> We choose verdaccio instead of `npm link` because versions and dev packages are unique with a package registry.
> 
> Thus, we may have `my-lib-b` consuming `my-lib-a-dev.0` and `my-lib-c` consuming `my-lib-a-dev.1`, which is not possible with `npm link`.


#### version

```shell
npx fabrique --version
# or
npx fabrique -v
```

Returns the current `fabrique` version.

#### help

```shell
npx fabrique --help
# or
npx fabrique -h
```

You may get help on individual commands:

```shell
npx fabrique create -h
```



