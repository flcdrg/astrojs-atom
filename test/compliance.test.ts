import getAtomResponse, { atomSchema, getAtomString, type AtomFeedOptions } from "../src/index";
import { describe, expect, test } from "vitest";

const testGenerator = {
    value: "Test Generator",
    uri: "https://example.com/generator",
    version: "1.0",
};

function createValidFeed(): AtomFeedOptions {
    return {
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [
            {
                title: "Test Item",
                id: "https://example.com/item",
                updated: "2023-10-01T00:00:00Z",
                published: "2023-09-30T23:59:59-05:00",
                source: {
                    id: "https://example.com/source",
                    title: "Source Feed",
                    updated: "2023-09-30T23:00:00+01:00",
                },
                link: [{ href: "https://example.com/item", rel: "alternate" }],
            },
        ],
    };
}

describe('Atom compliance serialization', () => {
    test('serializes html and xhtml constructs according to Atom rules', async () => {
        const result = await getAtomString({
            title: { value: "<em>Feed</em>", type: "html" },
            subtitle: { value: "<p><strong>Subtitle</strong></p>", type: "xhtml" },
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            generator: testGenerator,
            author: [{ name: "Test Author" }],
            entry: [
                {
                    title: { value: "<strong>HTML Entry</strong>", type: "html" },
                    id: "https://example.com/html",
                    updated: "2023-10-01T00:00:00Z",
                    summary: { value: "<p>Summary</p>", type: "html" },
                    content: { value: "<p>Body</p>", type: "html" },
                    link: [{ href: "https://example.com/html", rel: "alternate" }],
                },
                {
                    title: { value: "<p><em>XHTML Entry</em></p>", type: "xhtml" },
                    id: "https://example.com/xhtml",
                    updated: "2023-10-02T00:00:00Z",
                    summary: { value: "<p>Summary</p>", type: "xhtml" },
                    content: { value: "<p><strong>Body</strong></p>", type: "xhtml" },
                    link: [{ href: "https://example.com/xhtml", rel: "alternate" }],
                },
            ],
        });

        expect(result).toMatchSnapshot();
    });

    test('serializes source metadata with Atom construct mappings', async () => {
        const result = await getAtomString({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            generator: testGenerator,
            author: [{ name: "Test Author" }],
            entry: [
                {
                    title: "Republished Entry",
                    id: "https://example.com/item",
                    updated: "2023-10-02T00:00:00Z",
                    link: [{ href: "https://example.com/item", rel: "alternate" }],
                    source: {
                        id: "https://example.com/source",
                        title: { value: "<em>Source Feed</em>", type: "html" },
                        updated: "2023-10-01T12:00:00Z",
                        subtitle: { value: "<p><strong>Source Subtitle</strong></p>", type: "xhtml" },
                        rights: { value: "<p>Source rights</p>", type: "html" },
                        author: [{ name: "Source Author" }],
                        contributor: [{ name: "Source Contributor" }],
                        link: [{ href: "/source", rel: "self", length: 1234 }],
                        category: [{ term: "republished", label: "Republished" }],
                        generator: {
                            value: "Source Generator",
                            uri: "urn:example:source-generator",
                            version: "1.0",
                        },
                    },
                },
            ],
        });

        expect(result).toMatchSnapshot();
    });

    test('serializes content variants according to Atom rules', async () => {
        const result = await getAtomString({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            generator: testGenerator,
            author: [{ name: "Test Author" }],
            entry: [
                {
                    title: "XML Entry",
                    id: "https://example.com/xml",
                    updated: "2023-10-02T00:00:00Z",
                    content: { value: "<widget><part>Hi</part></widget>", type: "application/xml" },
                    link: [{ href: "https://example.com/xml", rel: "alternate" }],
                },
                {
                    title: "Binary Entry",
                    id: "https://example.com/binary",
                    updated: "2023-10-01T00:00:00Z",
                    content: { value: "hello", type: "application/octet-stream" },
                    link: [{ href: "https://example.com/binary", rel: "alternate" }],
                },
                {
                    title: "External Content Entry",
                    id: "https://example.com/external",
                    updated: "2023-10-03T00:00:00Z",
                    summary: "External content summary",
                    content: { src: "https://example.com/body.html", type: "text/html" },
                    link: [{ href: "https://example.com/external", rel: "alternate" }],
                },
                {
                    title: "Base Entry",
                    id: "https://example.com/base",
                    updated: "2023-10-04T00:00:00Z",
                    content: { value: "<p>Body</p>", type: "html", base: "https://cdn.example.com/articles/" },
                    link: [{ href: "https://example.com/base", rel: "alternate" }],
                },
            ],
        });

        expect(result).toMatchSnapshot();
    });

    test('declares the media namespace once at the feed level when thumbnails are included', async () => {
        const result = await getAtomString({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            generator: testGenerator,
            author: [{ name: "Test Author" }],
            entry: [
                {
                    title: "Thumbnail Entry",
                    id: "https://example.com/item",
                    updated: "2023-10-01T00:00:00Z",
                    link: [{ href: "https://example.com/item", rel: "alternate" }],
                    thumbnail: {
                        url: "https://example.com/thumbnail.png"
                    }
                },
            ],
        });

        expect(result).toMatchSnapshot();
        expect((result.match(/xmlns:media=/g) ?? [])).toHaveLength(1);
    });
});

