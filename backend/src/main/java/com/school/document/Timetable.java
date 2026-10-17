package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "timetables")
public class Timetable {

    @Id
    private String id;
    private String classId;
    private String className;
    private Integer daysPerWeek;
    private Integer periodsPerDay;
    private List<String> timeSlots;

    // Uses the top-level com.school.document.TimetableEntry (same package,
    // no import needed) — do NOT redeclare a nested TimetableEntry class
    // here again. TimetableResponse and everything else in the codebase
    // already depend on the top-level one; a nested class with the same
    // simple name silently shadows it and breaks type compatibility.
    private List<TimetableEntry> entries;
}