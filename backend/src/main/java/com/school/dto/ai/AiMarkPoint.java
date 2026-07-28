package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// One raw assessment point sent to the AI service. Field names are plain
// camelCase and rely on Jackson's default naming, which matches the
// FastAPI/Pydantic CamelModel aliases on the other side.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiMarkPoint {
    private LocalDate date;
    private double marksObtained;
    private double maxMarks;
}