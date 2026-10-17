package com.school.service;

import com.school.dto.request.StudentRequest;
import com.school.dto.response.StudentResponse;

import java.util.List;

public interface StudentService {
    List<StudentResponse> findAll();
    StudentResponse findById(String id);
    StudentResponse create(StudentRequest request);
    StudentResponse update(String id, StudentRequest request);
    void delete(String id);
}