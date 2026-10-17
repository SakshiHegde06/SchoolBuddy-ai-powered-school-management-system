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
public class AiTutorResponse {
    private String mode;
    private String title;
    private String subject;

    /**
     * True if the student's request is purely academic/educational.
     * False if an off-topic query was intercepted by the guardrail.
     */
    private boolean academic;

    /**
     * Explanation displayed when off-topic query is rejected.
     */
    private String guardrailNotice;

    // --- TOPICS mode results ---
    private List<String> keyTopics;
    private List<String> coreDefinitions;
    private List<String> keyFormulasOrRules;
    private List<String> examFocusPoints;
    private List<String> commonPitfalls;

    // --- MCQ mode results ---
    private List<McqQuestionDto> mcqs;

    // --- 5M mode results ---
    private List<ExamQuestionDto> fiveMarkQuestions;

    // --- 10M mode results ---
    private List<ExamQuestionDto> tenMarkQuestions;

    // --- CHAT mode results ---
    private String chatAnswer;
    private List<String> followUpQuestions;
}
