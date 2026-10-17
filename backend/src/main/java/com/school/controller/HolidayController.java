package com.school.controller;

import com.school.dto.request.HolidayRequest;
import com.school.dto.response.HolidayResponse;
import com.school.service.HolidayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public List<HolidayResponse> getAll() {
        return holidayService.getAllHolidays();
    }

    @GetMapping("/range")
    public List<HolidayResponse> getRange(
            @RequestParam("start") String start,
            @RequestParam("end") String end) {
        return holidayService.getHolidaysBetween(
                java.time.LocalDate.parse(start), java.time.LocalDate.parse(end));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public HolidayResponse create(@Valid @RequestBody HolidayRequest request) {
        return holidayService.createHoliday(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public HolidayResponse update(@PathVariable String id, @Valid @RequestBody HolidayRequest request) {
        return holidayService.updateHoliday(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        holidayService.deleteHoliday(id);
    }
}
