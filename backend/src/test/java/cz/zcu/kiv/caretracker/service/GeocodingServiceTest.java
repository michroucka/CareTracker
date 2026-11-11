package cz.zcu.kiv.caretracker.service;

import cz.zcu.kiv.caretracker.service.GeocodingService.GeocodeResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** The address typed by a user goes to Mapy.com as one query value; it cannot add, change or cut off parameters. */
class GeocodingServiceTest {

    private static final String FOUND_ADDRESS = """
            {"items": [{"type": "regional.address", "position": {"lat": 49.7475, "lon": 13.3776}}]}
            """;

    private final GeocodingService geocodingService = new GeocodingService(new RestTemplateBuilder());
    private MockRestServiceServer mapyApi;
    private URI sentRequest;

    @BeforeEach
    void bindMapyApi() {
        ReflectionTestUtils.setField(geocodingService, "apiKey", "secret-key");
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(geocodingService, "restTemplate");
        mapyApi = MockRestServiceServer.bindTo(restTemplate).build();
        mapyApi.expect(request -> sentRequest = request.getURI())
                .andRespond(withSuccess(FOUND_ADDRESS, MediaType.APPLICATION_JSON));
    }

    @Test
    void findsTheAddressOnMapyCom() {
        Optional<GeocodeResult> result = geocodingService.geocode("Americká 12", "Plzeň", "301 00");

        assertThat(result).contains(new GeocodeResult(49.7475, 13.3776));
        assertThat(sentRequest.getHost()).isEqualTo("api.mapy.com");
        assertThat(queryParams(sentRequest)).containsEntry("query", "Americká 12, Plzeň, 301 00");
    }

    @Test
    void addressWithSpecialCharactersStaysOneQueryValue() {
        geocodingService.geocode("Americká 1&limit=100&apikey=stolen#", "Plzeň?x=1", "301 00");

        assertThat(sentRequest.getHost()).isEqualTo("api.mapy.com");
        assertThat(sentRequest.getRawFragment()).isNull();
        assertThat(queryParams(sentRequest)).containsExactlyInAnyOrderEntriesOf(Map.of(
                "query", "Americká 1&limit=100&apikey=stolen#, Plzeň?x=1, 301 00",
                "lang", "cs",
                "limit", "1",
                "apikey", "secret-key"));
    }

    private static Map<String, String> queryParams(URI uri) {
        return Arrays.stream(uri.getRawQuery().split("&"))
                .map(pair -> pair.split("=", 2))
                .collect(Collectors.toMap(
                        pair -> decode(pair[0]),
                        pair -> decode(pair[1]),
                        (first, duplicate) -> first + "|" + duplicate));
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
