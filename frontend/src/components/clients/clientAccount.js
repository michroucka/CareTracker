/** Client account state from `userAccountActive`: null = no account, true = active, false = blocked. */
export function clientAccountState(client) {
    if (client.userAccountActive == null) return { variant: "outline", label: "Bez účtu" };
    return client.userAccountActive ? { variant: "success", label: "Aktivní účet" } : { variant: "danger", label: "Zablokovaný účet" };
}
