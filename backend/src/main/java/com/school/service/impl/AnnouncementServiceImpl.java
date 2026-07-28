package com.school.service.impl;

import com.school.document.Announcement;
import com.school.dto.request.AnnouncementRequest;
import com.school.dto.response.AnnouncementResponse;
import com.school.mapper.AnnouncementMapper;
import com.school.repository.AnnouncementRepository;
import com.school.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    @Override
    public List<AnnouncementResponse> findAll() {

        return announcementRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AnnouncementMapper::toResponse)
                .toList();

    }

    @Override
    public AnnouncementResponse create(AnnouncementRequest request) {

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .priority(request.getPriority())
                .createdAt(Instant.now())
                .build();

        announcement = announcementRepository.save(announcement);

        return AnnouncementMapper.toResponse(announcement);
    }

    @Override
    public void delete(String id) {

        announcementRepository.deleteById(id);

    }
}