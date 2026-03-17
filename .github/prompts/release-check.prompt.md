---
name: "Release Check"
description: "Use when preparing a release, publish, version bump, or final verification for astrojs-atom. Runs the expected checks and verifies src, tests, README, and packaged output assumptions stay aligned."
argument-hint: "Optionally specify a release focus such as schema changes, serialization changes, docs-only, or packaging."
agent: "agent"
---

Perform a release-readiness check for this repository.

Scope:
- Focus on the current workspace state and any user-provided release focus.
- Treat `src/` as source of truth and `dist/` as build output unless the task explicitly requires packaged artifacts.

Required checks:
- Inspect the current changes and identify anything release-relevant.
- Run the appropriate validation commands for this repo:
  - `pnpm test`
  - `pnpm build`
- If public types, feed options, schema validation, or XML serialization changed, verify that:
  - tests were updated appropriately
  - README usage/API documentation still matches behavior
- Call out any mismatch between schema rules in `src/schema.ts` and serialization in `src/index.ts`.
- Note whether release-related helper scripts or version metadata appear affected.

Output format:
- Start with findings, ordered by severity, with concrete file references.
- If there are no findings, state that explicitly.
- Then give a short release summary covering:
  - commands run
  - pass/fail status
  - residual risks or manual follow-ups

Key repo context:
- Package manager: `pnpm`
- Build: `pnpm build`
- Test: `pnpm test`
- Public API entry point: [src/index.ts](../../src/index.ts)
- Validation rules: [src/schema.ts](../../src/schema.ts)
- Default generator metadata: [src/generator.ts](../../src/generator.ts)
- Baseline tests: [test/example.test.ts](../../test/example.test.ts), [test/testFeed.xml](../../test/testFeed.xml)
- Usage/docs: [README.md](../../README.md)