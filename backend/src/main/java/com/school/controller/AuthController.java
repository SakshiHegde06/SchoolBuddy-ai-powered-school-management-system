package com.school.controller;

import com.school.document.User;
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
    private final com.school.repository.UserRepository userRepository;
    private final com.school.repository.StudentRepository studentRepository;
    private final com.school.repository.ParentRepository parentRepository;
    private final com.school.repository.TeacherRepository teacherRepository;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null || principal.getUser() == null) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        User user = principal.getUser();
        if (user.getRefId() == null || user.getRefId().isBlank()) {
            if (user.getRole() == com.school.document.Role.STUDENT) {
                studentRepository.findByUserId(user.getId())
                        .or(() -> studentRepository.findByEmailIgnoreCase(user.getEmail()))
                        .ifPresent(s -> {
                            user.setRefId(s.getId());
                            userRepository.save(user);
                        });
            } else if (user.getRole() == com.school.document.Role.PARENT) {
                parentRepository.findByUserId(user.getId())
                        .or(() -> parentRepository.findByEmailIgnoreCase(user.getEmail()))
                        .ifPresent(p -> {
                            user.setRefId(p.getId());
                            userRepository.save(user);
                        });
            } else if (user.getRole() == com.school.document.Role.TEACHER) {
                teacherRepository.findByUserId(user.getId())
                        .or(() -> teacherRepository.findByEmailIgnoreCase(user.getEmail()))
                        .ifPresent(t -> {
                            user.setRefId(t.getId());
                            userRepository.save(user);
                        });
            }
        }
        return UserMapper.toResponse(user);
    }
}