import { getAtomString } from "../src/index";
import { expect, test } from "vitest";

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
        lang: "en-AU",
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
                    type: "html",
                },
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
