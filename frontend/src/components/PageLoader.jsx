import { CareTrackerLogo } from "@/components/CareTrackerLogo";

/**
 * Full-screen loading state shown while the session is being checked.
 */
export function PageLoader() {
    return (
        <div className="grid min-h-svh place-items-center bg-background" role="status" aria-label="Načítání">
            <CareTrackerLogo size="size-12" className="me-0 animate-pulse" />
        </div>
    );
}
