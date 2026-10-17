package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectSeriesDto {
    private String subjectId;
    private String subjectName;
    private List<MarkPointDto> marks;
}