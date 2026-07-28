package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

// Named SchoolClass because "Class" is a reserved identifier in Java.
// Maps to the "classes" collection and the /api/classes REST resource.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "classes")
public class SchoolClass {

    @Id
    private String id;

    private String name;     // e.g. "Grade 8"

    private String section;  // e.g. "A"

    private String academicYearId;

    private String classTeacherId;

    @Builder.Default
    private List<String> subjectIds = List.of();

    @Builder.Default
    private int studentCount = 0;
}