import getAtomResponse, { atomSchema, getAtomString, type AtomFeedOptions } from "../src/index";
import { expect, test } from "vitest";

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

test('generates valid Atom feed', async () => {
    const result = await getAtomString({
        generator: {
            value: "Test Generator",
            uri: "https://example.com/generator",
            version: "1.0",
        },
        title: "Test Feed",
        subtitle: "Test Description",
        id: "https://example.com/",
        updated: '2023-10-01T00:00:00Z',
        author: [{ name: "Test Author", email: "test@example.com" }],
        link: [{ href: "https://example.com/", rel: "self" }],
        lang: "en-AU", // Add language attribute
        category: [{ term: "Test" }],
        contributor: [{ name: "Test Contributor" }],
        rights: "All rights reserved.",
        icon: "https://example.com/icon.png",
        logo: "https://example.com/logo.png",
        entry: [
            {
                title: {
                    value: "Test Item",
                    type: "html",
                },
                id: "https://example.com/item",
                updated: '2023-10-01T00:00:00Z',
                content: "This is a test item.",
                summary: {
                    value: "This is a summary of the test item.",
                    type: "html",},
                author: [{ name: "Test Item Author", email: "itemauthor@example.com" }],
                link: [{ href: "https://example.com/item", rel: "alternate" }],
                category: [{ term: "Test Item" }],
                thumbnail: {
                    url: "https://example.com/thumbnail.png"
                }

            },
            {
                title: "Test Item 2",
                id: "https://example.com/item2",
                updated: '2023-10-02T00:00:00Z',
                content: {
                    value: "<p>This is another <em>test</em> item.</p>",
                    type: "html",
                },
                link: [{ href: "https://example.com/item2", rel: "alternate" }],
                category: [{ term: "Test Item 2" }],
            },
            {
                title: "Test Item 3",
                id: "https://example.com/item3",
                updated: '2024-10-03T00:00:00Z',
                content: "This is the latest test item.",
                link: [{ href: "https://example.com/item3", rel: "alternate" }],
                category: [{ term: "Test Item" }],
            },
        ]});
    
    await expect(result).toMatchFileSnapshot("testFeed.xml");

    // Additional assertions to specifically test xml:lang attribute
    expect(result).toContain('xml:lang="en-AU"');
});

test('preserves entry input order by default', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [
            {
                title: "First Entry",
                id: "https://example.com/first",
                updated: "2023-10-01T00:00:00Z",
                link: [{ href: "https://example.com/first", rel: "alternate" }],
            },
            {
                title: "Newest Entry",
                id: "https://example.com/newest",
                updated: "2023-10-03T00:00:00Z",
                link: [{ href: "https://example.com/newest", rel: "alternate" }],
            },
            {
                title: "Middle Entry",
                id: "https://example.com/middle",
                updated: "2023-10-02T00:00:00Z",
                link: [{ href: "https://example.com/middle", rel: "alternate" }],
            },
        ],
    });

    expect(result.indexOf("<title>First Entry</title>")).toBeLessThan(result.indexOf("<title>Newest Entry</title>"));
    expect(result.indexOf("<title>Newest Entry</title>")).toBeLessThan(result.indexOf("<title>Middle Entry</title>"));
});

test('can sort entries by updated descending when requested', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        sortEntriesByUpdated: true,
        entry: [
            {
                title: "First Entry",
                id: "https://example.com/first",
                updated: "2023-10-01T00:00:00Z",
                link: [{ href: "https://example.com/first", rel: "alternate" }],
            },
            {
                title: "Newest Entry",
                id: "https://example.com/newest",
                updated: "2023-10-03T00:00:00Z",
                link: [{ href: "https://example.com/newest", rel: "alternate" }],
            },
            {
                title: "Middle Entry",
                id: "https://example.com/middle",
                updated: "2023-10-02T00:00:00Z",
                link: [{ href: "https://example.com/middle", rel: "alternate" }],
            },
        ],
    });

    expect(result.indexOf("<title>Newest Entry</title>")).toBeLessThan(result.indexOf("<title>Middle Entry</title>"));
    expect(result.indexOf("<title>Middle Entry</title>")).toBeLessThan(result.indexOf("<title>First Entry</title>"));
});

