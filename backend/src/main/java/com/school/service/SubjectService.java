package com.school.service;

import com.school.dto.request.SubjectRequest;
import com.school.dto.response.SubjectResponse;

import java.util.List;

public interface SubjectService {
    List<SubjectResponse> findAll();
    SubjectResponse findById(String id);
    SubjectResponse create(SubjectRequest request);
    SubjectResponse update(String id, SubjectRequest request);
    void delete(String id);
}