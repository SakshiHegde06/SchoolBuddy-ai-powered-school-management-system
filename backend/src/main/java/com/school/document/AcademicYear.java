package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "academic_years")
public class AcademicYear {

    @Id
    private String id;

    private String label; // e.g. "2026-2027"

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private boolean isCurrent = false;
}