---
description: "Use when adding or changing tests, Atom feed snapshots, validator compliance cases, or serialization assertions. Covers focused Vitest patterns for test/** files and snapshot discipline."
applyTo: "test/**"
---

# Testing Guidelines

- Prefer focused tests for Atom spec and validator edge cases instead of only expanding the main snapshot.
- Use `test/example.test.ts` and `test/testFeed.xml` as the baseline pattern for feed serialization tests.
- When behavior changes intentionally, update snapshot output deliberately and keep the diff limited to the changed feature.
- If output ordering matters, assert it explicitly because entries are currently sorted during generation.
- When changing public feed options, schema behavior, or serialization rules, update tests together with any affected README examples.
- Avoid broad fixture churn for unrelated formatting or whitespace changes in generated XML.