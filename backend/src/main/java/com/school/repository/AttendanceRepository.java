package com.school.repository;

import com.school.document.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    Optional<Attendance> findByStudentIdAndDate(String studentId, LocalDate date);
    List<Attendance> findByClassIdAndDate(String classId, LocalDate date);
    List<Attendance> findByStudentId(String studentId);
}