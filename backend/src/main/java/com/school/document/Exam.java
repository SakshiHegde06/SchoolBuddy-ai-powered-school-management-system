package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

/**
 * Admin-defined assessment, e.g. "FA1" for Class 8 with a max of 20 marks.
 * Teachers select one of these on the bulk marks entry screen instead of
 * free-typing the term/exam name and max marks every time.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "exams")
public class Exam {

    @Id
    private String id;

    private String name; // e.g. "FA1", "Mid-Term", "Final Exam"

    private String classId;

    // Null = applies to every subject in the class
    private String subjectId;

    private MarkType type;

    private double maxMarks;

    private LocalDate startDate;

    private LocalDate endDate;

    private String academicYearId;
}