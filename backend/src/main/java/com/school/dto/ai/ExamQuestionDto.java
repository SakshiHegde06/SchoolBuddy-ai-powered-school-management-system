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
public class ExamQuestionDto {
    private int id;
    private String question;
    private int marks; // 5 or 10
    private List<String> keyPoints; // Bullet points expected in the answer
    private String modelAnswer; // Complete model answer
    private String markingRubric; // Step-by-step mark distribution
    private String examTip; // Practical examiner tip
}
