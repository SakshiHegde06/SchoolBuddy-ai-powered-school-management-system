package com.school.service.impl;

import com.school.client.AiServiceClient;
import com.school.document.MarkEntry;
import com.school.document.Subject;
import com.school.dto.ai.AiMarkPoint;
import com.school.dto.ai.AiPerformanceAnalysisRequest;
import com.school.dto.ai.AiSubjectSeries;
import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.repository.MarkRepository;
import com.school.repository.SubjectRepository;
import com.school.service.PerformanceAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// Orchestrates the "AI performance analysis" feature: pulls a student's mark
// history out of Mongo, packages it per subject, and hands it to the Python
// AI service (AiServiceClient) which does the actual linear-regression work.
// This service intentionally contains no ML math itself.
@Service
@RequiredArgsConstructor
public class PerformanceAnalysisServiceImpl implements PerformanceAnalysisService {

    private final MarkRepository markRepository;
    private final SubjectRepository subjectRepository;
    private final AiServiceClient aiServiceClient;

    @Override
    public PerformanceAnalysisResponse analyze(String studentId) {
        List<MarkEntry> marks = markRepository.findByStudentId(studentId);

        if (marks.isEmpty()) {
            return PerformanceAnalysisResponse.builder()
                    .studentId(studentId)
                    .riskLevel("INSUFFICIENT_DATA")
                    .overallAverage(0)
                    .summary("Not enough mark history yet to generate an analysis.")
                    .strengths(List.of())
                    .focusAreas(List.of())
                    .subjects(List.of())
                    .build();
        }

        Map<String, List<MarkEntry>> bySubject = marks.stream()
                .collect(Collectors.groupingBy(MarkEntry::getSubjectId));

        List<AiSubjectSeries> subjectSeries = bySubject.entrySet().stream()
                .map(entry -> AiSubjectSeries.builder()
                        .subjectId(entry.getKey())
                        .subjectName(subjectRepository.findById(entry.getKey())
                                .map(Subject::getName)
                                .orElse(entry.getKey()))
                        .marks(entry.getValue().stream()
                                .map(m -> AiMarkPoint.builder()
                                        .date(m.getDate())
                                        .marksObtained(m.getMarksObtained())
                                        .maxMarks(m.getMaxMarks())
                                        .build())
                                .toList())
                        .build())
                .toList();

        AiPerformanceAnalysisRequest request = AiPerformanceAnalysisRequest.builder()
                .studentId(studentId)
                .subjects(subjectSeries)
                .build();

        return aiServiceClient.getPerformanceAnalysis(request);
    }
}