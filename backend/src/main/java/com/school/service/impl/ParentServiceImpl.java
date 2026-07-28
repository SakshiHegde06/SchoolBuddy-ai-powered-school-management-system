package com.school.service.impl;

import com.school.document.Parent;
import com.school.document.Role;
import com.school.document.User;
import com.school.dto.request.ParentRequest;
import com.school.dto.response.ParentResponse;
import com.school.exception.DuplicateResourceException;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.ParentMapper;
import com.school.repository.ParentRepository;
import com.school.repository.UserRepository;
import com.school.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParentServiceImpl implements ParentService {

    private final ParentRepository parentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public List<ParentResponse> findAll() {
        return parentRepository.findAll().stream().map(ParentMapper::toResponse).toList();
    }

    @Override
    public ParentResponse findById(String id) {
        return ParentMapper.toResponse(getOrThrow(id));
    }

    @Override
    @Transactional
    public ParentResponse create(ParentRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required when creating a parent");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PARENT)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        user = userRepository.save(user);

        Parent parent = Parent.builder()
                .userId(user.getId())
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .childrenIds(request.getChildrenIds() == null ? List.of() : request.getChildrenIds())
                .build();
        parent = parentRepository.save(parent);

        user.setRefId(parent.getId());
        userRepository.save(user);

        return ParentMapper.toResponse(parent);
    }

    @Override
    @Transactional
    public ParentResponse update(String id, ParentRequest request) {
        Parent parent = getOrThrow(id);

        parent.setName(request.getName());
        parent.setPhone(request.getPhone());
        parent.setAddress(request.getAddress());
        parent.setChildrenIds(request.getChildrenIds() == null ? List.of() : request.getChildrenIds());
        parent = parentRepository.save(parent);

        userRepository.findById(parent.getUserId()).ifPresent(user -> {
            user.setName(request.getName());
            user.setUpdatedAt(Instant.now());
            if (request.getPassword() != null && !request.getPassword().isBlank()) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
            }
            userRepository.save(user);
        });

        return ParentMapper.toResponse(parent);
    }

    @Override
    @Transactional
    public void delete(String id) {
        Parent parent = getOrThrow(id);
        userRepository.findById(parent.getUserId()).ifPresent(userRepository::delete);
        parentRepository.delete(parent);
    }

    private Parent getOrThrow(String id) {
        return parentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parent not found: " + id));
    }
}