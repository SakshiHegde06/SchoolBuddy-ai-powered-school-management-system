

package com.school.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTimetableRequest {

    @JsonProperty("class_name")
    private String className;

    @JsonProperty("subjects")
    private List<SubjectConfigDto> subjects;
}