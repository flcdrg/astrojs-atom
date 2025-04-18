import { AtomFeedItem, atomSchema } from "../src/index";
import { } from 'astro/zod'

describe("example test", () => {
    it("should be true", () => {
        expect(true).toBe(true);
    });

    it("should validate AtomFeedItem", () => {
        const item: AtomFeedItem = {
            title: "Example Title",
            description: "Example Description",
            updated: new Date().toISOString(),
            categories: ["example", "test"]
        };
        const result = atomSchema.safeParse(item);

        expect(result.success).toBe(true);
    });

});