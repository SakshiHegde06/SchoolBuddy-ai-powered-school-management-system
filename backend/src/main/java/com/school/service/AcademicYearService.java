package com.school.service;

import com.school.dto.request.AcademicYearRequest;
import com.school.dto.response.AcademicYearResponse;

import java.util.List;

public interface AcademicYearService {

    List<AcademicYearResponse> findAll();

    AcademicYearResponse findById(String id);

    AcademicYearResponse create(AcademicYearRequest request);

    AcademicYearResponse update(String id, AcademicYearRequest request);

    void delete(String id);

    /** Marks this year current and un-marks every other year. */
    AcademicYearResponse setCurrent(String id);
}
