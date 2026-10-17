package com.school.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceAnalysisRequestDto {

    @JsonProperty("student_id")
    private String studentId;

    @JsonProperty("subjects")
    private List<SubjectSeriesDto> subjects;
}