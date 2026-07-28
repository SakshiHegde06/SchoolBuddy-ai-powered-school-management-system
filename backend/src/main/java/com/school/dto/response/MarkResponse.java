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
public class MarkResponse {
    private String id;
    private String studentId;
    private String subjectId;
    private String academicYearId;
    private String term;
    private MarkType type;
    private double marksObtained;
    private double maxMarks;
    private String enteredBy;
    private LocalDate date;
}