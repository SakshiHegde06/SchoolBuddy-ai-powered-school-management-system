package com.school.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponse {
    private String id;
    private String userId;
    private String name;
    private String email;
    private String phone;
    private String address;
    private List<String> subjectIds;
    private List<String> classIds;
    private Integer maxWeeklyHours;
    private String classTeacherOf;
}