package com.school.repository;

import com.school.document.Parent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ParentRepository extends MongoRepository<Parent, String> {
    Optional<Parent> findByEmailIgnoreCase(String email);
}
