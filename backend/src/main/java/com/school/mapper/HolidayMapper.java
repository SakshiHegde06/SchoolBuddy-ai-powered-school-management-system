package com.school.mapper;

import com.school.document.Holiday;
import com.school.dto.request.HolidayRequest;
import com.school.dto.response.HolidayResponse;

public class HolidayMapper {

    public static Holiday toDocument(HolidayRequest request) {
        return Holiday.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .date(request.getDate())
                .recurring(request.isRecurring())
                .build();
    }

    public static HolidayResponse toResponse(Holiday holiday) {
        HolidayResponse response = new HolidayResponse();
        response.setId(holiday.getId());
        response.setTitle(holiday.getTitle());
        response.setDescription(holiday.getDescription());
        response.setDate(holiday.getDate());
        response.setRecurring(holiday.isRecurring());
        return response;
    }
}
