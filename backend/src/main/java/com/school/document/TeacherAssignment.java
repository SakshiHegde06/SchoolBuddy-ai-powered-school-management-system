package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

/**
 * Formally establishes the relationship: Teacher teaches (Subject) in (Class).
 *
 * This entity replaces the loose Teacher.classIds[] and Teacher.subjectIds[] arrays.
 * Now we can definitively answer: "Does Teacher X teach Subject Y in Class Z?"
 *
 * Example:
 *   Priya (Teacher)
 *     ├── TeacherAssignment { teacherId: "priya", classId: "8A", subjectId: "science" }
 *     ├── TeacherAssignment { teacherId: "priya", classId: "9A", subjectId: "science" }
 *     └── TeacherAssignment { teacherId: "priya", classId: "10B", subjectId: "biology" }
 *
 * This enables:
 *   - Automatic student list: "Get all students in Class 8A"
 *   - Authorization: "Is Priya assigned to teach Science in Class 8A?" → YES
 *   - Audit trail: Track when Priya was assigned and unassigned
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "teacherAssignments")
public class TeacherAssignment {

    @Id
    private String id;

    // The teacher being assigned
    private String teacherId;

    // The class they teach in
    private String classId;

    // The subject they teach
    private String subjectId;

    // When this assignment becomes effective
    private LocalDate effectiveFrom;

    // When this assignment ends (nullable = ongoing)
    private LocalDate effectiveTo;

    // Is this teacher the class teacher for this class?
    // (Usually, a class has one primary "class teacher" who handles admin duties)
    private boolean classTeacher;

    // Optional: notes about the assignment
    private String notes;

    public boolean isClassTeacher() {
        return classTeacher;
    }

    public void setClassTeacher(boolean classTeacher) {
        this.classTeacher = classTeacher;
    }
}
