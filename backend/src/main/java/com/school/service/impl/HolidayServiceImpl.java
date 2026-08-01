package com.school.service.impl;

import com.school.document.Holiday;
import com.school.dto.request.HolidayRequest;
import com.school.dto.response.HolidayResponse;
import com.school.exception.ResourceNotFoundException;
import com.school.mapper.HolidayMapper;
import com.school.repository.HolidayRepository;
import com.school.service.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository holidayRepository;

    @Override
    public List<HolidayResponse> getAllHolidays() {
        return holidayRepository.findAllByOrderByDateAsc().stream()
                .map(HolidayMapper::toResponse)
                .toList();
    }

    @Override
    public List<HolidayResponse> getHolidaysBetween(LocalDate start, LocalDate end) {
        return holidayRepository.findByDateBetweenOrderByDateAsc(start, end).stream()
                .map(HolidayMapper::toResponse)
                .toList();
    }

    @Override
    public HolidayResponse createHoliday(HolidayRequest request) {
        Holiday holiday = holidayRepository.save(HolidayMapper.toDocument(request));
        return HolidayMapper.toResponse(holiday);
    }

    @Override
    public HolidayResponse updateHoliday(String id, HolidayRequest request) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday not found: " + id));
        holiday.setTitle(request.getTitle());
        holiday.setDescription(request.getDescription());
        holiday.setDate(request.getDate());
        holiday.setRecurring(request.isRecurring());
        return HolidayMapper.toResponse(holidayRepository.save(holiday));
    }

    @Override
    public void deleteHoliday(String id) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday not found: " + id);
        }
        holidayRepository.deleteById(id);
    }
}
