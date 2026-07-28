package com.school.repository;

import com.school.document.Remark;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RemarkRepository extends MongoRepository<Remark, String> {

    List<Remark> findByStudentIdOrderByCreatedAtDesc(String studentId);

}