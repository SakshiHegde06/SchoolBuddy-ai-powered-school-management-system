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

    private String teacherId;

    private String teacherName;

    private String remark;

    @Builder.Default
    private Instant createdAt = Instant.now();
}