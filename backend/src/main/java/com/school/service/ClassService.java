package com.school.service;

import com.school.dto.request.ClassRequest;
import com.school.dto.response.ClassResponse;

import java.util.List;

public interface ClassService {
    List<ClassResponse> findAll();
    ClassResponse findById(String id);
    ClassResponse create(ClassRequest request);
    ClassResponse update(String id, ClassRequest request);
    void delete(String id);
}