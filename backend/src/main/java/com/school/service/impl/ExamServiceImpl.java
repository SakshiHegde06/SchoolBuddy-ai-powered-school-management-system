package com.school.service.impl;

import com.school.document.Exam;
import com.school.dto.request.ExamRequest;
import com.school.dto.response.ExamResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.repository.ExamRepository;
import com.school.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;

    @Override
    public List<ExamResponse> findByClassId(String classId) {
        return examRepository.findByClassId(classId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ExamResponse findById(String id) {
        return toResponse(getOrThrow(id));
    }

    @Override
    public ExamResponse create(ExamRequest request) {
        Exam exam = Exam.builder()
                .name(request.getName())
                .classId(request.getClassId())
                .subjectId(request.getSubjectId())
                .type(request.getType())
                .maxMarks(request.getMaxMarks())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .academicYearId(request.getAcademicYearId())
                .build();
        return toResponse(examRepository.save(exam));
    }

    @Override
    public ExamResponse update(String id, ExamRequest request) {
        Exam exam = getOrThrow(id);
        exam.setName(request.getName());
        exam.setClassId(request.getClassId());
        exam.setSubjectId(request.getSubjectId());
        exam.setType(request.getType());
        exam.setMaxMarks(request.getMaxMarks());
        exam.setStartDate(request.getStartDate());
        exam.setEndDate(request.getEndDate());
        exam.setAcademicYearId(request.getAcademicYearId());
        return toResponse(examRepository.save(exam));
    }

    @Override
    public void delete(String id) {
        examRepository.delete(getOrThrow(id));
    }

    private Exam getOrThrow(String id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam not found: " + id));
    }

    private ExamResponse toResponse(Exam e) {
        return ExamResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .classId(e.getClassId())
                .subjectId(e.getSubjectId())
                .type(e.getType())
                .maxMarks(e.getMaxMarks())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .academicYearId(e.getAcademicYearId())
                .build();
    }
}