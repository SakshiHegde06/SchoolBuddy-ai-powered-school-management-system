package com.school.service.impl;

import com.school.document.AcademicYear;
import com.school.dto.request.AcademicYearRequest;
import com.school.dto.response.AcademicYearResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.repository.AcademicYearRepository;
import com.school.service.AcademicYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicYearServiceImpl implements AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    @Override
    public List<AcademicYearResponse> findAll() {
        return academicYearRepository.findAllByOrderByStartDateDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AcademicYearResponse findById(String id) {
        return toResponse(getOrThrow(id));
    }

    private void validateAcademicYear(AcademicYearRequest request) {
        if (request.getLabel() == null || request.getLabel().trim().isEmpty()) {
            throw new IllegalArgumentException("Academic year label cannot be empty.");
        }

        int currentYear = java.time.LocalDate.now().getYear();
        int minYear = 2000;
        int maxAllowedYear = currentYear + 5; // e.g. 2031

        // 1. Validate dates if provided
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (!request.getStartDate().isBefore(request.getEndDate())) {
                throw new IllegalArgumentException("Start date must be before end date.");
            }
            if (request.getStartDate().getYear() < minYear || request.getStartDate().getYear() > maxAllowedYear) {
                throw new IllegalArgumentException(
                    "Start date year must be between " + minYear + " and " + maxAllowedYear + " (current year is " + currentYear + ")."
                );
            }
            if (request.getEndDate().getYear() < minYear || request.getEndDate().getYear() > maxAllowedYear + 1) {
                throw new IllegalArgumentException(
                    "End date year must be between " + minYear + " and " + (maxAllowedYear + 1) + "."
                );
            }
        }

        // 2. Validate label years (prevent unrealistic years like 2990)
        String label = request.getLabel().trim();
        java.util.regex.Pattern yearPattern = java.util.regex.Pattern.compile("\\b(\\d{4})\\b");
        java.util.regex.Matcher matcher = yearPattern.matcher(label);
        while (matcher.find()) {
            int y = Integer.parseInt(matcher.group(1));
            if (y < minYear || y > maxAllowedYear + 1) {
                throw new IllegalArgumentException(
                    "Academic year " + y + " is invalid. Allowed year range is " + minYear + " to " + maxAllowedYear + " (current year is " + currentYear + ")."
                );
            }
        }

        // Check if label is a pure number
        if (label.matches("^\\d+$")) {
            try {
                int y = Integer.parseInt(label);
                if (y < minYear || y > maxAllowedYear) {
                    throw new IllegalArgumentException(
                        "Academic year " + y + " is invalid. Allowed year range is " + minYear + " to " + maxAllowedYear + "."
                    );
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Academic year label is invalid.");
            }
        }

        // If formatted as YYYY-YYYY, enforce consecutive years
        if (label.matches("^\\d{4}-\\d{4}$")) {
            String[] parts = label.split("-");
            int y1 = Integer.parseInt(parts[0]);
            int y2 = Integer.parseInt(parts[1]);
            if (y2 != y1 + 1) {
                throw new IllegalArgumentException("Consecutive academic years expected (e.g. " + y1 + "-" + (y1 + 1) + ").");
            }
        }
    }

    @Override
    public AcademicYearResponse create(AcademicYearRequest request) {
        validateAcademicYear(request);
        AcademicYear year = AcademicYear.builder()
                .label(request.getLabel())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isCurrent(false)
                .build();
        year = academicYearRepository.save(year);

        if (request.isCurrent()) {
            return setCurrent(year.getId());
        }
        return toResponse(year);
    }

    @Override
    public AcademicYearResponse update(String id, AcademicYearRequest request) {
        validateAcademicYear(request);
        AcademicYear year = getOrThrow(id);
        year.setLabel(request.getLabel());
        year.setStartDate(request.getStartDate());
        year.setEndDate(request.getEndDate());
        year = academicYearRepository.save(year);

        if (request.isCurrent() && !year.isCurrent()) {
            return setCurrent(year.getId());
        }
        return toResponse(year);
    }

    @Override
    public void delete(String id) {
        academicYearRepository.delete(getOrThrow(id));
    }

    @Override
    public AcademicYearResponse setCurrent(String id) {
        AcademicYear target = getOrThrow(id);

        academicYearRepository.findByIsCurrentTrue().ifPresent(current -> {
            if (!current.getId().equals(id)) {
                current.setCurrent(false);
                academicYearRepository.save(current);
            }
        });

        target.setCurrent(true);
        return toResponse(academicYearRepository.save(target));
    }

    private AcademicYear getOrThrow(String id) {
        return academicYearRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic year not found: " + id));
    }

    private AcademicYearResponse toResponse(AcademicYear year) {
        return AcademicYearResponse.builder()
                .id(year.getId())
                .label(year.getLabel())
                .startDate(year.getStartDate())
                .endDate(year.getEndDate())
                .isCurrent(year.isCurrent())
                .build();
    }
}