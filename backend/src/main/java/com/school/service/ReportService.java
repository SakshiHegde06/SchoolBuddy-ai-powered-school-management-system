package com.school.service;

import com.school.dto.response.TranscriptReportDto;

public interface ReportService {
    TranscriptReportDto generateStudentTranscript(String studentId);
    TranscriptReportDto verifyTranscriptByCode(String verificationCode);
}
