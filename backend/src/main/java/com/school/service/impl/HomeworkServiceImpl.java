package com.school.service.impl;

import com.school.document.Homework;
import com.school.dto.request.HomeworkRequest;
import com.school.dto.response.HomeworkResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.HomeworkMapper;
import com.school.repository.HomeworkRepository;
import com.school.service.HomeworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HomeworkServiceImpl implements HomeworkService {

    private final HomeworkRepository homeworkRepository;

    @Override
    public HomeworkResponse create(HomeworkRequest request, String teacherId) {
        Homework homework = Homework.builder()
                .classId(request.getClassId())
                .subjectId(request.getSubjectId())
                .teacherId(teacherId)
                .title(request.getTitle())
                .description(request.getDescription())
                .attachmentUrls(request.getAttachmentUrls() == null ? List.of() : request.getAttachmentUrls())
                .dueDate(request.getDueDate())
                .createdAt(Instant.now())
                .build();
        return HomeworkMapper.toResponse(homeworkRepository.save(homework));
    }

    @Override
    public List<HomeworkResponse> findByClass(String classId) {
        return homeworkRepository.findByClassId(classId).stream()
                .map(HomeworkMapper::toResponse)
                .toList();
    }

    @Override
    public HomeworkResponse update(String id, HomeworkRequest request) {
        Homework homework = getOrThrow(id);
        homework.setClassId(request.getClassId());
        homework.setSubjectId(request.getSubjectId());
        homework.setTitle(request.getTitle());
        homework.setDescription(request.getDescription());
        homework.setAttachmentUrls(request.getAttachmentUrls() == null ? List.of() : request.getAttachmentUrls());
        homework.setDueDate(request.getDueDate());
        return HomeworkMapper.toResponse(homeworkRepository.save(homework));
    }

    @Override
    public void delete(String id) {
        homeworkRepository.delete(getOrThrow(id));
    }

    private Homework getOrThrow(String id) {
        return homeworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Homework not found: " + id));
    }
}