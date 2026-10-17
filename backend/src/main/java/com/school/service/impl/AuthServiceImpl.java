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
    private final com.school.repository.StudentRepository studentRepository;
    private final com.school.repository.ParentRepository parentRepository;
    private final com.school.repository.TeacherRepository teacherRepository;

    @Override
    public LoginResponse login(LoginRequest request) {
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        User user = principal.getUser();

        // Auto-resolve refId if missing in user document
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

        String token = jwtTokenProvider.generateToken(principal);

        return LoginResponse.builder()
                .token(token)
                .user(UserMapper.toResponse(user))
                .build();
    }

    @Override
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No account found for " + email));
    }
}