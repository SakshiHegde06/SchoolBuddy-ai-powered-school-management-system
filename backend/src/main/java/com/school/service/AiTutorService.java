package com.school.service;

import com.school.dto.ai.AiTutorRequest;
import com.school.dto.ai.AiTutorResponse;

public interface AiTutorService {

    /**
     * Responds to an AI Tutor request for a specific study material ID.
     * Evaluates academic guardrails, analyzes document contents/metadata,
     * and generates topics, MCQs, 5M/10M questions, or chat answers.
     */
    AiTutorResponse getTutorResponseForMaterial(String materialId, AiTutorRequest request);

    /**
     * Responds to a general study inquiry or custom academic topic
     * with strict academic guardrails.
     */
    AiTutorResponse getTutorResponse(AiTutorRequest request);
}
