package com.school.repository;

import com.school.document.AcademicYear;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends MongoRepository<AcademicYear, String> {

    List<AcademicYear> findAllByOrderByStartDateDesc();

    Optional<AcademicYear> findByIsCurrentTrue();
}