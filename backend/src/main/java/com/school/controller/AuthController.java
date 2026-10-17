package com.school.controller;

import com.school.dto.request.LoginRequest;
import com.school.dto.response.LoginResponse;
import com.school.dto.response.UserResponse;
import com.school.mapper.UserMapper;
import com.school.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.school.security.CustomUserDetails;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null || principal.getUser() == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        return UserMapper.toResponse(principal.getUser());
    }
}