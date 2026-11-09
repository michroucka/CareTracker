import {
    IconBuilding,
    IconBuildingCommunity,
    IconCalendarStats,
    IconClipboardCheck,
    IconHeartHandshake,
    IconIdBadge2,
    IconLayoutDashboard,
    IconListDetails,
} from "@tabler/icons-react";
import { ROLES } from "@/constants/roles";

const STAFF = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER];

export const NAV_ITEMS = [
    { name: "Nástěnka", path: "/", icon: IconLayoutDashboard, allowedRoles: STAFF },
    { name: "Klienti", path: "/clients", icon: IconHeartHandshake, allowedRoles: STAFF },
    { name: "Provedené úkony", path: "/performed-tasks", icon: IconClipboardCheck, allowedRoles: STAFF },
    { name: "Zaměstnanci", path: "/employees", icon: IconIdBadge2, allowedRoles: STAFF },
    { name: "Úkony", path: "/tasks", icon: IconListDetails, allowedRoles: STAFF },
    { name: "Střediska", path: "/departments", icon: IconBuilding, allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { name: "Organizace", path: "/organizations", icon: IconBuildingCommunity, allowedRoles: [ROLES.SUPERADMIN] },
    { name: "Měsíční přehled", path: "/monthly-report", icon: IconCalendarStats, allowedRoles: [ROLES.CLIENT] },
];

export function isNavItemActive(itemPath, pathname) {
    return itemPath === "/" ? pathname === "/" : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

const LIST_LOCATION_KEY_PREFIX = "listLocation:";
// opens a record sheet on top of the list, not part of what the user filtered
const TRANSIENT_LIST_PARAMS = ["detail"];

function isListPage(pathname) {
    return pathname !== "/" && NAV_ITEMS.some((item) => item.path === pathname);
}

/**
 * Remembers the last URL (with filters) of a list page from the main navigation for this browser tab,
 * so links back to the list restore what the user had selected.
 */
export function rememberListLocation(pathname, search) {
    if (!isListPage(pathname)) return;
    const params = new URLSearchParams(search);
    TRANSIENT_LIST_PARAMS.forEach((param) => params.delete(param));
    const query = params.toString();
    try {
        sessionStorage.setItem(LIST_LOCATION_KEY_PREFIX + pathname, query ? `${pathname}?${query}` : pathname);
    } catch {
        // without storage the link just leads to the unfiltered list
    }
}

/** Last remembered URL of the list page, or the plain list path. */
export function listLocation(listPath) {
    try {
        return sessionStorage.getItem(LIST_LOCATION_KEY_PREFIX + listPath) ?? listPath;
    } catch {
        return listPath;
    }
}

const PAGE_LABELS = {
    "/account": "Můj účet",
    "/dev/components": "Katalog komponent",
};

/**
 * Breadcrumb trail for the app header. Each crumb has a `label`; all but the last also have `to`.
 * Links to a list keep the filters the user last had there.
 */
export function getBreadcrumbs(pathname) {
    const clientsList = { label: "Klienti", to: listLocation("/clients") };
    const clientMatch = pathname.match(/^\/clients\/(\d+)(\/individual-plan)?$/);
    if (pathname === "/clients/new") {
        return [clientsList, { label: "Nový klient" }];
    }
    if (clientMatch) {
        const clientPath = `/clients/${clientMatch[1]}`;
        return clientMatch[2]
            ? [clientsList, { label: "Detail klienta", to: clientPath }, { label: "Individuální plán" }]
            : [clientsList, { label: "Detail klienta" }];
    }

    const navItem = NAV_ITEMS.find((item) => isNavItemActive(item.path, pathname));
    return [{ label: navItem?.name ?? PAGE_LABELS[pathname] ?? "CareTracker" }];
}
