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
    private final com.school.repository.TeacherRepository teacherRepository;
    private final com.school.repository.SubjectRepository subjectRepository;
    private final com.school.repository.ClassRepository classRepository;
    private final com.school.repository.TeacherAssignmentRepository teacherAssignmentRepository;

    private AttendanceResponse toEnrichedResponse(Attendance attendance) {
        AttendanceResponse resp = AttendanceMapper.toResponse(attendance);
        if (resp == null) return null;

        if (attendance.getSubjectId() != null && !attendance.getSubjectId().isBlank()) {
            subjectRepository.findById(attendance.getSubjectId())
                    .ifPresent(s -> resp.setSubjectName(s.getName()));
        }

        if (attendance.getMarkedBy() != null && !attendance.getMarkedBy().isBlank()) {
            teacherRepository.findById(attendance.getMarkedBy())
                    .ifPresent(t -> resp.setTeacherName(t.getName()));
        }

        if (resp.getTeacherName() == null && attendance.getClassId() != null && attendance.getSubjectId() != null) {
            var assignments = teacherAssignmentRepository.findByClassIdAndSubjectId(attendance.getClassId(), attendance.getSubjectId());
            if (!assignments.isEmpty() && assignments.get(0).getTeacherId() != null) {
                teacherRepository.findById(assignments.get(0).getTeacherId())
                        .ifPresent(t -> resp.setTeacherName(t.getName()));
            }
        }

        if (attendance.getClassId() != null && !attendance.getClassId().isBlank()) {
            classRepository.findById(attendance.getClassId())
                    .ifPresent(c -> resp.setClassName(c.getName() + (c.getSection() != null ? " " + c.getSection() : "")));
        }

        return resp;
    }

    @Override
    public List<AttendanceResponse> markAttendance(AttendanceMarkRequest request, String markedByTeacherId) {
        List<Attendance> saved = request.getRecords().stream()
                .map(record -> upsertOne(request.getClassId(), request.getSubjectId(), request.getDate(), record, markedByTeacherId))
                .toList();

        return saved.stream().map(this::toEnrichedResponse).toList();
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
        List<Attendance> records;
        if (date != null && subjectId != null && !subjectId.isBlank()) {
            records = attendanceRepository.findByClassIdAndDateAndSubjectId(classId, date, subjectId);
        } else if (date != null) {
            records = attendanceRepository.findByClassIdAndDate(classId, date);
        } else if (subjectId != null && !subjectId.isBlank()) {
            records = attendanceRepository.findByClassIdAndSubjectId(classId, subjectId);
        } else {
            records = attendanceRepository.findByClassId(classId);
        }

        return records.stream()
                .map(this::toEnrichedResponse)
                .toList();
    }

    @Override
    public List<AttendanceResponse> getByStudent(String studentId) {
        return attendanceRepository.findByStudentId(studentId).stream()
                .map(this::toEnrichedResponse)
                .toList();
    }
}