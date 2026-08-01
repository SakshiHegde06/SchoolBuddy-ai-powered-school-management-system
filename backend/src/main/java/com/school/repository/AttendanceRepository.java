package com.school.repository;

import com.school.document.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    Optional<Attendance> findByStudentIdAndDateAndSubjectId(String studentId, LocalDate date, String subjectId);
    List<Attendance> findByClassIdAndDateAndSubjectId(String classId, LocalDate date, String subjectId);
    List<Attendance> findByStudentId(String studentId);
}