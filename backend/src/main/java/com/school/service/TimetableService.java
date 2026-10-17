
package com.school.service;

import com.school.document.Timetable;
import com.school.dto.TimetableSaveRequest;
import com.school.dto.request.GenerateTimetableRequest;

public interface TimetableService {

    Timetable saveOrUpdateTimetable(Timetable timetable);

    Timetable getByClassId(String classId);

    void deleteTimetableByClassId(String classId);

    Timetable generate(GenerateTimetableRequest request, String classId);

    /**
     * Persists the manually-built grid coming from the admin Timetable
     * Generator page (TimetableGeneratorPage.jsx -> POST /api/timetable/save).
     * Resolves subject/teacher *names* in the grid to their actual
     * subjectId/teacherId where possible.
     */
    Timetable saveFromGrid(String classId, TimetableSaveRequest request);
}