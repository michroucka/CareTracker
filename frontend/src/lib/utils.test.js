import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
    it("joins classes and skips falsy values", () => {
        expect(cn("a", false, null, undefined, "c")).toBe("a c");
    });

    it("accepts conditional objects", () => {
        expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });

    it("lets the later Tailwind class win a conflict", () => {
        expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
    });
});
