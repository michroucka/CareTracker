import logo from "../assets/ct_icon.svg";

export function CareTrackerLogo({ className = "", size = "size-8" }) {
    return (
        <img
            src={logo}
            alt="CareTracker Logo"
            className={`select-none me-1.5 ${size} ${className}`}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
}