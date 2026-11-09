package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.entity.Organization;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

/** Fetches Czech payment QR code images from the external Paylibo API. */
@Component
public class PaymentQrClient {
    private static final Logger log = LoggerFactory.getLogger(PaymentQrClient.class);
    private static final String PAYLIBO_URL = "https://api.paylibo.com/paylibo/generator/czech/image";

    private final RestClient restClient = RestClient.create();

    /** Bank account of an organization as plain values, safe to use outside the JPA session (parallel QR fetching). */
    public record PaymentAccount(String prefix, String number, String bankCode) {
        public static PaymentAccount of(Organization organization) {
            return new PaymentAccount(organization.getAccountPrefix(), organization.getAccountNumber(), organization.getBankCode());
        }
    }

    /**
     * Returns the QR code PNG for the payment, or {@code null} if bank details are missing or the request fails,
     * so a receipt is still produced when the API is down.
     */
    public byte[] fetchPng(PaymentAccount account, int amount, String variableSymbol) {
        if (account.number() == null || account.bankCode() == null) {
            return null;
        }
        try {
            UriComponentsBuilder uri = UriComponentsBuilder.fromUriString(PAYLIBO_URL)
                    .queryParam("accountNumber", account.number())
                    .queryParam("bankCode", account.bankCode())
                    .queryParam("amount", (double) amount)
                    .queryParam("currency", "CZK")
                    .queryParam("vs", variableSymbol)
                    .queryParam("size", 150);
            if (account.prefix() != null) {
                uri.queryParam("accountPrefix", account.prefix());
            }
            return restClient.get()
                    .uri(uri.toUriString())
                    .retrieve()
                    .body(byte[].class);
        } catch (Exception e) {
            log.warn("Nepodařilo se vygenerovat QR kód platby: {}", e.getMessage());
            return null;
        }
    }
}
