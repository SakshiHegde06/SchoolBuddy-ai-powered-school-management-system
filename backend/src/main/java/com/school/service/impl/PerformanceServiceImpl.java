package com.school.service.impl;

import com.school.client.AiServiceClient;
import com.school.document.MarkEntry;
import com.school.document.Subject;
import com.school.dto.ai.MarkPointDto;
import com.school.dto.ai.PerformanceAnalysisRequestDto;
import com.school.dto.ai.SubjectSeriesDto;
import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.repository.MarkRepository;
import com.school.repository.SubjectRepository;
import com.school.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceServiceImpl implements PerformanceService {

    private final MarkRepository markRepository;
    private final SubjectRepository subjectRepository;
    private final AiServiceClient aiServiceClient;

    @Override
    public PerformanceAnalysisResponse analyzeStudent(String studentId) {
        List<MarkEntry> marks = markRepository.findByStudentId(studentId);

        Map<String, String> subjectNamesById = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(Subject::getId, Subject::getName));

        List<SubjectSeriesDto> subjectSeries = marks.stream()
                .collect(Collectors.groupingBy(MarkEntry::getSubjectId))
                .entrySet().stream()
                .map(entry -> toSubjectSeries(entry.getKey(), entry.getValue(), subjectNamesById))
                .toList();

        PerformanceAnalysisRequestDto request = PerformanceAnalysisRequestDto.builder()
                .studentId(studentId)
                .subjects(subjectSeries)
                .build();

        return aiServiceClient.getPerformanceAnalysis(request);
    }

    private SubjectSeriesDto toSubjectSeries(String subjectId, List<MarkEntry> subjectMarks,
                                              Map<String, String> subjectNamesById) {
        List<MarkPointDto> points = subjectMarks.stream()
                .map(m -> MarkPointDto.builder()
                        .date(m.getDate())
                        .marksObtained(m.getMarksObtained())
                        .maxMarks(m.getMaxMarks())
                        .build())
                .toList();

        return SubjectSeriesDto.builder()
                .subjectId(subjectId)
                .subjectName(subjectNamesById.getOrDefault(subjectId, "Unknown"))
                .marks(points)
                .build();
    }
}