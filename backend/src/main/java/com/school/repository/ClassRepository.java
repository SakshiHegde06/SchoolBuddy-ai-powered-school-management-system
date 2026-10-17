package com.school.repository;

import com.school.document.SchoolClass;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ClassRepository extends MongoRepository<SchoolClass, String> {
}
