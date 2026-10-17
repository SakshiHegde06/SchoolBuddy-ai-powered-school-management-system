package com.school.repository;

import com.school.document.Exam;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends MongoRepository<Exam, String> {

    List<Exam> findByClassId(String classId);
}
