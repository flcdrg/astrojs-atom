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
        entry: [
            {
                title: "Test Item",
                id: "https://example.com/item",
                updated: '2023-10-01T00:00:00Z',
                content: "This is a test item.",
                
            },
        ]});
    
    expect(result).toMatchFileSnapshot("testFeed.xml");
});