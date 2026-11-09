package cz.zcu.kiv.caretracker.config;

import cz.zcu.kiv.caretracker.repository.UserRepository;
import cz.zcu.kiv.caretracker.security.RevocableRememberMeServices;
import cz.zcu.kiv.caretracker.security.filter.ActiveAccountFilter;
import cz.zcu.kiv.caretracker.security.filter.CsrfCookieFilter;
import cz.zcu.kiv.caretracker.security.handler.CustomAuthenticationFailureHandler;
import cz.zcu.kiv.caretracker.security.handler.CustomAuthenticationSuccessHandler;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AccountStatusUserDetailsChecker;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.rememberme.JdbcTokenRepositoryImpl;
import org.springframework.security.web.authentication.rememberme.PersistentTokenRepository;
import org.springframework.security.web.authentication.rememberme.RememberMeAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import javax.sql.DataSource;

/**
 * Spring Security configuration.
 * Uses session-based authentication (no JWT) with a 7-day remember-me cookie whose tokens are stored
 * in the database, so logout, a password change or a blocked account invalidate them.
 * Login/logout return JSON responses so the React SPA can handle them without redirects.
 * Writes need the CSRF token from the XSRF-TOKEN cookie in the X-XSRF-TOKEN header.
 * Method-level security (@PreAuthorize) is enabled via @EnableMethodSecurity.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    public static final int REMEMBER_ME_VALIDITY_SECONDS = 60 * 60 * 24 * 7;

    private final CustomAuthenticationSuccessHandler successHandler;
    private final CustomAuthenticationFailureHandler failureHandler;

    public SecurityConfig(CustomAuthenticationSuccessHandler successHandler,
                         CustomAuthenticationFailureHandler failureHandler) {
        this.successHandler = successHandler;
        this.failureHandler = failureHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                                                            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        // the account state is checked only after a correct password; checked first, "deactivated"
        // would tell anyone without the password that the username exists
        provider.setPreAuthenticationChecks(user -> { });
        provider.setPostAuthenticationChecks(new AccountStatusUserDetailsChecker());
        return provider;
    }

    @Bean
    public PersistentTokenRepository rememberMeTokenRepository(DataSource dataSource) {
        JdbcTokenRepositoryImpl repository = new JdbcTokenRepositoryImpl();
        repository.setDataSource(dataSource);
        return repository;
    }

    private static RevocableRememberMeServices rememberMeServices(String key, UserDetailsService userDetailsService,
                                                                  PersistentTokenRepository tokenRepository) {
        RevocableRememberMeServices services = new RevocableRememberMeServices(key, userDetailsService, tokenRepository);
        services.setParameter("remember-me");
        services.setTokenValiditySeconds(REMEMBER_ME_VALIDITY_SECONDS);
        return services;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   UserDetailsService userDetailsService,
                                                   UserRepository userRepository,
                                                   PersistentTokenRepository rememberMeTokenRepository,
                                                   @Value("${app.remember-me.key}") String rememberMeKey) throws Exception {
        http
                .cors(cors -> {})
                .csrf(csrf -> csrf
                        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                        // the raw token from the cookie, as the SPA sends it back unchanged
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                        // no session yet, so there is nothing a forged request could act on behalf of
                        .ignoringRequestMatchers("/api/login", "/api/activation/**")
                )
                .addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class)
                .addFilterAfter(new ActiveAccountFilter(userRepository), RememberMeAuthenticationFilter.class)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/login", "/api/auth-status", "/api/activation/**").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginProcessingUrl("/api/login")
                        .successHandler(successHandler)
                        .failureHandler(failureHandler)
                        .permitAll()
                )
                .rememberMe(r -> r
                        .key(rememberMeKey)
                        .rememberMeServices(rememberMeServices(rememberMeKey, userDetailsService, rememberMeTokenRepository))
                )
                .logout(logout -> logout
                        .logoutUrl("/api/logout")
                        .deleteCookies("JSESSIONID", "remember-me")
                        .permitAll()
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"success\":true}");
                        })
                )
                .httpBasic(basic -> basic.disable())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json");
                            response.getWriter().write("{\"error\":\"Unauthorized\"}");
                        })
                );
        return http.build();
    }
}
