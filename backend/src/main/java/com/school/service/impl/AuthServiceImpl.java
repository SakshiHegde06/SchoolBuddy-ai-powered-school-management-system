package com.school.service.impl;

import com.school.document.User;
import com.school.dto.request.LoginRequest;
import com.school.dto.response.LoginResponse;
import com.school.mapper.UserMapper;
import com.school.repository.UserRepository;
import com.school.security.CustomUserDetails;
import com.school.security.jwt.JwtTokenProvider;
import com.school.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public LoginResponse login(LoginRequest request) {
        // Delegates to Spring Security's provider, which uses UserDetailsServiceImpl +
        // BCryptPasswordEncoder under the hood. Throws BadCredentialsException on mismatch,
        // handled centrally by GlobalExceptionHandler.
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(principal);

        return LoginResponse.builder()
                .token(token)
                .user(UserMapper.toResponse(principal.getUser()))
                .build();
    }

    @Override
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No account found for " + email));
    }
}