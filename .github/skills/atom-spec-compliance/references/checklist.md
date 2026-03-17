# Atom Compliance Checklist

Use this checklist when reviewing or changing Atom behavior in this repository.

## Validator References

- [Main Atom validator guide](https://validator.w3.org/feed/docs/atom.html)
- [Feed elements](https://validator.w3.org/feed/docs/atom.html#requiredFeedElements)
- [Entry elements](https://validator.w3.org/feed/docs/atom.html#requiredEntryElements)
- [Common constructs](https://validator.w3.org/feed/docs/atom.html#common)
- [Atom RFC mirror linked by validator](https://validator.w3.org/feed/docs/rfc4287.html)

## Repo Files to Check Together

- [src/index.ts](../../../src/index.ts)
- [src/schema.ts](../../../src/schema.ts)
- [README.md](../../../README.md)
- [test/example.test.ts](../../../test/example.test.ts)
- [test/testFeed.xml](../../../test/testFeed.xml)

## Common Risk Areas

- Timestamps accepted as generic strings instead of RFC 3339 values
- Schema allowing combinations that serializer does not support cleanly
- `content` and text construct handling for `text`, `html`, `xhtml`, XML media types, and `src`
- Feed and entry author requirements
- Link and URI validation being stricter than Atom requires
- Namespace declarations and extension element output
- Response `Content-Type` and other consumer-facing behavior

## Definition of Done

- Relevant spec guidance checked
- Schema and serialization kept aligned
- README updated if public behavior changed
- Tests added or updated intentionally
- `pnpm test` and `pnpm build` completed
