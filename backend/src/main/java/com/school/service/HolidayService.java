package com.school.service;

import com.school.dto.request.HolidayRequest;
import com.school.dto.response.HolidayResponse;

import java.time.LocalDate;
import java.util.List;

public interface HolidayService {
    List<HolidayResponse> getAllHolidays();
    List<HolidayResponse> getHolidaysBetween(LocalDate start, LocalDate end);
    HolidayResponse createHoliday(HolidayRequest request);
    HolidayResponse updateHoliday(String id, HolidayRequest request);
    void deleteHoliday(String id);
}
