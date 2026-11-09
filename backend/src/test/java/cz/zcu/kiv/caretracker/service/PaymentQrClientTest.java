package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.service.PaymentQrClient.PaymentAccount;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNull;

/** Without a complete bank account there is nothing to pay to, so the external API is not called at all. */
class PaymentQrClientTest {

    private final PaymentQrClient client = new PaymentQrClient();

    @Test
    void noQrCodeWithoutAccountNumber() {
        assertNull(client.fetchPng(new PaymentAccount("19", null, "0100"), 300, "2611000123"));
    }

    @Test
    void noQrCodeWithoutBankCode() {
        assertNull(client.fetchPng(new PaymentAccount("19", "123456789", null), 300, "2611000123"));
    }
}
