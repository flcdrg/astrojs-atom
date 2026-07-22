import atom, { getAtomResponse } from '../src/index';
import { expect, test } from "vitest";

test('getAromResponse is usable both as an explicit import and in @astrojs/rss-compatible fasion', () => {
    expect(atom).toStrictEqual(getAtomResponse);
});
