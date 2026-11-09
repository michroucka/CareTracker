import { describe, expect, it } from "vitest";
import { pageCountOf } from "./pagination";

describe("pageCountOf", () => {
    it.each([
        [0, 20, 1],
        [1, 20, 1],
        [20, 20, 1],
        [21, 20, 2],
        [40, 20, 2],
        [41, 20, 3],
        [5, 1, 5],
    ])("%i items with page size %i → %i pages", (totalCount, pageSize, expected) => {
        expect(pageCountOf(totalCount, pageSize)).toBe(expected);
    });
});
