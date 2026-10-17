package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicYearResponse {
    private String id;
    private String label;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isCurrent;
}