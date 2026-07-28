package com.school.service.impl;

import com.school.document.Role;
import com.school.document.User;
import com.school.dto.request.AdminRequest;
import com.school.dto.response.DashboardSummaryResponse;
import com.school.dto.response.UserResponse;
import com.school.exception.DuplicateResourceException;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.UserMapper;
import com.school.repository.ClassRepository;
import com.school.repository.ParentRepository;
import com.school.repository.StudentRepository;
import com.school.repository.TeacherRepository;
import com.school.repository.UserRepository;
import com.school.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final ClassRepository classRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public DashboardSummaryResponse getDashboardSummary() {
        // Straight counts for now — swap for cached/aggregated values later if
        // these collections get large enough that count() becomes slow.
        return DashboardSummaryResponse.builder()
                .totalStudents(studentRepository.count())
                .totalTeachers(teacherRepository.count())
                .totalParents(parentRepository.count())
                .totalClasses(classRepository.count())
                .build();
    }

    @Override
    public List<UserResponse> listAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .map(UserMapper::toResponse)
                .toList();
    }

    @Override
    public UserResponse createAdmin(AdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User admin = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ADMIN)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return UserMapper.toResponse(userRepository.save(admin));
    }

    @Override
    public void deleteAdmin(String userId, String requestingUserId) {
        if (userId.equals(requestingUserId)) {
            throw new IllegalArgumentException("You can't delete your own admin account");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + userId));

        if (user.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("That account is not an admin");
        }

        long adminCount = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ADMIN)
                .count();
        if (adminCount <= 1) {
            throw new IllegalArgumentException("Can't delete the last remaining admin account");
        }

        userRepository.delete(user);
    }
}