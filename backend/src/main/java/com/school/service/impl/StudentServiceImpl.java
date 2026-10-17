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
    private final com.school.repository.ParentStudentRepository parentStudentRepository;

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
            throw new DuplicateResourceException("An account with email '" + request.getEmail() + "' already exists");
        }
        if (request.getClassId() != null && request.getRollNumber() != null && !request.getRollNumber().isBlank()) {
            if (studentRepository.existsByClassIdAndRollNumber(request.getClassId(), request.getRollNumber().trim())) {
                throw new DuplicateResourceException("A student with roll number '" + request.getRollNumber().trim() + "' already exists in this class");
            }
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

        syncStudentParentLinks(student.getId(), student.getParentIds());

        return StudentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public StudentResponse update(String id, StudentRequest request) {
        Student student = getOrThrow(id);

        // Check unique email if updated
        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(student.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new DuplicateResourceException("An account with email '" + request.getEmail() + "' already exists");
            }
        }

        // Check unique roll number within class
        String targetClassId = request.getClassId() != null ? request.getClassId() : student.getClassId();
        if (targetClassId != null && request.getRollNumber() != null && !request.getRollNumber().isBlank()) {
            if (studentRepository.existsByClassIdAndRollNumberAndIdNot(targetClassId, request.getRollNumber().trim(), id)) {
                throw new DuplicateResourceException("A student with roll number '" + request.getRollNumber().trim() + "' already exists in this class");
            }
        }

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

        syncStudentParentLinks(student.getId(), student.getParentIds());

        return StudentMapper.toResponse(student);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Student student = getOrThrow(id);
        userRepository.findById(student.getUserId()).ifPresent(userRepository::delete);
        parentStudentRepository.findByStudentId(id).forEach(link -> {
            link.setUnlinkedAt(Instant.now());
            parentStudentRepository.save(link);
        });
        studentRepository.delete(student);
    }

    private void syncStudentParentLinks(String studentId, List<String> newParentIds) {
        if (newParentIds == null) newParentIds = List.of();

        List<com.school.document.ParentStudent> existingLinks = parentStudentRepository.findByStudentId(studentId);
        java.util.Set<String> targetIds = new java.util.HashSet<>(newParentIds);

        for (var link : existingLinks) {
            if (!targetIds.contains(link.getParentId()) && link.getUnlinkedAt() == null) {
                link.setUnlinkedAt(Instant.now());
                parentStudentRepository.save(link);
            } else if (targetIds.contains(link.getParentId()) && link.getUnlinkedAt() != null) {
                link.setUnlinkedAt(null);
                parentStudentRepository.save(link);
            }
        }

        java.util.Set<String> alreadyLinked = existingLinks.stream()
                .filter(l -> l.getUnlinkedAt() == null)
                .map(com.school.document.ParentStudent::getParentId)
                .collect(java.util.stream.Collectors.toSet());

        for (String parentId : newParentIds) {
            if (!alreadyLinked.contains(parentId)) {
                com.school.document.ParentStudent link = com.school.document.ParentStudent.builder()
                        .parentId(parentId)
                        .studentId(studentId)
                        .guardianType(com.school.document.ParentStudent.GuardianType.GUARDIAN)
                        .primary(true)
                        .primaryContact(true)
                        .linkedAt(Instant.now())
                        .build();
                parentStudentRepository.save(link);
            }
        }
    }

    private Student getOrThrow(String id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
    }
}