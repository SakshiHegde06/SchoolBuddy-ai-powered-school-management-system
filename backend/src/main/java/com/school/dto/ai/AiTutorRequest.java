package com.school.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiTutorRequest {
    /**
     * Mode of AI assistance:
     * - "TOPICS": Important syllabus topics in bullet points
     * - "MCQ": Multiple choice questions with answers and explanations
     * - "5M": 5-mark short answer / conceptual questions with model answers
     * - "10M": 10-mark long answer / essay questions with detailed rubrics
     * - "CHAT": Interactive Q&A for student's doubts (strictly educational)
     */
    private String mode;

    /**
     * Optional student query / question for chat or custom doubt
     */
    private String query;

    /**
     * ID of the study material being analyzed (if applicable)
     */
    private String materialId;

    /**
     * Subject name (e.g. Mathematics, Science, Physics, English)
     */
    private String subject;

    /**
     * Specific topic / document title
     */
    private String topic;

    /**
     * Optional grade or educational level
     */
    private String classLevel;
}
