package com.school.controller;

import com.school.dto.response.TranscriptReportDto;
import com.school.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/transcript/{studentId}")
    public ResponseEntity<TranscriptReportDto> getStudentTranscript(@PathVariable String studentId) {
        TranscriptReportDto report = reportService.generateStudentTranscript(studentId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/verify/{verificationCode}")
    public ResponseEntity<TranscriptReportDto> verifyTranscript(@PathVariable String verificationCode) {
        TranscriptReportDto report = reportService.verifyTranscriptByCode(verificationCode);
        return ResponseEntity.ok(report);
    }
}
