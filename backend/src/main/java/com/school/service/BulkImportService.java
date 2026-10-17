package com.school.service;

import com.school.dto.response.BulkImportResponse;
import org.springframework.web.multipart.MultipartFile;

public interface BulkImportService {
    BulkImportResponse importParentsAndStudents(MultipartFile file);
}
