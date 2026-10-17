package com.school.repository;

import com.school.document.StudyMaterial;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StudyMaterialRepository extends MongoRepository<StudyMaterial, String> {
    List<StudyMaterial> findByClassIdOrderByUploadedAtDesc(String classId);
}