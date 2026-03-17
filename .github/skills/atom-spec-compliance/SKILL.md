---
name: atom-spec-compliance
description: 'Review or implement Atom feed schema and serialization changes. Use for Atom validator issues, feed compliance work, RFC 3339/date validation, text/content construct behavior, link or author requirements, namespace handling, and README/test updates tied to Atom spec changes.'
argument-hint: 'Describe the Atom behavior, issue, or spec area to review or implement'
user-invocable: true
---

# Atom Spec Compliance

## When to Use
- Review a change for Atom validator compatibility.
- Implement or fix Atom feed behavior in schema or serialization code.
- Investigate issues involving `content`, `summary`, `title`, `rights`, `link`, `author`, `source`, timestamps, namespaces, or response media type.
- Check whether README examples and tests still match current Atom behavior.

## Repo Context
- Public API and XML generation live in [src/index.ts](../../../src/index.ts).
- Validation rules live in [src/schema.ts](../../../src/schema.ts).
- Default generator metadata lives in [src/generator.ts](../../../src/generator.ts).
- Baseline serialization tests live in [test/example.test.ts](../../../test/example.test.ts) and [test/testFeed.xml](../../../test/testFeed.xml).
- Repo-wide defaults live in [copilot-instructions.md](../../copilot-instructions.md).
- Test-specific guidance lives in [testing.instructions.md](../../instructions/testing.instructions.md).

## Procedure
1. Identify whether the change is primarily a schema rule, XML serialization rule, public API change, or a combination.
2. Read the relevant validator/spec guidance first. Use the checklist in [checklist.md](./references/checklist.md).
3. Inspect both [src/schema.ts](../../../src/schema.ts) and [src/index.ts](../../../src/index.ts). Do not change one without checking the other.
4. If the behavior is public, verify whether [README.md](../../../README.md) examples or API descriptions need updating.
5. Add or update focused tests in [test/example.test.ts](../../../test/example.test.ts). Prefer targeted assertions for spec edge cases over unrelated snapshot churn.
6. Update [test/testFeed.xml](../../../test/testFeed.xml) only when output changes are intentional.
7. Run `pnpm test` and `pnpm build` before finishing.

## Review Checklist
- Does the behavior match Atom validator guidance for the relevant element or construct?
- Are schema validation and XML serialization consistent with each other?
- Are public types and runtime behavior aligned?
- Do tests cover the exact spec edge case being changed?
- Does README documentation still match the API and output?

## Output Expectations
- For reviews: list findings first, ordered by severity, with concrete file references.
- For implementations: summarize the spec requirement, the code change, the tests updated, and any residual compatibility risk.