describe('Atom compliance validation', () => {
    test('accepts RFC 3339 timestamps for feed and entry date fields', async () => {
        const feed = createValidFeed();
        feed.updated = "2023-10-01T00:00:00+02:00";
        feed.entry[0].updated = "2023-10-01T00:00:00Z";
        feed.entry[0].published = "2023-09-30T23:59:59.123Z";
        feed.entry[0].source!.updated = "2023-09-30T23:00:00-07:00";

        const result = await getAtomString(feed);

        expect(result).toContain("<updated>2023-10-01T00:00:00+02:00</updated>");
        expect(result).toContain("<published>2023-09-30T23:59:59.123Z</published>");
        expect(result).toContain("<updated>2023-09-30T23:00:00-07:00</updated>");
    });

    test.each([
        ["updated", (feed: AtomFeedOptions) => { feed.updated = "2023-10-01"; }],
        ["entry.0.updated", (feed: AtomFeedOptions) => { feed.entry[0].updated = "2023-10-01 00:00:00Z"; }],
        ["entry.0.published", (feed: AtomFeedOptions) => { feed.entry[0].published = "2023-10-01T00:00:00"; }],
        ["entry.0.source.updated", (feed: AtomFeedOptions) => { feed.entry[0].source!.updated = "not-a-date"; }],
    ])('rejects non-RFC3339 timestamps for %s', async (path, mutateFeed) => {
        const feed = createValidFeed();
        mutateFeed(feed);

        await expect(getAtomString(feed)).rejects.toThrow(path);
    });

    test('rejects content objects that mix src with an inline value', async () => {
        const parsed = await atomSchema.safeParseAsync({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            author: [{ name: "Test Author" }],
            entry: [
                {
                    title: "Invalid Content Entry",
                    id: "https://example.com/invalid-content",
                    updated: "2023-10-02T00:00:00Z",
                    content: {
                        src: "https://example.com/body.html",
                        type: "text/html",
                        value: "<p>Should not be inline</p>",
                    },
                    link: [{ href: "https://example.com/invalid-content", rel: "alternate" }],
                },
            ],
        });

        expect(parsed.success).toBe(false);
    });

    test('allows entries to satisfy Atom author requirements directly or via source', async () => {
        const result = await getAtomString({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            entry: [
                {
                    title: "Direct Author Entry",
                    id: "https://example.com/direct-author",
                    updated: "2023-10-02T00:00:00Z",
                    author: [{ name: "Entry Author" }],
                    link: [{ href: "https://example.com/direct-author", rel: "alternate" }],
                },
                {
                    title: "Source Author Entry",
                    id: "https://example.com/source-author",
                    updated: "2023-10-03T00:00:00Z",
                    source: {
                        id: "https://example.com/source",
                        title: "Source Feed",
                        updated: "2023-10-01T00:00:00Z",
                        author: [{ name: "Source Author" }],
                    },
                    link: [{ href: "https://example.com/source-author", rel: "alternate" }],
                },
            ],
        });

        expect(result).toContain("<name>Entry Author</name>");
        expect(result).toContain("<name>Source Author</name>");
    });

    test('rejects feeds whose entries lack any Atom author source', async () => {
        try {
            await getAtomString({
                title: "Test Feed",
                id: "https://example.com/",
                updated: "2023-10-01T00:00:00Z",
                entry: [
                    {
                        title: "Missing Author Entry",
                        id: "https://example.com/missing-author",
                        updated: "2023-10-02T00:00:00Z",
                        link: [{ href: "https://example.com/missing-author", rel: "alternate" }],
                    },
                ],
            });

            throw new Error("Expected author validation to fail");
        } catch (error) {
            if (!(error instanceof Error)) {
                throw error;
            }

            expect(error.message).toContain("entry.0.author");
            expect(error.message).toContain("(author)");
        }
    });
});

describe('Atom response headers', () => {
    test('uses the Atom media type for feed responses by default', async () => {
        const response = await getAtomResponse({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            author: [{ name: "Test Author" }],
            entry: [],
        });

        expect(response.headers.get("Content-Type")).toBe("application/atom+xml; charset=utf-8");
    });

    test('can fall back to the legacy XML media type for feed responses', async () => {
        const response = await getAtomResponse({
            title: "Test Feed",
            id: "https://example.com/",
            updated: "2023-10-01T00:00:00Z",
            author: [{ name: "Test Author" }],
            entry: [],
            useLegacyXmlContentType: true,
        });

        expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");
    });
});
