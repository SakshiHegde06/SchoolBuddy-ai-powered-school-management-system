package com.school.dto;

import java.util.List;
import java.util.Map;

public class TimetableSaveRequest {
    private String classId;
    private String className;
    private List<TimeSlotDto> timeSlots;
    private List<SubjectMappingDto> subjectMappings;
    private Map<String, CellDataDto> gridData;

    public TimetableSaveRequest() {}

    public String getClassId() {
        return classId;
    }

    public void setClassId(String classId) {
        this.classId = classId;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public List<TimeSlotDto> getTimeSlots() {
        return timeSlots;
    }

    public void setTimeSlots(List<TimeSlotDto> timeSlots) {
        this.timeSlots = timeSlots;
    }

    public List<SubjectMappingDto> getSubjectMappings() {
        return subjectMappings;
    }

    public void setSubjectMappings(List<SubjectMappingDto> subjectMappings) {
        this.subjectMappings = subjectMappings;
    }

    public Map<String, CellDataDto> getGridData() {
        return gridData;
    }

    public void setGridData(Map<String, CellDataDto> gridData) {
        this.gridData = gridData;
    }

    // --- Inner Static DTO Classes ---

    public static class TimeSlotDto {
        private Object id;
        private String label;

        public TimeSlotDto() {}

        public Object getId() { return id; }
        public void setId(Object id) { this.id = id; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }

    public static class SubjectMappingDto {
        private String subject;
        private String teacher;

        public SubjectMappingDto() {}

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getTeacher() { return teacher; }
        public void setTeacher(String teacher) { this.teacher = teacher; }
    }

    public static class CellDataDto {
        private String subject;
        private String teacher;

        public CellDataDto() {}

        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getTeacher() { return teacher; }
        public void setTeacher(String teacher) { this.teacher = teacher; }
    }
}