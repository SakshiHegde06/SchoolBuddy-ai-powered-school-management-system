package com.school.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class StudentRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    private String password;

    private LocalDate dob;

    @NotBlank
    private String classId;

    private String section;

    private List<String> parentIds;

    private String admissionNumber;

    private String rollNumber;
}