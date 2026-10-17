package com.school.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTimetableResponse {

    @JsonProperty("status")
    private String status;

    @JsonProperty("schedule")
    private Map<String, List<String>> schedule; // Adjust structure based on your Python API output
}