test('serializes html text constructs and content as escaped text', async () => {
    const result = await getAtomString({
        title: { value: "<em>Feed</em>", type: "html" },
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [
            {
                title: { value: "<strong>Entry</strong>", type: "html" },
                id: "https://example.com/item",
                updated: "2023-10-01T00:00:00Z",
                summary: { value: "<p>Summary</p>", type: "html" },
                content: { value: "<p>Body</p>", type: "html" },
                link: [{ href: "https://example.com/item", rel: "alternate" }],
            },
        ],
    });

    expect(result).toContain('<title type="html">&lt;em&gt;Feed&lt;/em&gt;</title>');
    expect(result).toContain('<summary type="html">&lt;p&gt;Summary&lt;/p&gt;</summary>');
    expect(result).toContain('<content type="html">&lt;p&gt;Body&lt;/p&gt;</content>');
    expect(result).not.toContain("<![CDATA[");
});

test('serializes html subtitle text constructs as escaped text', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        subtitle: { value: "<p>Subtitle</p>", type: "html" },
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [],
    });

    expect(result).toContain('<subtitle type="html">&lt;p&gt;Subtitle&lt;/p&gt;</subtitle>');
});

test('wraps xhtml subtitle text constructs in an XHTML div', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        subtitle: { value: "<p><strong>Subtitle</strong></p>", type: "xhtml" },
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [],
    });

    expect(result).toContain('<subtitle type="xhtml">');
    expect(result).toContain('<div xmlns="http://www.w3.org/1999/xhtml">');
    expect(result).toContain("<strong>Subtitle</strong>");
});

test('serializes source metadata with the same Atom construct mappings', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
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

    expect(result).toContain('<title type="html">&lt;em&gt;Source Feed&lt;/em&gt;</title>');
    expect(result).toContain('<subtitle type="xhtml">');
    expect(result).toContain('<div xmlns="http://www.w3.org/1999/xhtml">');
    expect(result).toContain('<rights type="html">&lt;p&gt;Source rights&lt;/p&gt;</rights>');
    expect(result).toContain('<generator uri="urn:example:source-generator" version="1.0">Source Generator</generator>');
    expect(result).toContain('<link href="/source" rel="self" length="1234"/>');
    expect(result).toContain('<category term="republished" label="Republished"/>');
    expect(result).not.toContain('<title><value>');
    expect(result).not.toContain('<subtitle><value>');
    expect(result).not.toContain('<rights><value>');
    expect(result).not.toContain('<generator><value>');
});

test('wraps xhtml text constructs and content in an XHTML div', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [
            {
                title: { value: "<p><em>Entry</em></p>", type: "xhtml" },
                id: "https://example.com/item",
                updated: "2023-10-01T00:00:00Z",
                summary: { value: "<p>Summary</p>", type: "xhtml" },
                content: { value: "<p><strong>Body</strong></p>", type: "xhtml" },
                link: [{ href: "https://example.com/item", rel: "alternate" }],
            },
        ],
    });

    expect(result).toContain('<title type="xhtml">');
    expect(result).toContain('<summary type="xhtml">');
    expect(result).toContain('<content type="xhtml">');
    expect(result).toContain('<div xmlns="http://www.w3.org/1999/xhtml">');
    expect(result).toContain("<strong>Body</strong>");
});

test('inlines xml content and base64-encodes binary content', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
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
        ],
    });

    expect(result).toContain('<content type="application/xml">');
    expect(result).toContain("<widget>");
    expect(result).toContain("<part>Hi</part>");
    expect(result).toContain('<content type="application/octet-stream">aGVsbG8=</content>');
});

test('supports external content via src without requiring an inline value', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [
            {
                title: "External Content Entry",
                id: "https://example.com/external",
                updated: "2023-10-02T00:00:00Z",
                summary: "External content summary",
                content: { src: "https://example.com/body.html", type: "text/html" },
                link: [{ href: "https://example.com/external", rel: "alternate" }],
            },
        ],
    });

    expect(result).toContain('<content src="https://example.com/body.html" type="text/html"/>');
});

