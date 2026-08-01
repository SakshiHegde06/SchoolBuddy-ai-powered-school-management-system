package com.school.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class HolidayRequest {

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private LocalDate date;

    private boolean recurring;
}
