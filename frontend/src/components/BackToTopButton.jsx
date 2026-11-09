import React from "react";
import { createPortal } from "react-dom";
import { IconArrowUp } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The app shell content scrolls on its own on desktop, the window on mobile. */
function findScrollRoot(element) {
    return element?.closest("[data-scroll-root]") ?? null;
}

/**
 * Floating "back to top" button for long pages; appears after scrolling past `threshold` px.
 * Rendered in a portal because the page transition wrapper uses transforms, which break `position: fixed`.
 */
export function BackToTopButton({ threshold = 600 }) {
    const anchorRef = React.useRef(null);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        const root = findScrollRoot(anchorRef.current);
        const update = () => setIsVisible(Math.max(root?.scrollTop ?? 0, window.scrollY) > threshold);
        root?.addEventListener("scroll", update, { passive: true });
        window.addEventListener("scroll", update, { passive: true });
        return () => {
            root?.removeEventListener("scroll", update);
            window.removeEventListener("scroll", update);
        };
    }, [threshold]);

    const scrollToTop = () => {
        findScrollRoot(anchorRef.current)?.scrollTo({ top: 0, behavior: "smooth" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <span ref={anchorRef} hidden />
            {createPortal(
                <div className={cn("fixed right-6 bottom-6 z-40 transition-[opacity,translate] duration-base ease-out", isVisible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0")}>
                    <Button variant="outline" size="icon" className="rounded-full bg-card shadow-md dark:bg-card dark:hover:bg-accent" onClick={scrollToTop} aria-label="Zpět nahoru" tabIndex={isVisible ? 0 : -1}>
                        <IconArrowUp />
                    </Button>
                </div>,
                document.body
            )}
        </>
    );
}
