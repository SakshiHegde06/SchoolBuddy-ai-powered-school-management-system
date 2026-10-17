package com.school.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectConfigDto {

    @JsonProperty("subject_name")
    private String subjectName;

    @JsonProperty("hours_per_week")
    private int hoursPerWeek;

    @JsonProperty("teacher_id")
    private String teacherId;
}