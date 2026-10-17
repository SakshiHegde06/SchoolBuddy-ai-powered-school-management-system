package com.school.repository;

import com.school.document.Timetable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TimetableRepository extends MongoRepository<Timetable, String> {

    Optional<Timetable> findByClassId(String classId);

    Optional<Timetable> findByClassName(String className);

    void deleteByClassId(String classId);
}