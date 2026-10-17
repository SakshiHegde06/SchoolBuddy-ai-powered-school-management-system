package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class McqQuestionDto {
    private int id;
    private String question;
    private List<String> options;
    private int correctOptionIndex; // 0, 1, 2, or 3
    private String explanation;
    private String difficulty; // "Easy", "Medium", "Hard"
}
