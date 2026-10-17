package com.school.service;

import com.school.dto.request.AnnouncementRequest;
import com.school.dto.response.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {

    List<AnnouncementResponse> findAll();

    /** Announcements visible to this specific viewer (role + optional refId). ADMIN/null role sees everything. */
    List<AnnouncementResponse> findVisibleTo(String role, String refId);

    AnnouncementResponse create(AnnouncementRequest request);

    AnnouncementResponse update(String id, AnnouncementRequest request);

    void delete(String id);

}