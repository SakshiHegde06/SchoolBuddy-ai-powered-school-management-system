package com.school.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceAnalysisResponseDto {

    @JsonProperty("status")
    private String status;

    @JsonProperty("analysis")
    private String analysis;

    @JsonProperty("recommendations")
    private String recommendations;
}
