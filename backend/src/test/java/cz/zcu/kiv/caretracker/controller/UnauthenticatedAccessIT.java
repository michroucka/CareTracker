package cz.zcu.kiv.caretracker.controller;

import cz.zcu.kiv.caretracker.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Every endpoint except login, logout, auth-status and the activation / password reset flow
 * requires a signed-in user; an anonymous request gets 401 before reaching the controller.
 */
class UnauthenticatedAccessIT extends AbstractIntegrationTest {

    private static final String PUBLIC_ACTIVATION_PREFIX = "/api/activation/";
    private static final Set<String> PUBLIC_PATHS = Set.of("/api/login", "/api/logout", "/api/auth-status");

    private static final List<String> PROTECTED_ENDPOINTS = List.of(
            "GET /api/dashboard",

            "GET /api/user/me",
            "PUT /api/user/me",
            "POST /api/user/forgot-password",
            "POST /api/user/me/picture",
            "DELETE /api/user/me/picture",

            "GET /api/organizations",
            "GET /api/organizations/{id}",
            "POST /api/organizations",
            "PUT /api/organizations/{id}",
            "PUT /api/organizations/{id}/terminate",
            "PUT /api/organizations/{id}/activate",

            "GET /api/departments",
            "GET /api/departments/{id}",
            "POST /api/departments",
            "PUT /api/departments/{id}",
            "PUT /api/departments/{id}/terminate",
            "PUT /api/departments/{id}/activate",

            "GET /api/employees",
            "GET /api/employees/{id}",
            "POST /api/employees",
            "PUT /api/employees/{id}",
            "PUT /api/employees/{id}/terminate",
            "PUT /api/employees/{id}/activate",
            "POST /api/employees/{id}/resend",
            "GET /api/employees/{id}/picture",
            "POST /api/employees/{id}/picture",
            "DELETE /api/employees/{id}/picture",

            "GET /api/tasks",
            "GET /api/tasks/{id}",
            "POST /api/tasks",
            "PUT /api/tasks/{id}",
            "PUT /api/tasks/{id}/terminate",
            "PUT /api/tasks/{id}/activate",

            "GET /api/clients",
            "GET /api/clients/{id}",
            "POST /api/clients",
            "PUT /api/clients/{id}",
            "PUT /api/clients/{id}/terminate",
            "PUT /api/clients/{id}/activate",
            "POST /api/clients/{id}/account/create",
            "POST /api/clients/{id}/account/resend",
            "PUT /api/clients/{id}/account/deactivate",
            "PUT /api/clients/{id}/account/activate",
            "GET /api/clients/{id}/picture",
            "POST /api/clients/{id}/picture",
            "DELETE /api/clients/{id}/picture",
            "GET /api/clients/{id}/individual-plan",
            "GET /api/clients/{id}/individual-plan/history",
            "GET /api/clients/{id}/individual-plan/{version}",
            "POST /api/clients/{id}/individual-plan",
            "PUT /api/clients/{id}/individual-plan",
            "POST /api/clients/{id}/individual-plan/daily-records",
            "DELETE /api/clients/{id}/individual-plan/daily-records/{dailyRecordId}",

            "GET /api/performed-tasks",
            "GET /api/performed-tasks/{id}",
            "POST /api/performed-tasks",
            "PUT /api/performed-tasks/{id}",
            "DELETE /api/performed-tasks/{id}",
            "GET /api/performed-tasks/payment-qr",
            "GET /api/performed-tasks/receipt",
            "GET /api/performed-tasks/receipts"
    );

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @ParameterizedTest(name = "{0}")
    @MethodSource("protectedEndpoints")
    void anonymousRequestIsRejectedWithUnauthorized(String endpoint) throws Exception {
        String[] methodAndPath = endpoint.split(" ");
        String pathWithIds = methodAndPath[1].replaceAll("\\{[^}]+}", "1");

        mockMvc.perform(request(HttpMethod.valueOf(methodAndPath[0]), pathWithIds))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    void everyProtectedEndpointOfTheApplicationIsListed() {
        Set<String> applicationEndpoints = handlerMapping.getHandlerMethods().entrySet().stream()
                .filter(entry -> entry.getValue().getBeanType().getPackageName().startsWith("cz.zcu.kiv.caretracker"))
                .flatMap(entry -> entry.getKey().getMethodsCondition().getMethods().stream()
                        .flatMap(method -> entry.getKey().getPatternValues().stream()
                                .map(pattern -> method.name() + " " + pattern)))
                .filter(endpoint -> !isPublic(endpoint))
                .collect(Collectors.toSet());

        assertThat(PROTECTED_ENDPOINTS).containsExactlyInAnyOrderElementsOf(applicationEndpoints);
    }

    static List<String> protectedEndpoints() {
        return PROTECTED_ENDPOINTS;
    }

    private static boolean isPublic(String endpoint) {
        String path = endpoint.substring(endpoint.indexOf(' ') + 1);
        return path.startsWith(PUBLIC_ACTIVATION_PREFIX) || PUBLIC_PATHS.contains(path);
    }
}
