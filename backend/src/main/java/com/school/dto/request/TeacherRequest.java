package com.school.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class TeacherRequest {

    @NotBlank
    private String name;

    @NotBlank
    @Email
    private String email;

    // Only required when creating a new teacher (a new login account).
    // Leave blank on update to keep the existing password.
    private String password;

    private String phone;

    private String address;

    private List<String> subjectIds;

    private List<String> classIds;

    private Integer maxWeeklyHours;
}
