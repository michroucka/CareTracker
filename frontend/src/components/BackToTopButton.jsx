import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { ChevronUp } from "lucide-react";

/**
 * Floating back to top button that appears after scrolling
 * @param {number} scrollThreshold - Scroll position (px) to show button (default: 300)
 * @param {string} position - CSS classes for position (default: "bottom-20 right-10")
 * @param {string} color - Button color (default: "default")
 * @param {string} variant - Button variant (default: "flat")
 */
export function BackToTopButton({
    scrollThreshold = 300,
    position = "bottom-20 right-10",
    color = "default",
    variant = "flat"
}) {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowButton(window.scrollY > scrollThreshold);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrollThreshold]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className={`fixed ${position} z-50 transition-all duration-300 ${
            showButton
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
            <Button
                isIconOnly
                color={color}
                variant={variant}
                className="shadow-lg"
                onPress={scrollToTop}
                aria-label="Zpět nahoru"
            >
                <ChevronUp size={24} />
            </Button>
        </div>
    );
}
