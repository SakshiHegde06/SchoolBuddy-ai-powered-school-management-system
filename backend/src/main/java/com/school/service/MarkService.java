package com.school.service;

import com.school.dto.request.MarkRequest;
import com.school.dto.response.MarkResponse;

import java.util.List;

public interface MarkService {
    MarkResponse create(MarkRequest request, String enteredByTeacherId);
    List<MarkResponse> findByStudent(String studentId);
    MarkResponse update(String id, MarkRequest request);
    void delete(String id);
}