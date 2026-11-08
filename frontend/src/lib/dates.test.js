import { describe, expect, it } from "vitest";
import { parseTime } from "./dates";

describe("parseTime", () => {
    it.each([
        ["14:30", "14:30"],
        ["14.30", "14:30"],
        ["9:5", "09:05"],
        ["1430", "14:30"],
        ["930", "09:30"],
        ["9", "09:00"],
        ["0", "00:00"],
        [" 7:45 ", "07:45"],
    ])("reads %s as %s", (text, expected) => {
        expect(parseTime(text)).toBe(expected);
    });

    it.each(["24:00", "12:60", "2460", "abc", "", "12345", "1:2:3"])("rejects %s", (text) => {
        expect(parseTime(text)).toBeNull();
    });
});
