package com.school.dto.response;

import com.school.document.MarkType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResponse {
    private String id;
    private String name;
    private String classId;
    private String subjectId;
    private MarkType type;
    private double maxMarks;
    private LocalDate startDate;
    private LocalDate endDate;
    private String academicYearId;
}