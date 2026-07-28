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
                .map(record -> upsertOne(request.getClassId(), request.getDate(), record, markedByTeacherId))
                .toList();

        return saved.stream().map(AttendanceMapper::toResponse).toList();
    }

    private Attendance upsertOne(String classId, LocalDate date, AttendanceRecordRequest record, String markedByTeacherId) {
        Attendance attendance = attendanceRepository
                .findByStudentIdAndDate(record.getStudentId(), date)
                .orElseGet(() -> Attendance.builder()
                        .studentId(record.getStudentId())
                        .classId(classId)
                        .date(date)
                        .build());

        attendance.setStatus(record.getStatus());
        attendance.setClassId(classId);
        attendance.setMarkedBy(markedByTeacherId);

        return attendanceRepository.save(attendance);
    }

    @Override
    public List<AttendanceResponse> getByClassAndDate(String classId, LocalDate date) {
        return attendanceRepository.findByClassIdAndDate(classId, date).stream()
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