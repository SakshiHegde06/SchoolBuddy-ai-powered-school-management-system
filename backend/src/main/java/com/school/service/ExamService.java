package com.school.service;

import com.school.dto.request.ExamRequest;
import com.school.dto.response.ExamResponse;

import java.util.List;

public interface ExamService {

    List<ExamResponse> findByClassId(String classId);

    ExamResponse findById(String id);

    ExamResponse create(ExamRequest request);

    ExamResponse update(String id, ExamRequest request);

    void delete(String id);
}