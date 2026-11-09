/**
 * Client account state for badges. `userAccountActive`: null = no account, true = active, false = blocked;
 * `userAccountActivated`: false while the client has not finished activation from the e-mail.
 */
export function clientAccountState(client) {
    if (client.userAccountActive == null) return { variant: "outline", label: "Bez účtu" };
    if (!client.userAccountActive) return { variant: "danger", label: "Zablokovaný účet" };
    if (client.userAccountActivated === false) return { variant: "pending", label: "Čeká na aktivaci" };
    return { variant: "success", label: "Aktivní účet" };
}

export function canResendClientActivation(client) {
    return client.userAccountActive != null && client.userAccountActivated === false;
}
