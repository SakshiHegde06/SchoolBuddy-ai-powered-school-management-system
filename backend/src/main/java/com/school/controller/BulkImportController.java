package com.school.controller;

import com.school.dto.response.BulkImportResponse;
import com.school.service.BulkImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/import")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BulkImportController {

    private final BulkImportService bulkImportService;

    @PostMapping("/parents-students")
    @ResponseStatus(HttpStatus.OK)
    public BulkImportResponse importParentsAndStudents(@RequestParam("file") MultipartFile file) {
        return bulkImportService.importParentsAndStudents(file);
    }
}
