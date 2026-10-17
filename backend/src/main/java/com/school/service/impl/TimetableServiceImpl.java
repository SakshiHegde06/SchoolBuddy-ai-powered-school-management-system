package com.school.service.impl;

import com.school.document.SchoolClass;
import com.school.document.Subject;
import com.school.document.Teacher;
import com.school.document.TeacherAssignment;
import com.school.document.Timetable;
import com.school.document.TimetableEntry;
import com.school.dto.TimetableSaveRequest;
import com.school.dto.request.GenerateTimetableRequest;
import com.school.repository.ClassRepository;
import com.school.repository.SubjectRepository;
import com.school.repository.TeacherAssignmentRepository;
import com.school.repository.TeacherRepository;
import com.school.repository.TimetableRepository;
import com.school.service.TimetableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository timetableRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;

    private boolean isSpecialActivityOrBreak(String subject) {
        if (subject == null) return false;
        String s = subject.trim().toLowerCase();
        return s.contains("lunch") || s.contains("break") || s.contains("assembly")
                || s.contains("recess") || s.contains("study hall") || s.contains("free period")
                || s.equals("library");
    }

    @Override
    public Timetable saveOrUpdateTimetable(Timetable timetable) {
        Optional<Timetable> existing = timetableRepository.findByClassId(timetable.getClassId());
        if (existing.isEmpty() && timetable.getClassName() != null) {
            existing = timetableRepository.findByClassName(timetable.getClassName());
        }
        existing.ifPresent(t -> timetable.setId(t.getId()));

        return timetableRepository.save(timetable);
    }

    @Override
    public Timetable getByClassId(String classId) {
        Timetable t = timetableRepository.findByClassId(classId)
                .or(() -> timetableRepository.findByClassName(classId))
                .orElse(null);

        if (t != null && t.getEntries() != null) {
            Map<String, String> subjectNameById = null;
            Map<String, String> subjectIdByName = null;
            Map<String, String> teacherNameById = null;
            boolean modified = false;

            // Load official class assignments to self-heal any mismatched teachers or breaks
            List<TeacherAssignment> classAssignments = teacherAssignmentRepository != null
                    ? teacherAssignmentRepository.findByClassId(t.getClassId())
                    : Collections.emptyList();

            Map<String, String> assignedTeacherIdBySubjId = new HashMap<>();
            for (TeacherAssignment a : classAssignments) {
                if (a.getSubjectId() != null && a.getTeacherId() != null) {
                    assignedTeacherIdBySubjId.put(a.getSubjectId(), a.getTeacherId());
                }
            }

            for (TimetableEntry entry : t.getEntries()) {
                String sName = entry.getSubjectName();
                if (sName == null || sName.isBlank()) {
                    if (subjectNameById == null) {
                        subjectNameById = subjectRepository.findAll().stream()
                                .collect(Collectors.toMap(
                                        Subject::getId, Subject::getName, (a, b) -> a));
                    }
                    if (entry.getSubjectId() != null) {
                        sName = subjectNameById.getOrDefault(entry.getSubjectId(), entry.getSubjectId());
                        entry.setSubjectName(sName);
                        modified = true;
                    }
                }

                // 1. If it's a break or special activity, breaks NEVER have assigned teachers!
                if (isSpecialActivityOrBreak(sName)) {
                    if (entry.getTeacherId() != null || entry.getTeacherName() != null) {
                        entry.setTeacherId(null);
                        entry.setTeacherName(null);
                        modified = true;
                    }
                } else {
                    // 2. If it's an academic subject, verify against official teacher assignment for this class
                    String effectiveSubjId = entry.getSubjectId();
                    if ((effectiveSubjId == null || !assignedTeacherIdBySubjId.containsKey(effectiveSubjId)) && sName != null) {
                        if (subjectIdByName == null) {
                            subjectIdByName = subjectRepository.findAll().stream()
                                    .collect(Collectors.toMap(
                                            s -> s.getName().trim().toLowerCase(), Subject::getId, (a, b) -> a));
                        }
                        String lookupId = subjectIdByName.get(sName.trim().toLowerCase());
                        if (lookupId != null) {
                            effectiveSubjId = lookupId;
                        }
                    }

                    String officialTeacherId = effectiveSubjId != null ? assignedTeacherIdBySubjId.get(effectiveSubjId) : null;
                    if (officialTeacherId != null) {
                        // If current teacher is missing or doesn't match the officially assigned teacher for this subject:
                        if (entry.getTeacherId() == null || !entry.getTeacherId().equals(officialTeacherId)) {
                            entry.setTeacherId(officialTeacherId);
                            if (teacherNameById == null) {
                                teacherNameById = teacherRepository.findAll().stream()
                                        .collect(Collectors.toMap(
                                                Teacher::getId, Teacher::getName, (a, b) -> a));
                            }
                            entry.setTeacherName(teacherNameById.getOrDefault(officialTeacherId, officialTeacherId));
                            modified = true;
                        }
                    } else if (entry.getTeacherName() == null || entry.getTeacherName().isBlank()) {
                        if (teacherNameById == null) {
                            teacherNameById = teacherRepository.findAll().stream()
                                    .collect(Collectors.toMap(
                                            Teacher::getId, Teacher::getName, (a, b) -> a));
                        }
                        if (entry.getTeacherId() != null) {
                            entry.setTeacherName(teacherNameById.getOrDefault(entry.getTeacherId(), entry.getTeacherId()));
                        }
                    }
                }
            }

            // Persist the clean, self-healed schedule back to MongoDB
            if (modified) {
                timetableRepository.save(t);
            }
        }
        return t;
    }

    @Override
    public void deleteTimetableByClassId(String classId) {
        timetableRepository.deleteByClassId(classId);
    }

    @Override
    public Timetable generate(GenerateTimetableRequest request, String classId) {
        Timetable timetable = Timetable.builder()
                .classId(classId)
                .daysPerWeek(request != null && request.getDaysPerWeek() != null ? request.getDaysPerWeek() : 6)
                .periodsPerDay(request != null && request.getPeriodsPerDay() != null ? request.getPeriodsPerDay() : 7)
                .build();

        return saveOrUpdateTimetable(timetable);
    }

    @Override
    public Timetable saveFromGrid(String classId, TimetableSaveRequest request) {
        // Build name -> id lookups once, so we don't re-query per cell.
        Map<String, String> subjectIdByName = subjectRepository.findAll().stream()
                .collect(Collectors.toMap(
                        s -> s.getName().trim().toLowerCase(), Subject::getId, (a, b) -> a));
        Map<String, String> teacherIdByName = teacherRepository.findAll().stream()
                .collect(Collectors.toMap(
                        t -> t.getName().trim().toLowerCase(), Teacher::getId, (a, b) -> a));

        List<String> slotLabels = new ArrayList<>();
        if (request.getTimeSlots() != null) {
            for (TimetableSaveRequest.TimeSlotDto slot : request.getTimeSlots()) {
                if (slot != null && slot.getLabel() != null && !slot.getLabel().isBlank()) {
                    slotLabels.add(slot.getLabel().trim());
                }
            }
        }

        int daysPerWeek = 6; // Monday to Saturday
        int periodsPerDay = !slotLabels.isEmpty() ? slotLabels.size() : 7;

        List<TimetableEntry> entries = new ArrayList<>();
        Map<String, TimetableSaveRequest.CellDataDto> gridData = request.getGridData();

        if (gridData != null) {
            for (Map.Entry<String, TimetableSaveRequest.CellDataDto> cell : gridData.entrySet()) {
                // Key format from the frontend is "${slotIdx}-${dayIdx}"
                String[] parts = cell.getKey().split("-");
                if (parts.length != 2) continue;

                int periodIndex;
                int dayIndex;
                try {
                    periodIndex = Integer.parseInt(parts[0]);
                    dayIndex = Integer.parseInt(parts[1]);
                } catch (NumberFormatException ex) {
                    continue;
                }

                TimetableSaveRequest.CellDataDto data = cell.getValue();
                if (data == null || data.getSubject() == null || data.getSubject().isBlank()) {
                    continue;
                }

                String rawSubj = data.getSubject().trim();
                boolean isSpecial = isSpecialActivityOrBreak(rawSubj);

                String rawTeacher = (!isSpecial && data.getTeacher() != null) ? data.getTeacher().trim() : "";
                String subjectId = subjectIdByName.get(rawSubj.toLowerCase());
                String teacherId = (!rawTeacher.isEmpty() && !isSpecial) ? teacherIdByName.get(rawTeacher.toLowerCase()) : null;

                String slotLabel = periodIndex < slotLabels.size() ? slotLabels.get(periodIndex) : null;

                entries.add(TimetableEntry.builder()
                        .dayIndex(dayIndex)
                        .periodIndex(periodIndex)
                        .subjectId(subjectId != null ? subjectId : rawSubj)
                        .subjectName(rawSubj)
                        .teacherId(teacherId != null ? teacherId : (!rawTeacher.isEmpty() ? rawTeacher : null))
                        .teacherName(!rawTeacher.isEmpty() ? rawTeacher : null)
                        .timeSlot(slotLabel)
                        .build());
            }
        }

        String resolvedClassName = request.getClassName();
        if (classRepository != null) {
            Optional<SchoolClass> sc = classRepository.findById(classId);
            if (sc.isPresent()) {
                SchoolClass c = sc.get();
                resolvedClassName = c.getName() + (c.getSection() != null && !c.getSection().isBlank() ? " - " + c.getSection() : "");
            }
        }

        Timetable timetable = Timetable.builder()
                .classId(classId)
                .className(resolvedClassName != null ? resolvedClassName : classId)
                .daysPerWeek(daysPerWeek)
                .periodsPerDay(periodsPerDay)
                .timeSlots(slotLabels)
                .entries(entries)
                .build();

        return saveOrUpdateTimetable(timetable);
    }
}