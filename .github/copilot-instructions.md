# Project Guidelines

## Build and Test
- Use `pnpm` for all package management and scripts.
- Install dependencies with `pnpm install`.
- Build with `pnpm build`.
- Run tests with `pnpm test`.
- Before finishing code changes, run the most relevant tests and the TypeScript build when public types or serialization logic changes.

## Architecture
- This package is a small TypeScript library that generates Atom feeds for Astro projects.
- Public entry points live in `src/index.ts` and expose the main API: `getAtomResponse`, `getAtomString`, exported Zod schema/types, and feed option types.
- Validation rules live in `src/schema.ts` using `astro/zod`.
- XML generation and serialization behavior live in `src/index.ts` using `fast-xml-parser`.
- Shared helpers live in `src/util.ts`.
- Default generator metadata lives in `src/generator.ts`.
- Tests live in `test/` and primarily use Vitest snapshot assertions against generated XML.

## Conventions
- Preserve the current ESM TypeScript style and existing quote/import patterns.
- Prefer minimal, targeted changes. Do not refactor unrelated serialization code while fixing a specific Atom behavior.
- When changing feed shape, schema behavior, or exported types, update both tests and README usage/API documentation.
- Keep schema validation rules and XML serialization behavior aligned. If one changes, check whether the other must change too.
- Treat `dist/` as build output. Make source changes in `src/` unless the task explicitly requires packaged artifacts.

## Testing Notes
- Use `test/example.test.ts` and `test/testFeed.xml` as the baseline pattern for new serialization coverage.
- Add focused tests for validator/spec edge cases rather than only expanding the main snapshot.
- If output ordering matters, assert it explicitly because entries are currently sorted during generation.

## Pitfalls
- The library mixes validation and serialization concerns closely, so seemingly small schema changes can alter generated XML or public typings.
- Public API changes should be evaluated for downstream Astro usage shown in `README.md`.
- This repo contains helper scripts under `scripts/`, but they are not part of the runtime library surface.