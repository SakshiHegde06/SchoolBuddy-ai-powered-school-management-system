package com.school.service.impl;

import com.school.document.Remark;
import com.school.document.Teacher;
import com.school.dto.request.RemarkRequest;
import com.school.dto.response.RemarkResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.RemarkMapper;
import com.school.repository.RemarkRepository;
import com.school.repository.TeacherRepository;
import com.school.service.RemarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RemarkServiceImpl implements RemarkService {

    private final RemarkRepository remarkRepository;
    private final TeacherRepository teacherRepository;

    @Override
    public RemarkResponse create(RemarkRequest request, String teacherId) {

        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Teacher not found"));

        Remark remark = Remark.builder()
                .studentId(request.getStudentId())
                .teacherId(teacherId)
                .teacherName(teacher.getName())
                .remark(request.getRemark())
                .createdAt(Instant.now())
                .build();

        return RemarkMapper.toResponse(
                remarkRepository.save(remark)
        );
    }

    @Override
    public List<RemarkResponse> getByStudent(String studentId) {

        return remarkRepository
                .findByStudentIdOrderByCreatedAtDesc(studentId)
                .stream()
                .map(RemarkMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(String id) {

        if (!remarkRepository.existsById(id)) {
            throw new ResourceNotFoundException("Remark not found");
        }

        remarkRepository.deleteById(id);
    }
}
