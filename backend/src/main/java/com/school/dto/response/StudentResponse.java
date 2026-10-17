package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {
    private String id;
    private String userId;
    private String name;
    private String email;
    private LocalDate dob;
    private String classId;
    private String section;
    private List<String> parentIds;
    private String admissionNumber;
    private String rollNumber;
}
