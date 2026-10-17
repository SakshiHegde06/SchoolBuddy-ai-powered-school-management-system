package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchoolTimingDto {
    private String startTime;    // e.g. "08:30"
    private String endTime;      // e.g. "15:30"
    private int periodDurationMinutes; // e.g. 45
    private String lunchStartTime; // e.g. "12:00"
    private int lunchDurationMinutes;  // e.g. 45
}