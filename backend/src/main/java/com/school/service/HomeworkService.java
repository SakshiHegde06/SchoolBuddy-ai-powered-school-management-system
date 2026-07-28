package com.school.service;

import com.school.dto.request.HomeworkRequest;
import com.school.dto.response.HomeworkResponse;

import java.util.List;

public interface HomeworkService {
    HomeworkResponse create(HomeworkRequest request, String teacherId);
    List<HomeworkResponse> findByClass(String classId);
    HomeworkResponse update(String id, HomeworkRequest request);
    void delete(String id);
}