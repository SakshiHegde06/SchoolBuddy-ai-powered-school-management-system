package com.school.service.impl;

import com.school.document.Attendance;
import com.school.document.AttendanceStatus;
import com.school.dto.request.AttendanceMarkRequest;
import com.school.dto.request.AttendanceRecordRequest;
import com.school.dto.response.AttendanceResponse;
import com.school.mapper.AttendanceMapper;
import com.school.repository.AttendanceRepository;
import com.school.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;

    @Override
    public List<AttendanceResponse> markAttendance(AttendanceMarkRequest request, String markedByTeacherId) {
        List<Attendance> saved = request.getRecords().stream()
                .map(record -> upsertOne(request.getClassId(), request.getSubjectId(), request.getDate(), record, markedByTeacherId))
                .toList();

        return saved.stream().map(AttendanceMapper::toResponse).toList();
    }

    private Attendance upsertOne(String classId, String subjectId, LocalDate date, AttendanceRecordRequest record, String markedByTeacherId) {
        Attendance attendance = attendanceRepository
                .findByStudentIdAndDateAndSubjectId(record.getStudentId(), date, subjectId)
                .orElseGet(() -> Attendance.builder()
                        .studentId(record.getStudentId())
                        .classId(classId)
                        .subjectId(subjectId)
                        .date(date)
                        .build());

        attendance.setStatus(record.getStatus());
        attendance.setClassId(classId);
        attendance.setSubjectId(subjectId);
        attendance.setMarkedBy(markedByTeacherId);

        return attendanceRepository.save(attendance);
    }

    @Override
    public List<AttendanceResponse> getByClassAndDate(String classId, LocalDate date, String subjectId) {
        return attendanceRepository.findByClassIdAndDateAndSubjectId(classId, date, subjectId).stream()
                .map(AttendanceMapper::toResponse)
                .toList();
    }

    @Override
    public List<AttendanceResponse> getByStudent(String studentId) {
        return attendanceRepository.findByStudentId(studentId).stream()
                .map(AttendanceMapper::toResponse)
                .toList();
    }
}