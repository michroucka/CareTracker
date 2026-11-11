package cz.zcu.kiv.caretracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Optional;

@Service
public class GeocodingService {
    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);
    // fixed host; the address and the key go in as URI variables, which RestTemplate encodes completely,
    // so "&", "=" or "#" typed in an address cannot add, change or cut off query parameters (GeocodingServiceTest)
    private static final String GEOCODE_URL = "https://api.mapy.com/v1/geocode?query={query}&lang=cs&limit=1&apikey={apiKey}";

    private final RestTemplate restTemplate;

    @Value("${app.mapy.api-key}")
    private String apiKey;

    public GeocodingService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public Optional<GeocodeResult> geocode(String street, String city, String postalCode) {
        String query = "%s, %s, %s".formatted(street, city, postalCode);

        try {
            GeocodeResponseDTO response = restTemplate.getForObject(GEOCODE_URL, GeocodeResponseDTO.class, query, apiKey);

            if (response == null || response.items().isEmpty()) {
                log.warn("No geocoding result found for query: {}", query);
                return Optional.empty();
            }

            Item best = response.items().getFirst();
            if (!"regional.address".equals(best.type())) {
                log.warn("Geocoding result for '{}' was not address-precise (type: {})", query, best.type());
                return Optional.empty();
            }

            return Optional.of(new GeocodeResult(best.position().lat(), best.position().lon()));
        } catch (RestClientException e) {
            log.error("Geocoding request failed for query '{}': {}", query, e.getMessage());
            return Optional.empty();
        }
    }

    public record GeocodeResult(double latitude, double longitude) {}

    private record GeocodeResponseDTO(List<Item> items) {}
    private record Item(String type, Position position) {}
    private record Position(double lat, double lon) {}
}
