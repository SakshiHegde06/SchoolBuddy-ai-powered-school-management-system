package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassSubjectRequirementDto {
    private String subjectName;
    private String teacherId;
    private String teacherName;
    private int periodsPerWeek;
}