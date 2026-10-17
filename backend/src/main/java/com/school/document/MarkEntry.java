package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "marks")
public class MarkEntry {

    @Id
    private String id;

    private String studentId;

    private String classId;  // Which class was the student in when marks were entered

    private String subjectId;

    private String academicYearId;

    private String term;

    private MarkType type;

    private double marksObtained;

    private double maxMarks;

    private String enteredBy; // teacherId

    private LocalDate date;

    // Optional link to the admin-defined Exam this entry was recorded against
    private String examId;

    // DRAFT = only visible to the teacher/admin who entered it.
    // PUBLISHED = visible to the student and their parent(s).
    @Builder.Default
    private MarkStatus status = MarkStatus.DRAFT;
}