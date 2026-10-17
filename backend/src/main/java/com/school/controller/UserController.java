package com.school.controller;

import com.school.document.User;
import com.school.enums.Role;
import com.school.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/teachers")
    public ResponseEntity<List<User>> getAllTeachers() {
        List<User> teachers = userRepository.findByRole(Role.TEACHER);
        return ResponseEntity.ok(teachers);
    }
}