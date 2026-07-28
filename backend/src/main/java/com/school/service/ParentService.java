package com.school.service;

import com.school.dto.request.ParentRequest;
import com.school.dto.response.ParentResponse;

import java.util.List;

public interface ParentService {
    List<ParentResponse> findAll();
    ParentResponse findById(String id);
    ParentResponse create(ParentRequest request);
    ParentResponse update(String id, ParentRequest request);
    void delete(String id);
}