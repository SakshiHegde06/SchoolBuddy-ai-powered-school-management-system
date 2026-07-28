package com.school.service.impl;

import com.school.document.Role;
import com.school.document.Teacher;
import com.school.document.User;
import com.school.dto.request.TeacherRequest;
import com.school.dto.response.TeacherResponse;
import com.school.exception.DuplicateResourceException;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.TeacherMapper;
import com.school.repository.TeacherRepository;
import com.school.repository.UserRepository;
import com.school.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<TeacherResponse> findAll() {
        return teacherRepository.findAll().stream().map(TeacherMapper::toResponse).toList();
    }

    @Override
    public TeacherResponse findById(String id) {
        return TeacherMapper.toResponse(getOrThrow(id));
    }

    @Override
    @Transactional
    public TeacherResponse create(TeacherRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required when creating a teacher");
        }

        // 1. Create the login account.
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.TEACHER)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        user = userRepository.save(user);

        // 2. Create the teacher profile, linked back to the account.
        Teacher teacher = Teacher.builder()
                .userId(user.getId())
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .subjectIds(request.getSubjectIds() == null ? List.of() : request.getSubjectIds())
                .classIds(request.getClassIds() == null ? List.of() : request.getClassIds())
                .maxWeeklyHours(request.getMaxWeeklyHours())
                .build();
        teacher = teacherRepository.save(teacher);

        // 3. Point the account back at the profile.
        user.setRefId(teacher.getId());
        userRepository.save(user);

        return TeacherMapper.toResponse(teacher);
    }

    @Override
    @Transactional
    public TeacherResponse update(String id, TeacherRequest request) {
        Teacher teacher = getOrThrow(id);

        teacher.setName(request.getName());
        teacher.setPhone(request.getPhone());
        teacher.setAddress(request.getAddress());
        teacher.setSubjectIds(request.getSubjectIds() == null ? List.of() : request.getSubjectIds());
        teacher.setClassIds(request.getClassIds() == null ? List.of() : request.getClassIds());
        teacher.setMaxWeeklyHours(request.getMaxWeeklyHours());
        teacher = teacherRepository.save(teacher);

        // Keep the linked user record's name/email in sync.
        userRepository.findById(teacher.getUserId()).ifPresent(user -> {
            user.setName(request.getName());
            user.setUpdatedAt(Instant.now());
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            userRepository.save(user);
        });

        return TeacherMapper.toResponse(teacher);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Teacher teacher = getOrThrow(id);
        userRepository.findById(teacher.getUserId()).ifPresent(userRepository::delete);
        teacherRepository.delete(teacher);
    }

    private Teacher getOrThrow(String id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + id));
    }
}
