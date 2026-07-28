package com.school.service;

import com.school.dto.request.RemarkRequest;
import com.school.dto.response.RemarkResponse;

import java.util.List;

public interface RemarkService {

    RemarkResponse create(RemarkRequest request, String teacherId);

    List<RemarkResponse> getByStudent(String studentId);

    void delete(String id);
}