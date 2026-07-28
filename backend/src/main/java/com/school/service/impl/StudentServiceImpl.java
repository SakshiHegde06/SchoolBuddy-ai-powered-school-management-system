package com.school.service.impl;

import com.school.document.Role;
import com.school.document.Student;
import com.school.document.User;
import com.school.dto.request.StudentRequest;
import com.school.dto.response.StudentResponse;
import com.school.exception.DuplicateResourceException;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.StudentMapper;
import com.school.repository.StudentRepository;
import com.school.repository.UserRepository;
import com.school.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<StudentResponse> findAll() {
        return studentRepository.findAll().stream().map(StudentMapper::toResponse).toList();
    }

    @Override
    public StudentResponse findById(String id) {
        return StudentMapper.toResponse(getOrThrow(id));
    }

    @Override
    @Transactional
    public StudentResponse create(StudentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required when creating a student");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        user = userRepository.save(user);

        Student student = Student.builder()
                .userId(user.getId())
                .name(request.getName())
                .email(request.getEmail())
                .dob(request.getDob())
                .classId(request.getClassId())
                .section(request.getSection())
                .parentIds(request.getParentIds() == null ? List.of() : request.getParentIds())
                .admissionNumber(request.getAdmissionNumber())
                .rollNumber(request.getRollNumber())
                .build();
        student = studentRepository.save(student);

        user.setRefId(student.getId());
        userRepository.save(user);

        return StudentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse update(String id, StudentRequest request) {
        Student student = getOrThrow(id);

        student.setName(request.getName());
        student.setDob(request.getDob());
        student.setClassId(request.getClassId());
        student.setSection(request.getSection());
        student.setParentIds(request.getParentIds() == null ? List.of() : request.getParentIds());
        student.setAdmissionNumber(request.getAdmissionNumber());
        student.setRollNumber(request.getRollNumber());
        student = studentRepository.save(student);

        userRepository.findById(student.getUserId()).ifPresent(user -> {
            user.setName(request.getName());
            user.setUpdatedAt(Instant.now());
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            userRepository.save(user);
        });

        return StudentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Student student = getOrThrow(id);
        userRepository.findById(student.getUserId()).ifPresent(userRepository::delete);
        studentRepository.delete(student);
    }

    private Student getOrThrow(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
    }
}