package com.school.service.impl;

import com.school.document.MarkEntry;
import com.school.document.MarkStatus;
import com.school.dto.request.MarkRequest;
import com.school.dto.response.MarkResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.MarkMapper;
import com.school.repository.MarkRepository;
import com.school.service.MarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarkServiceImpl implements MarkService {

    private final MarkRepository markRepository;
    private final com.school.repository.ExamRepository examRepository;
    private final com.school.repository.StudentRepository studentRepository;

    private void validateMarks(MarkRequest request) {
        if (request.getMarksObtained() < 0) {
            throw new IllegalArgumentException("Marks obtained cannot be negative.");
        }

        double effectiveMax = request.getMaxMarks();
        if (request.getExamId() != null && !request.getExamId().isBlank()) {
            var examOpt = examRepository.findById(request.getExamId());
            if (examOpt.isPresent() && examOpt.get().getMaxMarks() > 0) {
                effectiveMax = examOpt.get().getMaxMarks();
            }
        }

        if (effectiveMax <= 0) {
            throw new IllegalArgumentException("Maximum marks must be greater than zero.");
        }

        if (request.getMarksObtained() > effectiveMax) {
            throw new IllegalArgumentException(
                "Marks obtained (" + request.getMarksObtained() + ") cannot exceed maximum allowed marks (" + effectiveMax + ")."
            );
        }
    }

    @jakarta.annotation.PostConstruct
    public void publishExistingDrafts() {
        try {
            List<MarkEntry> drafts = markRepository.findAll().stream()
                    .filter(m -> m.getStatus() == MarkStatus.DRAFT)
                    .toList();
            if (!drafts.isEmpty()) {
                drafts.forEach(m -> m.setStatus(MarkStatus.PUBLISHED));
                markRepository.saveAll(drafts);
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public MarkResponse create(MarkRequest request, String enteredByTeacherId) {
        validateMarks(request);

        // Check if an existing mark exists for this student, subject, and exam to prevent duplicates
        java.util.Optional<MarkEntry> existing = java.util.Optional.empty();
        if (request.getExamId() != null && !request.getExamId().isBlank()) {
            existing = markRepository.findByExamId(request.getExamId()).stream()
                    .filter(m -> request.getStudentId().equals(m.getStudentId())
                            && java.util.Objects.equals(request.getSubjectId(), m.getSubjectId()))
                    .findFirst();
        } else if (request.getStudentId() != null && request.getSubjectId() != null && request.getTerm() != null) {
            existing = markRepository.findByStudentIdAndSubjectId(request.getStudentId(), request.getSubjectId()).stream()
                    .filter(m -> request.getTerm().equalsIgnoreCase(m.getTerm())
                            && (request.getType() == null || request.getType().equals(m.getType())))
                    .findFirst();
        }

        MarkStatus targetStatus = request.getStatus() != null ? request.getStatus() : MarkStatus.PUBLISHED;

        MarkEntry mark;
        if (existing.isPresent()) {
            mark = existing.get();
            mark.setClassId(request.getClassId());
            mark.setSubjectId(request.getSubjectId());
            mark.setAcademicYearId(request.getAcademicYearId());
            mark.setTerm(request.getTerm());
            mark.setType(request.getType());
            mark.setMarksObtained(request.getMarksObtained());
            mark.setMaxMarks(request.getMaxMarks());
            mark.setEnteredBy(enteredByTeacherId);
            mark.setDate(request.getDate());
            mark.setExamId(request.getExamId());
            mark.setStatus(targetStatus);
        } else {
            mark = MarkEntry.builder()
                    .studentId(request.getStudentId())
                    .classId(request.getClassId())
                    .subjectId(request.getSubjectId())
                    .academicYearId(request.getAcademicYearId())
                    .term(request.getTerm())
                    .type(request.getType())
                    .marksObtained(request.getMarksObtained())
                    .maxMarks(request.getMaxMarks())
                    .enteredBy(enteredByTeacherId)
                    .date(request.getDate())
                    .examId(request.getExamId())
                    .status(targetStatus)
                    .build();
        }

        return MarkMapper.toResponse(markRepository.save(mark));
    }

    @Override
    public List<MarkResponse> findByStudent(String studentId) {
        List<MarkEntry> entries = new java.util.ArrayList<>(markRepository.findByStudentId(studentId));
        if (entries.isEmpty() && studentRepository != null) {
            // Also check if studentId passed is a User ID instead of student doc ID
            studentRepository.findByUserId(studentId).ifPresent(s -> {
                entries.addAll(markRepository.findByStudentId(s.getId()));
            });
            // Or if studentId passed is student doc ID but marks were saved with userId
            if (entries.isEmpty()) {
                studentRepository.findById(studentId).ifPresent(s -> {
                    if (s.getUserId() != null && !s.getUserId().isBlank()) {
                        entries.addAll(markRepository.findByStudentId(s.getUserId()));
                    }
                });
            }
        }
        return entries.stream()
                .map(MarkMapper::toResponse)
                .toList();
    }

    @Override
    public MarkResponse update(String id, MarkRequest request) {
        validateMarks(request);
        MarkEntry mark = getOrThrow(id);
        mark.setClassId(request.getClassId());
        mark.setSubjectId(request.getSubjectId());
        mark.setAcademicYearId(request.getAcademicYearId());
        mark.setTerm(request.getTerm());
        mark.setType(request.getType());
        mark.setMarksObtained(request.getMarksObtained());
        mark.setMaxMarks(request.getMaxMarks());
        mark.setDate(request.getDate());
        mark.setExamId(request.getExamId());
        mark.setStatus(request.getStatus() != null ? request.getStatus() : MarkStatus.PUBLISHED);
        return MarkMapper.toResponse(markRepository.save(mark));
    }

    @Override
    public MarkResponse findById(String id) {
        return MarkMapper.toResponse(getOrThrow(id));
    }

    @Override
    public void delete(String id) {
        markRepository.delete(getOrThrow(id));
    }

    @Override
    public MarkResponse publish(String id) {
        MarkEntry mark = getOrThrow(id);
        mark.setStatus(MarkStatus.PUBLISHED);
        return MarkMapper.toResponse(markRepository.save(mark));
    }

    @Override
    public List<MarkResponse> publishByExam(String examId) {
        List<MarkEntry> entries = markRepository.findByExamId(examId);
        entries.forEach(e -> e.setStatus(MarkStatus.PUBLISHED));
        return markRepository.saveAll(entries).stream()
                .map(MarkMapper::toResponse)
                .toList();
    }

    private MarkEntry getOrThrow(String id) {
        return markRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mark entry not found: " + id));
    }
}