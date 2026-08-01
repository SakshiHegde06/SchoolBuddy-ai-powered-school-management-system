package com.school.dto.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class HolidayResponse {

    private String id;

    private String title;

    private String description;

    private LocalDate date;

    private boolean recurring;
}
