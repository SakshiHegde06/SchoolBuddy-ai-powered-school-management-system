package com.school.repository;

import com.school.document.User;
import com.school.enums.Role;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    // ADD THESE TWO METHODS:
    List<User> findByRole(Role role);
    boolean existsByRole(Role role);
}