test('serializes xml:base on content only when explicitly provided', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        entry: [
            {
                title: "Inline Base Entry",
                id: "https://example.com/inline-base",
                updated: "2023-10-02T00:00:00Z",
                content: { value: "<p>Body</p>", type: "html", base: "https://cdn.example.com/articles/" },
                link: [{ href: "https://example.com/inline-base", rel: "alternate" }],
            },
            {
                title: "External Base Entry",
                id: "https://example.com/external-base",
                updated: "2023-10-03T00:00:00Z",
                content: { src: "body.html", type: "text/html", base: "https://cdn.example.com/articles/" },
                link: [{ href: "https://example.com/external-base", rel: "alternate" }],
            },
        ],
    });

    expect(result).toContain('<content type="html" xml:base="https://cdn.example.com/articles/">&lt;p&gt;Body&lt;/p&gt;</content>');
    expect(result).toContain('<content src="body.html" type="text/html" xml:base="https://cdn.example.com/articles/"/>');
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

test('accepts Atom URI references and non-URL URIs for Atom fields', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "urn:uuid:60a76c80-d399-11d9-b93c-0003939e0af6",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author", uri: "tag:example.com,2026:test-author" }],
        generator: {
            value: "Test Generator",
            uri: "urn:example:generator",
        },
        link: [{ href: "/feed", rel: "self" }],
        entry: [
            {
                title: "Relative Link Entry",
                id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
                updated: "2023-10-02T00:00:00Z",
                summary: "External content summary",
                content: { src: "/content/full.html", type: "text/html" },
                link: [{ href: "../entries/relative-link-entry", rel: "alternate" }],
            },
        ],
    });

    expect(result).toContain('<uri>tag:example.com,2026:test-author</uri>');
    expect(result).toContain('<generator uri="urn:example:generator">Test Generator</generator>');
    expect(result).toContain('<link href="/feed" rel="self"/>');
    expect(result).toContain('<content src="/content/full.html" type="text/html"/>');
    expect(result).toContain('<link href="../entries/relative-link-entry" rel="alternate"/>');
});

test('rejects malformed URI references for Atom URI fields', async () => {
    await expect(getAtomString({
        title: "Test Feed",
        id: "urn:uuid:60a76c80-d399-11d9-b93c-0003939e0af6",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author", uri: "not a uri" }],
        link: [{ href: "/feed", rel: "self" }],
        entry: [],
    })).rejects.toThrow("author.0.uri");

    await expect(getAtomString({
        title: "Test Feed",
        id: "urn:uuid:60a76c80-d399-11d9-b93c-0003939e0af6",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        link: [{ href: "http://exa mple.com", rel: "self" }],
        entry: [],
    })).rejects.toThrow("link.0.href");
});

test('accepts numeric byte lengths for Atom links', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        link: [{ href: "/feed", rel: "self", length: 1234 }],
        entry: [
            {
                title: "Linked Entry",
                id: "https://example.com/item",
                updated: "2023-10-02T00:00:00Z",
                link: [{ href: "https://example.com/item", rel: "alternate", length: "5678" }],
            },
        ],
    });

    expect(result).toContain('<link href="/feed" rel="self" length="1234"/>');
    expect(result).toContain('<link href="https://example.com/item" rel="alternate" length="5678"/>');
});

test('rejects non-numeric Atom link lengths', async () => {
    await expect(getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        link: [{ href: "/feed", rel: "self", length: "12 bytes" }],
        entry: [],
    })).rejects.toThrow("link.0.length");

    await expect(getAtomString({
        title: "Test Feed",
        id: "https://example.com/",
        updated: "2023-10-01T00:00:00Z",
        author: [{ name: "Test Author" }],
        link: [{ href: "/feed", rel: "self", length: -1 }],
        entry: [],
    })).rejects.toThrow("link.0.length");
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
