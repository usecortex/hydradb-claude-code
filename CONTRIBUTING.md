# Contributing to hydradb-claude-code

Welcome, and thank you for your interest in contributing to hydradb-claude-code. This project is a HydraDB plugin for Claude Code, and we appreciate contributions of all kinds -- bug reports, documentation improvements, new features, and code reviews.

All participants in this project are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Developer Certificate of Origin (DCO)

This project uses the [Developer Certificate of Origin](https://developercertificate.org/) (DCO) instead of a Contributor License Agreement (CLA). The DCO is a lightweight mechanism that certifies you have the right to submit the code you are contributing. Every commit you submit **must** include a `Signed-off-by` line, and this requirement is enforced by CI.

### How to sign off your commits

Add the `-s` flag when committing:

```bash
git commit -s -m "feat: add new hook"
```

This appends a line like the following to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

The name and email must match your Git configuration. You can verify your settings with:

```bash
git config user.name
git config user.email
```

If you have already made commits without signing off, you can amend the most recent commit:

```bash
git commit --amend -s --no-edit
```

Or rebase to sign off multiple commits:

```bash
git rebase --signoff HEAD~N
```

where `N` is the number of commits to update.

**Commits without a valid `Signed-off-by` line will be rejected by CI and cannot be merged.**

For the full text of the DCO, see: https://developercertificate.org/

---

## Getting Started

### Fork and clone

1. Fork the repository on GitHub.
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/hydradb-claude-code.git
cd hydradb-claude-code
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/usecortex/hydradb-claude-code.git
```

### Set up the development environment

Install dependencies:

```bash
npm install
```

If the project includes a `Makefile`, you can also use:

```bash
make bootstrap
```

### Configure environment variables

Copy the example configuration file and fill in your settings:

```bash
cp .hydradb-plugin.json.example .hydradb-plugin.json
```

Edit the file and add the required configuration. Never commit this file -- it is already in `.gitignore`.

### Verify the setup

Ensure the plugin loads correctly by following the instructions in the README.

---

## Branch Naming Convention

Create a new branch from `main` for every change. Use the following prefixes:

- `feat/` -- new features (e.g., `feat/new-hook`)
- `fix/` -- bug fixes (e.g., `fix/config-loading`)
- `docs/` -- documentation changes (e.g., `docs/update-readme`)
- `chore/` -- maintenance, CI, and tooling (e.g., `chore/update-dependencies`)

---

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope): description
```

### Types

| Type       | Purpose                                  |
|------------|------------------------------------------|
| `feat`     | A new feature                            |
| `fix`      | A bug fix                                |
| `docs`     | Documentation-only changes               |
| `chore`    | Maintenance, CI, or tooling changes      |
| `refactor` | Code restructuring without behavior change |
| `test`     | Adding or updating tests                 |
| `perf`     | Performance improvements                 |

### Signing off

Every commit must include the DCO sign-off.

---

## Pull Request Guidelines

- **Reference an issue.** Every PR must reference an existing GitHub issue. If no issue exists for your change, create one first and wait for acknowledgment from a maintainer before starting work.
- **Fill out the PR template completely.** Do not delete sections from the template.
- **Keep PRs focused.** Each PR should contain one logical change. Avoid bundling unrelated fixes or features.
- **All CI checks must pass.** This includes linting, building, and DCO verification.
- **At least one maintainer review is required** before any PR can be merged.
- **Rebase on `main` before requesting review.**

---

## Code Style

- **JavaScript** is used throughout. Keep code clean and well-documented.
- **No hardcoded credentials.** API keys, tokens, and secrets must always come from environment variables or configuration files excluded from version control.

---

## What We Will NOT Accept

- PRs without a linked issue.
- Large dependency additions without prior discussion and approval in an issue.
- Breaking changes without an approved issue describing the rationale and migration path.
- Code that introduces hardcoded secrets or credentials.
- PRs that do not pass CI checks.
- Cosmetic-only changes (whitespace, formatting) unless they are part of a larger, substantive fix.

---

## Reporting Bugs and Requesting Features

### Bug reports

Use the **Bug Report** issue template. Include:

- A clear description of the problem.
- Steps to reproduce.
- Expected behavior versus actual behavior.
- Your environment (OS, Node.js version, Claude Code version).

### Feature requests

Use the **Feature Request** issue template. Include:

- The problem or use case your feature addresses.
- A proposed solution or approach.
- Any alternative approaches you considered.

**Before opening a new issue, search existing issues to avoid duplicates.**

---

## Thank You

Every contribution -- whether it is a bug report, a documentation fix, or a new feature -- makes hydradb-claude-code better. We appreciate your time and effort.
