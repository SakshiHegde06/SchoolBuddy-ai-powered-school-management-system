package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassResponse {
    private String id;
    private String name;
    private String section;
    private String academicYearId;
    private String classTeacherId;
    private List<String> subjectIds;
    private int studentCount;
}
