package com.school.service.impl;
import com.school.service.AiServiceClient;
import com.school.document.MarkEntry;
import com.school.document.MarkStatus;
import com.school.document.Student;
import com.school.document.Subject;
import com.school.dto.ai.MarkPointDto;
import com.school.dto.ai.PerformanceAnalysisRequestDto;
import com.school.dto.ai.SubjectSeriesDto;
import com.school.dto.response.ClassPerformanceResponse;
import com.school.dto.response.PerformanceAnalysisResponse;
import com.school.repository.MarkRepository;
import com.school.repository.StudentRepository;
import com.school.repository.SubjectRepository;
import com.school.service.PerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PerformanceServiceImpl implements PerformanceService {

    private static final double PASS_THRESHOLD_PERCENT = 35.0;
    private static final double NEEDS_ATTENTION_THRESHOLD_PERCENT = 40.0;

    private final MarkRepository markRepository;
    private final SubjectRepository subjectRepository;
    private final StudentRepository studentRepository;
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

    @Override
    public ClassPerformanceResponse getClassPerformance(String classId, String subjectId) {
        List<MarkEntry> marks = (subjectId == null || subjectId.isBlank())
                ? markRepository.findByClassId(classId)
                : markRepository.findByClassIdAndSubjectId(classId, subjectId);

        // Only published marks count towards analytics students/teachers would act on together
        marks = marks.stream().filter(m -> m.getStatus() == MarkStatus.PUBLISHED).toList();

        Map<String, List<MarkEntry>> byStudent = marks.stream()
                .collect(Collectors.groupingBy(MarkEntry::getStudentId));

        Map<String, String> studentNamesById = studentRepository.findAllById(byStudent.keySet()).stream()
                .collect(Collectors.toMap(Student::getId, Student::getName));

        List<ClassPerformanceResponse.StudentAverage> studentAverages = byStudent.entrySet().stream()
                .map(e -> {
                    double totalObtained = e.getValue().stream().mapToDouble(MarkEntry::getMarksObtained).sum();
                    double totalMax = e.getValue().stream().mapToDouble(MarkEntry::getMaxMarks).sum();
                    double pct = totalMax > 0 ? (totalObtained / totalMax) * 100.0 : 0.0;
                    return ClassPerformanceResponse.StudentAverage.builder()
                            .studentId(e.getKey())
                            .studentName(studentNamesById.getOrDefault(e.getKey(), "Unknown"))
                            .averagePercent(round1(pct))
                            .build();
                })
                .sorted(Comparator.comparingDouble(ClassPerformanceResponse.StudentAverage::getAveragePercent))
                .toList();

        if (studentAverages.isEmpty()) {
            return ClassPerformanceResponse.builder()
                    .classId(classId)
                    .subjectId(subjectId)
                    .studentCount(0)
                    .averagePercent(0)
                    .highestPercent(0)
                    .lowestPercent(0)
                    .passPercentage(0)
                    .studentsNeedingAttention(List.of())
                    .build();
        }

        double average = studentAverages.stream().mapToDouble(ClassPerformanceResponse.StudentAverage::getAveragePercent).average().orElse(0);
        double highest = studentAverages.get(studentAverages.size() - 1).getAveragePercent();
        double lowest = studentAverages.get(0).getAveragePercent();
        long passingCount = studentAverages.stream().filter(s -> s.getAveragePercent() >= PASS_THRESHOLD_PERCENT).count();
        double passPct = (passingCount * 100.0) / studentAverages.size();

        List<ClassPerformanceResponse.StudentAverage> needingAttention = studentAverages.stream()
                .filter(s -> s.getAveragePercent() < NEEDS_ATTENTION_THRESHOLD_PERCENT)
                .limit(10)
                .toList();

        return ClassPerformanceResponse.builder()
                .classId(classId)
                .subjectId(subjectId)
                .studentCount(studentAverages.size())
                .averagePercent(round1(average))
                .highestPercent(highest)
                .lowestPercent(lowest)
                .passPercentage(round1(passPct))
                .studentsNeedingAttention(needingAttention)
                .build();
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
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