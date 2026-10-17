package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassRequirementDto {
    private String className; // e.g. "Class 8A"
    private List<ClassSubjectRequirementDto> subjects;
}