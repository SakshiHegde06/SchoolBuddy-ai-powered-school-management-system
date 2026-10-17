package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "remarks")
public class Remark {

    @Id
    private String id;

    private String studentId;

    private String classId;           // Which class was student in

    private String subjectId;         // Which subject is this remark for

    private String teacherId;        // Who gave the remark

    private String teacherName;       // Denormalized for easy display in UI

    private String examType;          // Which exam (FA1, FA2, Midterm, etc)

    private String remark;

    @Builder.Default
    private Instant createdAt = Instant.now();
}