package com.school.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTimetableRequest {
    private Integer daysPerWeek;
    private Integer periodsPerDay;
}