package com.school.service.impl;

import com.school.document.Announcement;
import com.school.document.Parent;
import com.school.document.Student;
import com.school.dto.request.AnnouncementRequest;
import com.school.dto.response.AnnouncementResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.AnnouncementMapper;
import com.school.repository.AnnouncementRepository;
import com.school.repository.ParentRepository;
import com.school.repository.StudentRepository;
import com.school.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;

    @Override
    public List<AnnouncementResponse> findAll() {

        return announcementRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AnnouncementMapper::toResponse)
                .toList();

    }

    @Override
    public List<AnnouncementResponse> findVisibleTo(String role, String refId) {
        List<Announcement> all = announcementRepository.findAllByOrderByCreatedAtDesc();

        if (role == null || "ADMIN".equals(role)) {
            return all.stream().map(AnnouncementMapper::toResponse).toList();
        }

        // Which classIds are relevant to this viewer, if any (only matters for STUDENT/PARENT audience filtering)
        Set<String> viewerClassIds;
        if ("STUDENT".equals(role) && refId != null) {
            Student student = studentRepository.findById(refId).orElse(null);
            viewerClassIds = student != null && student.getClassId() != null
                    ? Set.of(student.getClassId()) : Set.of();
        } else if ("PARENT".equals(role) && refId != null) {
            Parent parent = parentRepository.findById(refId).orElse(null);
            viewerClassIds = parent == null ? Set.of() : parent.getChildrenIds().stream()
                    .map(studentRepository::findById)
                    .filter(java.util.Optional::isPresent)
                    .map(java.util.Optional::get)
                    .map(Student::getClassId)
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toSet());
        } else {
            viewerClassIds = Set.of();
        }

        String finalRole = role;
        return all.stream()
                .filter(a -> a.getAudienceRoles() == null || a.getAudienceRoles().isEmpty()
                        || a.getAudienceRoles().contains(finalRole))
                .filter(a -> {
                    // Class targeting only applies to STUDENT/PARENT audiences
                    if (!"STUDENT".equals(finalRole) && !"PARENT".equals(finalRole)) return true;
                    if (a.getAudienceClassIds() == null || a.getAudienceClassIds().isEmpty()) return true;
                    return a.getAudienceClassIds().stream().anyMatch(viewerClassIds::contains);
                })
                .map(AnnouncementMapper::toResponse)
                .toList();
    }

    @Override
    public AnnouncementResponse create(AnnouncementRequest request) {

        Announcement announcement = Announcement.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .priority(request.getPriority())
                .audienceRoles(request.getAudienceRoles() != null ? request.getAudienceRoles() : List.of())
                .audienceClassIds(request.getAudienceClassIds() != null ? request.getAudienceClassIds() : List.of())
                .createdAt(Instant.now())
                .build();

        announcement = announcementRepository.save(announcement);

        return AnnouncementMapper.toResponse(announcement);
    }

    @Override
    public AnnouncementResponse update(String id, AnnouncementRequest request) {

        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found: " + id));

        announcement.setTitle(request.getTitle());
        announcement.setMessage(request.getMessage());
        announcement.setPriority(request.getPriority());
        announcement.setAudienceRoles(request.getAudienceRoles() != null ? request.getAudienceRoles() : List.of());
        announcement.setAudienceClassIds(request.getAudienceClassIds() != null ? request.getAudienceClassIds() : List.of());
        announcement.setUpdatedAt(Instant.now());

        announcement = announcementRepository.save(announcement);

        return AnnouncementMapper.toResponse(announcement);
    }

    @Override
    public void delete(String id) {

        announcementRepository.deleteById(id);

    }
}