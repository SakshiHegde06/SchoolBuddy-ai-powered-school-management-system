package com.school.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.dto.ai.GenerateTimetableRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiTimetableService {

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${openai.api.key:mock-key}")
    private String apiKey;

    public AiTimetableService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    public String generateMasterSchedule(GenerateTimetableRequest request) {
        try {
            String inputJson = objectMapper.writeValueAsString(request);

            String systemPrompt = """
                You are an expert AI Master School Timetable Scheduler.
                
                YOUR GOAL:
                Generate a conflict-free timetable for all requested classes from Monday to Friday.
                
                STRICT CONSTRAINTS:
                1. NO TEACHER CONFLICTS: A teacher CANNOT be assigned to two different classes during the same day and period.
                2. RESPECT PERIOD COUNTS: Each subject for each class must be scheduled EXACTLY for its requested 'periodsPerWeek'.
                3. LUNCH BREAK: Insert a fixed 'LUNCH' break slot according to the requested lunch timing.
                4. FILL ALL SLOTS: If periods exceed subject demand, fill empty slots with 'Free Period'.
                
                OUTPUT FORMAT:
                Return ONLY valid JSON matching this structure without markdown formatting:
                {
                  "timetables": [
                    {
                      "className": "Class 8A",
                      "schedule": [
                        {
                          "periodNumber": 1,
                          "timeSlot": "08:30 - 09:15",
                          "monday": { "subject": "Maths", "teacherName": "Mr. Smith" },
                          "tuesday": { "subject": "Science", "teacherName": "Mrs. Davis" },
                          "wednesday": { "subject": "English", "teacherName": "Mr. Smith" },
                          "thursday": { "subject": "Maths", "teacherName": "Mr. Smith" },
                          "friday": { "subject": "Science", "teacherName": "Mrs. Davis" }
                        }
                      ]
                    }
                  ]
                }
                """;

            if ("mock-key".equals(apiKey) || apiKey.isBlank()) {
                return generateFallbackMockJson(request);
            }

            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-4o-mini");
            body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", "Generate schedule for: " + inputJson)
            ));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            List choices = (List) response.getBody().get("choices");
            Map firstChoice = (Map) choices.get(0);
            Map message = (Map) firstChoice.get("message");
            
            String content = (String) message.get("content");
            return content.replaceAll("```json", "").replaceAll("```", "").trim();

        } catch (Exception e) {
            return generateFallbackMockJson(request);
        }
    }

    private String generateFallbackMockJson(GenerateTimetableRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"timetables\":[");
        
        for (int c = 0; c < request.getClasses().size(); c++) {
            var cls = request.getClasses().get(c);
            if (c > 0) sb.append(",");
            sb.append("{\"className\":\"").append(cls.getClassName()).append("\",\"schedule\":[");
            
            for (int p = 1; p <= 6; p++) {
                if (p > 1) sb.append(",");
                var sub = !cls.getSubjects().isEmpty() ? cls.getSubjects().get((p - 1) % cls.getSubjects().size()) : null;
                String subName = sub != null ? sub.getSubjectName() : "Self Study";
                String tName = sub != null ? sub.getTeacherName() : "N/A";

                sb.append(String.format("""
                    {
                      "periodNumber": %d,
                      "timeSlot": "Period %d",
                      "monday": { "subject": "%s", "teacherName": "%s" },
                      "tuesday": { "subject": "%s", "teacherName": "%s" },
                      "wednesday": { "subject": "%s", "teacherName": "%s" },
                      "thursday": { "subject": "%s", "teacherName": "%s" },
                      "friday": { "subject": "%s", "teacherName": "%s" }
                    }
                    """, p, p, subName, tName, subName, tName, subName, tName, subName, tName, subName, tName));
            }
            sb.append("]}");
        }
        sb.append("]}");
        return sb.toString();
    }
}