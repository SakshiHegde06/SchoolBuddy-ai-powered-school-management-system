package com.school.service.impl;

import com.school.document.SchoolClass;
import com.school.dto.request.ClassRequest;
import com.school.dto.response.ClassResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.ClassMapper;
import com.school.repository.ClassRepository;
import com.school.service.ClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassServiceImpl implements ClassService {

    private final ClassRepository classRepository;

    @Override
    public List<ClassResponse> findAll() {
        return classRepository.findAll().stream().map(ClassMapper::toResponse).toList();
    }

    @Override
    public ClassResponse findById(String id) {
        return ClassMapper.toResponse(getOrThrow(id));
    }

    @Override
    public ClassResponse create(ClassRequest request) {
        SchoolClass schoolClass = SchoolClass.builder()
                .name(request.getName())
                .section(request.getSection())
                .academicYearId(request.getAcademicYearId())
                .classTeacherId(request.getClassTeacherId())
                .subjectIds(request.getSubjectIds() == null ? List.of() : request.getSubjectIds())
                .studentCount(0)
                .build();
        return ClassMapper.toResponse(classRepository.save(schoolClass));
    }

    @Override
    public ClassResponse update(String id, ClassRequest request) {
        SchoolClass schoolClass = getOrThrow(id);
        schoolClass.setName(request.getName());
        schoolClass.setSection(request.getSection());
        schoolClass.setAcademicYearId(request.getAcademicYearId());
        schoolClass.setClassTeacherId(request.getClassTeacherId());
        schoolClass.setSubjectIds(request.getSubjectIds() == null ? List.of() : request.getSubjectIds());
        return ClassMapper.toResponse(classRepository.save(schoolClass));
    }

    @Override
    public void delete(String id) {
        classRepository.delete(getOrThrow(id));
    }

    private SchoolClass getOrThrow(String id) {
        return classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class not found: " + id));
    }
}