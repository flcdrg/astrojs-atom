import atom, { getAtomResponse } from "../src/index";
import { expect, test } from "vitest";

test('getAtomResponse is usable both as an explicit import and in @astrojs/rss-compatible fashion', () => {
    expect(atom).toBe(getAtomResponse);
});
