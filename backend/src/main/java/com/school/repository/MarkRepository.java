package com.school.repository;

import com.school.document.MarkEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MarkRepository extends MongoRepository<MarkEntry, String> {
    List<MarkEntry> findByStudentId(String studentId);
    List<MarkEntry> findByStudentIdAndSubjectId(String studentId, String subjectId);
}