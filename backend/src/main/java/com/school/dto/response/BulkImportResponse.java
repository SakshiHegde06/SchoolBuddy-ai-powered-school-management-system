package com.school.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class BulkImportResponse {
    private int createdParents;
    private int createdStudents;
    private int skippedRows;
    private List<ImportResultItem> details;
}
