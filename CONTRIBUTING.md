# Contributing to Mockoon-commons-server

> **[Guidelines from Mockoon's main repository](https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md) must be followed.**
> **Specific guidelines below applies to this repository:**

## Application dependence

`@mockoon/commons-server` is a library used by Mockoon [main application](https://github.com/mockoon/mockoon) and [Mockoon's CLI](https://github.com/mockoon/cli).

Dependence between the three projects is highly probable, and having to contribute solely to this repository may be possible but rare. 

Therefore, contributions to this repository should most of the time stem from a parent's issue (bug or feature) opened in the main application's or the CLI's repositories. 

## Environment

This library contains mostly "server side" code designed to be used in a Node.js environments. Thus, it is safe to use it in the Electron main process and the CLI, but **not** in Electron's renderer process.

## Contribution rules

The following rules apply to all contributions:

- Always search among the opened and closed issues. Assigned issues are already being worked on, and, most of the time, cannot be reassigned.
- Bug reports, enhancements, and features must be discussed with the maintainers regarding the implementation, changes to the UI, etc.
- Pull requests must refer to an open issue which must itself stem from a main repository's issue. Pull requests not solving existing issues may not be accepted.
- Issues and PR must follow the provided templates.

## Build and run the application

### Prerequisites

Some of the build steps require the Linux `rm` command. If you are buliding on Windows and this command is not in your path you will need to install it. Possible ways to do this are:
 - Install git for Windows and include the commands in the path.
 - Use Cmder as your terminal.
 - Use WSL.

### Build steps

 - Clone the repository: `git@github.com:mockoon/commons-server.git`.
 - You will also need the main Mockoon app repository cloned: `git@github.com:mockoon/mockoon.git`.
 - Run `npm install` to install dependencies.
 - Run `npm run build` to build the commons-server package.
 - In the Mockoon app directory, run `npm link ./path/to/local/mockoon/commons-server` to install your newly built commons-server package.
 - Follow the [build and run instructions](https://github.com/mockoon/mockoon/blob/main/CONTRIBUTING.md) for the main application.

Run the unit tests and the linter before submitting pull requests. (`npm run test` and `npm run lint`).
Run the Prettier extension to format code before submitting. Either via the VSCode extension, or on the command line (`npx prettier --write ./path/to/code-file.ts`)

## Work on your feature or bugfix

- Start your `feature` or `fix` from `main`
- Preferably squash your commits, except when it makes sense to keep them separate (one refactoring + feature development)
- Do not forget to add "Closes #xx" in one of the commit messages or in the pull request description (where xx is the GitHub issue number)

Branches naming convention:
- features and enhancements: `feature/name-or-issue-number`
- bug fixes: `fix/name-or-issue-number`

## Open a pull request

Open a pull request to be merge in the `main` branch. All branches should start from `main` and must be merged into `main`.
Ask maintainers to review the code and be prepared to rework your code if it does not match the style or do not follow the way it's usually done (typing, reducer, etc).
