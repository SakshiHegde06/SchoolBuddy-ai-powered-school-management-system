
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

    private String subjectId;

    private String academicYearId;

    private String term;

    private MarkType type;

    private double marksObtained;

    private double maxMarks;

    private String enteredBy; // teacherId

    private LocalDate date;
}