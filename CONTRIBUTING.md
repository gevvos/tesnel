# Contributing

## Development Setup

```bash
git clone https://github.com/gevvos/tesnel.git
cd tesnel
pnpm install
```

## Scripts

```bash
pnpm dev            # Run CLI in dev mode
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage
pnpm lint           # Lint with oxlint
pnpm lint:fix       # Auto-fix lint issues
pnpm build          # Build library + UI
```

## Project Structure

- `lib/` — Library and CLI source code
- `ui/` — Vue-based interactive visualization
- `tests/fixtures/` — Test fixture projects
- `dist/` — Build output (not committed)

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Prefix your commits:

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `test:` — Test changes
- `refactor:` — Code refactoring

Release versions are managed automatically by [release-please](https://github.com/googleapis/release-please) based on commit messages.

## Pull Requests

1. Fork and create a feature branch
2. Make sure `pnpm test` and `pnpm lint` pass
3. Submit a PR against `main`
