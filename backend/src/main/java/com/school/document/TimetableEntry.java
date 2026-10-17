package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimetableEntry {
    // Day index 0=Monday .. 5=Saturday (configurable by caller)
    private int dayIndex;
    // Period index within day, 0-based
    private int periodIndex;
    private String subjectId;
    private String subjectName;
    private String teacherId;
    private String teacherName;
    private String timeSlot;
    // optional flag: whether this entry requires a lab
    @Field("lab")
    private boolean lab;
}
