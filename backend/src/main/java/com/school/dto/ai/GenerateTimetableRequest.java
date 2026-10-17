package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateTimetableRequest {
    private SchoolTimingDto timing;
    private List<ClassRequirementDto> classes;
}
