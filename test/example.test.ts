import getAtomResponse, { getAtomString, type AtomFeedOptions } from "../src/index";
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
    expect(result).toContain('<content type="html" xml:base="https://example.com/item">&lt;p&gt;Body&lt;/p&gt;</content>');
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
    expect(result).toContain('<content type="xhtml" xml:base="https://example.com/item">');
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

    expect(result).toContain('<content type="application/xml" xml:base="https://example.com/xml">');
    expect(result).toContain("<widget>");
    expect(result).toContain("<part>Hi</part>");
    expect(result).toContain('<content type="application/octet-stream" xml:base="https://example.com/binary">aGVsbG8=</content>');
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
