import {
    IconBuilding,
    IconBuildingCommunity,
    IconChartBar,
    IconClipboardCheck,
    IconHome,
    IconListCheck,
    IconUser,
    IconUsers,
} from "@tabler/icons-react";
import { ROLES } from "@/constants/roles";

const STAFF = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER];

export const NAV_ITEMS = [
    { name: "Nástěnka", path: "/", icon: IconHome, allowedRoles: STAFF },
    { name: "Klienti", path: "/clients", icon: IconUsers, allowedRoles: STAFF },
    { name: "Provedené úkony", path: "/performed-tasks", icon: IconClipboardCheck, allowedRoles: STAFF },
    { name: "Zaměstnanci", path: "/employees", icon: IconUser, allowedRoles: STAFF },
    { name: "Úkony", path: "/tasks", icon: IconListCheck, allowedRoles: STAFF },
    { name: "Střediska", path: "/departments", icon: IconBuilding, allowedRoles: [ROLES.SUPERADMIN, ROLES.ADMIN] },
    { name: "Organizace", path: "/organizations", icon: IconBuildingCommunity, allowedRoles: [ROLES.SUPERADMIN] },
    { name: "Měsíční přehled", path: "/monthly-report", icon: IconChartBar, allowedRoles: [ROLES.CLIENT] },
];

export function isNavItemActive(itemPath, pathname) {
    return itemPath === "/" ? pathname === "/" : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

const PAGE_LABELS = {
    "/account": "Můj účet",
    "/dev/components": "Katalog komponent",
};

/**
 * Breadcrumb trail for the app header. Each crumb has a `label`; all but the last also have `to`.
 */
export function getBreadcrumbs(pathname) {
    const clientMatch = pathname.match(/^\/clients\/(\d+)(\/individual-plan)?$/);
    if (pathname === "/clients/new") {
        return [{ label: "Klienti", to: "/clients" }, { label: "Nový klient" }];
    }
    if (clientMatch) {
        const clientPath = `/clients/${clientMatch[1]}`;
        return clientMatch[2]
            ? [{ label: "Klienti", to: "/clients" }, { label: "Detail klienta", to: clientPath }, { label: "Individuální plán" }]
            : [{ label: "Klienti", to: "/clients" }, { label: "Detail klienta" }];
    }

    const navItem = NAV_ITEMS.find((item) => isNavItemActive(item.path, pathname));
    return [{ label: navItem?.name ?? PAGE_LABELS[pathname] ?? "CareTracker" }];
}
