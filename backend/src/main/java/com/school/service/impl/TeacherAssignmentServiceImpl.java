package com.school.service.impl;

import com.school.document.SchoolClass;
import com.school.document.Subject;
import com.school.document.Teacher;
import com.school.document.TeacherAssignment;
import com.school.dto.request.TeacherAssignmentRequest;
import com.school.dto.response.TeacherAssignmentResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.TeacherAssignmentMapper;
import com.school.repository.ClassRepository;
import com.school.repository.StudentRepository;
import com.school.repository.SubjectRepository;
import com.school.repository.TeacherAssignmentRepository;
import com.school.repository.TeacherRepository;
import com.school.service.TeacherAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TeacherAssignmentServiceImpl implements TeacherAssignmentService {

    private final TeacherAssignmentRepository assignmentRepository;
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;

    @Override
    public List<TeacherAssignmentResponse> findByTeacherId(String teacherId) {
        return assignmentRepository.findByTeacherId(teacherId)
                .stream()
                .map(this::enrichAssignment)
                .toList();
    }

    @Override
    public List<TeacherAssignmentResponse> findActiveAssignmentsByTeacherAtDate(String teacherId, java.time.LocalDate date, int page, int size) {
        java.time.LocalDate effectiveDate = date != null ? date : java.time.LocalDate.now();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(Math.max(0, page), Math.max(1, size));
        org.springframework.data.domain.Page<com.school.document.TeacherAssignment> pageResult =
                assignmentRepository.findActiveAssignmentsByTeacherAtDate(teacherId, effectiveDate, pageable);

        return pageResult.stream().map(this::enrichAssignment).toList();
    }

    @Override
    public TeacherAssignmentResponse findById(String id) {
        TeacherAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher assignment not found: " + id));
        return enrichAssignment(assignment);
    }

    @Override
    @Transactional
    public TeacherAssignmentResponse create(TeacherAssignmentRequest request) {
        // Validate teacher exists
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher not found: " + request.getTeacherId()));

        // Validate class exists
        SchoolClass schoolClass = classRepository.findById(request.getClassId())
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + request.getClassId()));

        // Validate subject exists
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + request.getSubjectId()));

        // Check if this assignment already exists
        if (assignmentRepository.existsByTeacherIdAndClassIdAndSubjectId(
                request.getTeacherId(),
                request.getClassId(),
                request.getSubjectId())) {
            throw new IllegalArgumentException("Teacher is already assigned to this class-subject combination");
        }

        TeacherAssignment assignment = TeacherAssignment.builder()
                .teacherId(request.getTeacherId())
                .classId(request.getClassId())
                .subjectId(request.getSubjectId())
                .effectiveFrom(request.getEffectiveFrom())
                .effectiveTo(request.getEffectiveTo())
                .classTeacher(request.isClassTeacher())
                .notes(request.getNotes())
                .build();

        assignment = assignmentRepository.save(assignment);
        return enrichAssignment(assignment);
    }

    @Override
    @Transactional
    public TeacherAssignmentResponse update(String id, TeacherAssignmentRequest request) {
        TeacherAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher assignment not found: " + id));

        // Update dates and notes
        assignment.setEffectiveFrom(request.getEffectiveFrom());
        assignment.setEffectiveTo(request.getEffectiveTo());
        assignment.setClassTeacher(request.isClassTeacher());
        assignment.setNotes(request.getNotes());

        assignment = assignmentRepository.save(assignment);
        return enrichAssignment(assignment);
    }

    @Override
    @Transactional
    public void delete(String id) {
        if (!assignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Teacher assignment not found: " + id);
        }
        assignmentRepository.deleteById(id);
    }

    @Override
    public boolean isTeacherAssignedToClassSubject(String teacherId, String classId, String subjectId) {
        return assignmentRepository.existsByTeacherIdAndClassIdAndSubjectId(teacherId, classId, subjectId);
    }

    @Override
    public List<TeacherAssignmentResponse> findByClassIdAndSubjectId(String classId, String subjectId) {
        return assignmentRepository.findByClassIdAndSubjectId(classId, subjectId)
                .stream()
                .map(this::enrichAssignment)
                .toList();
    }

    @Override
    public List<TeacherAssignmentResponse> findByClassId(String classId) {
        return assignmentRepository.findByClassId(classId)
                .stream()
                .map(this::enrichAssignment)
                .toList();
    }

    /**
     * Helper method to enrich assignment with teacher, class, subject names and student count.
     */
    private TeacherAssignmentResponse enrichAssignment(TeacherAssignment assignment) {
        Teacher teacher = teacherRepository.findById(assignment.getTeacherId()).orElse(null);
        SchoolClass schoolClass = classRepository.findById(assignment.getClassId()).orElse(null);
        Subject subject = subjectRepository.findById(assignment.getSubjectId()).orElse(null);
        int studentCount = (int) studentRepository.findByClassId(assignment.getClassId()).size();

        return TeacherAssignmentMapper.toResponse(assignment, teacher, schoolClass, subject, studentCount);
    }
}
