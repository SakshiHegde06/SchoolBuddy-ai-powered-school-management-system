package com.school.service.impl;

import com.school.document.Subject;
import com.school.dto.request.SubjectRequest;
import com.school.dto.response.SubjectResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.SubjectMapper;
import com.school.repository.SubjectRepository;
import com.school.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;

    @Override
    public List<SubjectResponse> findAll() {
        return subjectRepository.findAll().stream().map(SubjectMapper::toResponse).toList();
    }

    @Override
    public SubjectResponse findById(String id) {
        return SubjectMapper.toResponse(getOrThrow(id));
    }

    @Override
    public SubjectResponse create(SubjectRequest request) {
        Subject subject = Subject.builder()
                .name(request.getName())
                .code(request.getCode())
                .practical(request.isPractical())
                .weeklyFrequency(request.getWeeklyFrequency())
                .build();
        return SubjectMapper.toResponse(subjectRepository.save(subject));
    }

    @Override
    public SubjectResponse update(String id, SubjectRequest request) {
        Subject subject = getOrThrow(id);
        subject.setName(request.getName());
        subject.setCode(request.getCode());
        subject.setPractical(request.isPractical());
        subject.setWeeklyFrequency(request.getWeeklyFrequency());
        return SubjectMapper.toResponse(subjectRepository.save(subject));
    }

    @Override
    public void delete(String id) {
        subjectRepository.delete(getOrThrow(id));
    }

    private Subject getOrThrow(String id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found: " + id));
    }
}