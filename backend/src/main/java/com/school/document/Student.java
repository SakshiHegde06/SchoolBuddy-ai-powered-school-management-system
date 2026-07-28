package com.school.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "students")
public class Student {

    @Id
    private String id;

    private String userId;

    private String name;

    private String email;

    private LocalDate dob;

    private String classId;

    private String section;

    @Builder.Default
    private List<String> parentIds = List.of();

    private String admissionNumber;

    private String rollNumber;
}