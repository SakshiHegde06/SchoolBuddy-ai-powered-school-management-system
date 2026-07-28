package com.school.dto.response;

import com.school.document.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private String id;
    private String studentId;
    private String classId;
    private LocalDate date;
    private AttendanceStatus status;
    private String markedBy;
}