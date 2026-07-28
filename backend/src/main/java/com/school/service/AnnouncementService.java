package com.school.service;

import com.school.dto.request.AnnouncementRequest;
import com.school.dto.response.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {

    List<AnnouncementResponse> findAll();

    AnnouncementResponse create(AnnouncementRequest request);

    void delete(String id);

}