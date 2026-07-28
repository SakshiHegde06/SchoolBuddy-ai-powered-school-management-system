package com.school.service;

import com.school.dto.request.TeacherRequest;
import com.school.dto.response.TeacherResponse;

import java.util.List;

public interface TeacherService {
    List<TeacherResponse> findAll();
    TeacherResponse findById(String id);
    TeacherResponse create(TeacherRequest request);
    TeacherResponse update(String id, TeacherRequest request);
    void delete(String id);
}