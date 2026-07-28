package com.school.service.impl;

import com.school.document.MarkEntry;
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

    @Override
    public MarkResponse create(MarkRequest request, String enteredByTeacherId) {
        MarkEntry mark = MarkEntry.builder()
                .studentId(request.getStudentId())
                .subjectId(request.getSubjectId())
                .academicYearId(request.getAcademicYearId())
                .term(request.getTerm())
                .type(request.getType())
                .marksObtained(request.getMarksObtained())
                .maxMarks(request.getMaxMarks())
                .enteredBy(enteredByTeacherId)
                .date(request.getDate())
                .build();
        return MarkMapper.toResponse(markRepository.save(mark));
    }

    @Override
    public List<MarkResponse> findByStudent(String studentId) {
        return markRepository.findByStudentId(studentId).stream()
                .map(MarkMapper::toResponse)
                .toList();
    }

    @Override
    public MarkResponse update(String id, MarkRequest request) {
        MarkEntry mark = getOrThrow(id);
        mark.setSubjectId(request.getSubjectId());
        mark.setAcademicYearId(request.getAcademicYearId());
        mark.setTerm(request.getTerm());
        mark.setType(request.getType());
        mark.setMarksObtained(request.getMarksObtained());
        mark.setMaxMarks(request.getMaxMarks());
        mark.setDate(request.getDate());
        return MarkMapper.toResponse(markRepository.save(mark));
    }

    @Override
    public void delete(String id) {
        markRepository.delete(getOrThrow(id));
    }

    private MarkEntry getOrThrow(String id) {
        return markRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mark entry not found: " + id));
    }
}