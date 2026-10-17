package com.school.config;

import com.school.security.jwt.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // Picks up the CorsConfigurationSource bean from CorsConfig.java —
            // without this, Spring Security ignores it and handles CORS
            // inconsistently (or not at all) ahead of the auth checks below.
            .cors(cors -> {})
            // Stateless JWT API — don't let Spring create/track HTTP sessions.
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Only the actual login/register endpoints are open to
                // unauthenticated callers. Everything else requires a valid
                // JWT; per-role restrictions (e.g. hasRole('ADMIN')) are
                // enforced with @PreAuthorize on individual controller
                // methods, which @EnableMethodSecurity activates above.
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/reports/verify/**").permitAll()
                .anyRequest().authenticated()
            )
            // Runs JwtAuthFilter before Spring's own username/password filter
            // on every request, so a valid Authorization: Bearer <token>
            // header actually populates the SecurityContext. This was the
            // one line missing — the filter existed as a @Component but was
            // never wired into the chain, so every request was anonymous.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}