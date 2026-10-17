package com.school.dto.response;

import com.school.document.TimetableEntry;
import lombok.Data;

import java.util.List;

@Data
public class TimetableResponse {
    private String id;
    private String classId;
    private String className;
    private int daysPerWeek;
    private int periodsPerDay;
    private List<String> timeSlots;
    private List<TimetableEntry> entries;
}
