import { atomSchema, getAtomString } from "../src/index";
import { expect, test } from "vitest";

test('generates valid Atom feed', async () => {
    const result = await getAtomString({
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
                title: "Test Item",
                id: "https://example.com/item",
                updated: '2023-10-01T00:00:00Z',
                content: "This is a test item.",
                summary: "This is a summary of the test item.",
                author: [{ name: "Test Item Author", email: "itemauthor@example.com" }],
                link: [{ href: "https://example.com/item", rel: "alternate" }],
                category: [{ term: "Test Item" }],

            },
            {
                title: "Test Item 2",
                id: "https://example.com/item2",
                updated: '2023-10-02T00:00:00Z',
                content: "This a newer test item.",
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