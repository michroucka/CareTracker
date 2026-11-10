import React from "react";
import { useNavigate } from "react-router-dom";
import { IconBuildingCommunity, IconHeartHandshake, IconIdBadge2, IconSearch, IconUserCircle } from "@tabler/icons-react";
import { getJSON } from "@/api/api.js";
import { Button } from "@/components/ui/button";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { getRoleLabel, hasRole, ROLES } from "@/constants/roles";
import { useAuth } from "@/contexts/AuthContext";
import { removeDiacritics } from "@/utils/formatters";
import { NAV_ITEMS } from "./navigation";

const STAFF = [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.CAREGIVER];
const RESULT_LIMIT = 8;

/** Diacritics-insensitive match on the item's keywords; names starting with the query rank first. */
function filterItems(value, search, keywords = []) {
    const query = removeDiacritics(search.trim());
    if (!query) return 1;
    const haystack = removeDiacritics(keywords.join(" "));
    if (haystack.startsWith(query)) return 1;
    return haystack.includes(query) ? 0.5 : 0;
}

function matches(keywords, search) {
    return filterItems("", search, keywords) > 0;
}

/**
 * Loads searchable records once, on the first opening. SUPERADMIN gets organizations only,
 * never client records; CLIENT searches pages only.
 */
function useSearchRecords(isOpen, role) {
    const [records, setRecords] = React.useState({ clients: [], employees: [], organizations: [] });
    const hasLoadedRef = React.useRef(false);

    React.useEffect(() => {
        if (!isOpen || hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        const load = async () => {
            try {
                if (role === ROLES.SUPERADMIN) {
                    const organizations = await getJSON("/organizations?status=true");
                    setRecords((previous) => ({ ...previous, organizations }));
                } else if (STAFF.includes(role)) {
                    const [clients, employees] = await Promise.all([
                        getJSON("/clients?status=true"),
                        getJSON("/employees?status=true"),
                    ]);
                    setRecords((previous) => ({ ...previous, clients, employees }));
                }
            } catch (error) {
                // search still works for pages; the error is not worth interrupting the user
                console.error("Search data could not be loaded:", error);
            }
        };
        load();
    }, [isOpen, role]);

    return records;
}

export function CommandPalette() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const { clients, employees, organizations } = useSearchRecords(isOpen, user.role);
    const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

    React.useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const openChange = (open) => {
        setIsOpen(open);
        if (!open) setSearch("");
    };

    const go = (path) => {
        openChange(false);
        navigate(path);
    };

    const pages = NAV_ITEMS.filter((item) => hasRole(user.role, item.allowedRoles));
    const hasQuery = search.trim().length > 0;
    // only the first few matches are rendered, the lists can have hundreds of records
    const clientResults = hasQuery
        ? clients.filter((c) => matches([`${c.firstName} ${c.lastName}`, `${c.lastName} ${c.firstName}`, c.city ?? ""], search)).slice(0, RESULT_LIMIT)
        : [];
    const employeeResults = hasQuery
        ? employees.filter((e) => matches([`${e.firstName} ${e.lastName}`, `${e.lastName} ${e.firstName}`], search)).slice(0, RESULT_LIMIT)
        : [];
    const organizationResults = hasQuery ? organizations.filter((o) => matches([o.name], search)).slice(0, RESULT_LIMIT) : [];

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsOpen(true)}
                className="ml-auto h-9 w-56 justify-start gap-2 px-3 font-normal text-muted-foreground max-md:w-9 max-md:justify-center max-md:px-0"
            >
                <IconSearch className="size-4" />
                <span className="max-md:sr-only">Hledat…</span>
                <kbd aria-hidden="true" className="ml-auto rounded border bg-muted px-1.5 font-sans text-[11px] max-md:hidden">{isMac ? "⌘K" : "Ctrl K"}</kbd>
            </Button>

            <CommandDialog open={isOpen} onOpenChange={openChange} commandProps={{ filter: filterItems }}>
                <CommandInput
                    value={search}
                    onValueChange={setSearch}
                    placeholder={user.role === ROLES.SUPERADMIN ? "Hledat stránku nebo organizaci…" : STAFF.includes(user.role) ? "Hledat klienta, zaměstnance nebo stránku…" : "Hledat stránku…"}
                />
                <CommandList>
                    <CommandEmpty>Nic jsme nenašli.</CommandEmpty>

                    {clientResults.length > 0 && (
                        <CommandGroup heading="Klienti">
                            {clientResults.map((client) => (
                                <CommandItem
                                    key={`client-${client.id}`}
                                    value={`client-${client.id}`}
                                    keywords={[`${client.firstName} ${client.lastName}`]}
                                    onSelect={() => go(`/clients/${client.id}`)}
                                >
                                    <IconHeartHandshake />
                                    <span className="flex-1 truncate">{client.firstName} {client.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{client.city}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {employeeResults.length > 0 && (
                        <CommandGroup heading="Zaměstnanci">
                            {employeeResults.map((employee) => (
                                <CommandItem
                                    key={`employee-${employee.id}`}
                                    value={`employee-${employee.id}`}
                                    keywords={[`${employee.firstName} ${employee.lastName}`]}
                                    onSelect={() => go(`/employees?detail=${employee.id}`)}
                                >
                                    <IconIdBadge2 />
                                    <span className="flex-1 truncate">{employee.firstName} {employee.lastName}</span>
                                    <span className="text-xs text-muted-foreground">{getRoleLabel(employee.role)}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {organizationResults.length > 0 && (
                        <CommandGroup heading="Organizace">
                            {organizationResults.map((organization) => (
                                <CommandItem
                                    key={`organization-${organization.id}`}
                                    value={`organization-${organization.id}`}
                                    keywords={[organization.name]}
                                    onSelect={() => go(`/organizations?search=${encodeURIComponent(organization.name)}`)}
                                >
                                    <IconBuildingCommunity />
                                    <span className="truncate">{organization.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    <CommandGroup heading="Stránky">
                        {pages.map((page) => {
                            const PageIcon = page.icon;
                            return (
                                <CommandItem key={page.path} value={`page-${page.path}`} keywords={[page.name]} onSelect={() => go(page.path)}>
                                    <PageIcon />
                                    <span>{page.name}</span>
                                </CommandItem>
                            );
                        })}
                        <CommandItem value="page-/account" keywords={["Můj účet"]} onSelect={() => go("/account")}>
                            <IconUserCircle />
                            <span>Můj účet</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
