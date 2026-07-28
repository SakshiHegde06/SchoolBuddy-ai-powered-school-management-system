package com.school.controller;

import com.school.dto.request.AnnouncementRequest;
import com.school.dto.response.AnnouncementResponse;
import com.school.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @GetMapping
    public List<AnnouncementResponse> getAll() {

        return announcementService.findAll();

    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AnnouncementResponse create(
            @Valid @RequestBody AnnouncementRequest request
    ) {

        return announcementService.create(request);

    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(
            @PathVariable String id
    ) {

        announcementService.delete(id);

    }
}