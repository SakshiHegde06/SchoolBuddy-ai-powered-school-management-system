package com.school.repository;

import com.school.document.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SubjectRepository extends MongoRepository<Subject, String> {
}
