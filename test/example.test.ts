import { get } from "http";
import { AtomFeedItem, atomSchema, getAtomString } from "../src/index";
import { expect, test } from "vitest";

export function sum(a, b) {
    return a + b
  }

test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3)
  });

test('can parse item', () => {
    const atomItem = {
        title: "Test Title",
        description: "Test Description",
        updated: new Date().toISOString(),
        categories: ["test", "example"],

    };
    const result = atomSchema.safeParse(atomItem);
    expect(result.success).toBe(true);
});

test('generates valid Atom feed', async () => {
    const result = await getAtomString({
        title: "Test Feed",
        description: "Test Description",
        site: "https://example.com",
        items: [
            {
                title: "Test Item",
                description: "Test Description",
                updated: new Date().toISOString(),
                categories: ["test", "example"],
            },
        ]});
    
    expect(result).toMatchFileSnapshot("testFeed.xml");
});