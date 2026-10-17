package com.school.controller;

import com.school.dto.TimetableSaveRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.school.security.CustomUserDetails;
import com.school.document.Timetable;
import com.school.dto.response.TimetableResponse;
import com.school.service.TimetableService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.school.service.TeacherAssignmentService;

import java.util.Map;
import com.school.dto.ai.GenerateTimetableRequest;
import com.school.service.AiTimetableService;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/timetable")
@CrossOrigin(origins = "http://localhost:5173")
public class TimetableController {

    private final TeacherAssignmentService teacherAssignmentService;
    private final TimetableService timetableService;
    private final AiTimetableService aiTimetableService;

    public TimetableController(TeacherAssignmentService teacherAssignmentService,
                               TimetableService timetableService,
                               AiTimetableService aiTimetableService) {
        this.teacherAssignmentService = teacherAssignmentService;
        this.timetableService = timetableService;
        this.aiTimetableService = aiTimetableService;
    }

    @PostMapping("/ai-generate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> generateAiTimetable(@RequestBody GenerateTimetableRequest request) {
        try {
            String scheduleJson = aiTimetableService.generateMasterSchedule(request);
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(scheduleJson);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "AI Timetable Generation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveTimetable(@RequestBody TimetableSaveRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        try {
            String classId = request.getClassId() != null && !request.getClassId().isBlank()
                    ? request.getClassId()
                    : request.getClassName();
            System.out.println("Received Class: " + classId);
            System.out.println("Received Grid Entries: " + (request.getGridData() == null ? 0 : request.getGridData().size()));

            String principalRef = principal != null && principal.getUser() != null ? principal.getUser().getRefId() : null;
            String role = principal != null && principal.getUser() != null && principal.getUser().getRole() != null
                    ? principal.getUser().getRole().name()
                    : null;

            if (role != null && !"ADMIN".equalsIgnoreCase(role)) {
                if (!teacherAssignmentService.isTeacherAssignedToClassSubject(principalRef, classId, null)) {
                    throw new org.springframework.security.access.AccessDeniedException("Teacher not assigned to this class");
                }
            }

            timetableService.saveFromGrid(classId, request);

            return ResponseEntity.ok(Map.of("message", "Timetable saved successfully!"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error saving timetable: " + e.getMessage());
        }
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<TimetableResponse> getTimetableByClass(@PathVariable String classId) {
        Timetable t = timetableService.getByClassId(classId);
        if (t == null) {
            return ResponseEntity.ok(null);
        }

        TimetableResponse resp = new TimetableResponse();
        resp.setId(t.getId());
        resp.setClassId(t.getClassId());
        resp.setClassName(t.getClassName());
        resp.setDaysPerWeek(t.getDaysPerWeek() != null ? t.getDaysPerWeek() : 6);
        resp.setPeriodsPerDay(t.getPeriodsPerDay() != null ? t.getPeriodsPerDay() : (t.getTimeSlots() != null && !t.getTimeSlots().isEmpty() ? t.getTimeSlots().size() : 7));
        resp.setTimeSlots(t.getTimeSlots());
        resp.setEntries(t.getEntries());

        return ResponseEntity.ok(resp);
    }
}