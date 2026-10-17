import React, { useState, useEffect } from 'react';
import { timetableService } from '../../services/timetableService';
import { classService } from '../../services/classService';
import { subjectService } from '../../services/subjectService';
import { teacherService } from '../../services/teacherService';
import { teacherAssignmentService } from '../../services/teacherAssignmentService';
import {
  Plus,
  Trash2,
  Save,
  Clock,
  BookOpen,
  Loader2,
  Calendar,
  Coffee,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const DEFAULT_TIME_SLOTS = [
  { id: 1, label: '08:30 - 09:15' },
  { id: 2, label: '09:15 - 10:00' },
  { id: 3, label: '10:00 - 10:45' },
  { id: 4, label: '11:00 - 11:45' },
  { id: 5, label: '11:45 - 12:30' },
  { id: 6, label: '01:15 - 02:00' },
  { id: 7, label: '02:00 - 02:45' },
];

const SPECIAL_ACTIVITIES = [
  'Lunch Break',
  'Morning Assembly',
  'Physical Education / Sports',
  'Library',
  'Study Hall / Free Period',
];

export default function TimetableGeneratorPage() {
  // 1. Time Slots State
  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);

  // 2. Class Selection State
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // 3. Catalogs: Assigned subjects, All Subjects, and All Teachers
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // 4. Timetable Grid State: { "periodIndex-dayIndex": { subject, teacher, subjectId, teacherId } }
  const [grid, setGrid] = useState({});
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // --- 1. Load initial catalogs: classes, all subjects, all teachers ---
  useEffect(() => {
    let cancelled = false;
    setIsLoadingClasses(true);

    Promise.all([
      classService.list().catch(() => ({ data: [] })),
      subjectService.list().catch(() => ({ data: [] })),
      teacherService.list().catch(() => ({ data: [] })),
    ])
      .then(([classesRes, subjectsRes, teachersRes]) => {
        if (cancelled) return;
        const classList = classesRes.data || [];
        setClasses(classList);
        if (classList.length > 0) {
          setSelectedClassId(classList[0].id);
        }
        setAllSubjects(subjectsRes.data || []);
        setAllTeachers(teachersRes.data || []);
      })
      .catch((err) => {
        console.error('Failed to load initial data:', err);
        if (!cancelled) {
          setStatusMessage({ type: 'error', text: 'Failed to load school classes and subjects.' });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingClasses(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // --- 2. Whenever selectedClassId changes, load class assignments and existing timetable ---
  useEffect(() => {
    if (!selectedClassId) {
      setAssignedSubjects([]);
      setGrid({});
      return;
    }

    let cancelled = false;
    setIsLoadingCatalogs(true);
    setIsLoadingTimetable(true);
    setStatusMessage(null);

    // Fetch assignments for this class
    teacherAssignmentService
      .listByClass(selectedClassId)
      .then((res) => {
        if (cancelled) return;
        const assignments = res.data || [];
        const bySubject = new Map();
        assignments.forEach((a) => {
          if (a.subjectId && !bySubject.has(a.subjectId)) {
            bySubject.set(a.subjectId, {
              subjectId: a.subjectId,
              subject: a.subjectName,
              teacherId: a.teacherId,
              teacher: a.teacherName,
            });
          }
        });
        setAssignedSubjects(Array.from(bySubject.values()));
      })
      .catch((err) => {
        console.error('Error loading teacher assignments:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCatalogs(false);
      });

    // Fetch existing timetable for this class
    timetableService
      .getByClass(selectedClassId)
      .then((res) => {
        if (cancelled) return;
        const existing = res.data;

        if (existing && existing.entries && existing.entries.length > 0) {
          // If custom time slots were saved, restore them
          if (existing.timeSlots && existing.timeSlots.length > 0) {
            setTimeSlots(
              existing.timeSlots.map((slotLabel, idx) => ({
                id: idx + 1,
                label: slotLabel,
              }))
            );
          }

          const loadedGrid = {};
          existing.entries.forEach((entry) => {
            const rawSubj = entry.subjectName || entry.subjectId || '';
            const isSpecial = SPECIAL_ACTIVITIES.includes(rawSubj) ||
              rawSubj.toLowerCase().includes('lunch') ||
              rawSubj.toLowerCase().includes('assembly') ||
              rawSubj.toLowerCase().includes('break') ||
              rawSubj.toLowerCase().includes('recess') ||
              rawSubj.toLowerCase().includes('study hall') ||
              rawSubj.toLowerCase().includes('free period') ||
              rawSubj.toLowerCase() === 'library';

            loadedGrid[`${entry.periodIndex}-${entry.dayIndex}`] = {
              subjectId: entry.subjectId,
              teacherId: isSpecial ? '' : (entry.teacherId || ''),
              subject: rawSubj,
              teacher: isSpecial ? '' : (entry.teacherName || entry.teacherId || ''),
            };
          });
          setGrid(loadedGrid);
        } else {
          // Reset grid if no published timetable exists yet
          setGrid({});
          setTimeSlots(DEFAULT_TIME_SLOTS);
        }
      })
      .catch((err) => {
        console.error('No timetable published yet:', err);
        if (!cancelled) {
          setGrid({});
          setTimeSlots(DEFAULT_TIME_SLOTS);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTimetable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  // --- Handlers for Time Slots ---
  const handleAddTimeSlot = () => {
    const nextSlotIdx = timeSlots.length + 1;
    setTimeSlots([
      ...timeSlots,
      { id: Date.now(), label: `Period ${nextSlotIdx}` },
    ]);
  };

  const handleRemoveTimeSlot = (index) => {
    if (timeSlots.length <= 1) {
      alert('A timetable requires at least one period slot.');
      return;
    }
    const updated = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updated);

    // Re-index grid cells to match new slots
    setGrid((prev) => {
      const next = {};
      Object.entries(prev).forEach(([key, val]) => {
        const [pStr, dStr] = key.split('-');
        const p = parseInt(pStr, 10);
        if (p < index) {
          next[key] = val;
        } else if (p > index) {
          next[`${p - 1}-${dStr}`] = val;
        }
      });
      return next;
    });
  };

  const handleSlotChange = (index, value) => {
    const updated = [...timeSlots];
    updated[index].label = value;
    setTimeSlots(updated);
  };

  // --- Cell Editing Handlers ---
  const handleCellSubjectChange = (slotIdx, dayIdx, subjectName) => {
    const key = `${slotIdx}-${dayIdx}`;

    if (!subjectName) {
      setGrid((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const isSpecial = SPECIAL_ACTIVITIES.includes(subjectName) ||
      subjectName.toLowerCase().includes('lunch') ||
      subjectName.toLowerCase().includes('assembly') ||
      subjectName.toLowerCase().includes('break') ||
      subjectName.toLowerCase().includes('recess') ||
      subjectName.toLowerCase().includes('study hall') ||
      subjectName.toLowerCase().includes('free period') ||
      subjectName.toLowerCase() === 'library';

    if (isSpecial) {
      setGrid((prev) => ({
        ...prev,
        [key]: {
          subject: subjectName,
          teacher: '',
          subjectId: subjectName,
          teacherId: '',
        },
      }));
      return;
    }

    // Check if this subject is assigned in assignedSubjects
    const assignedMatch = assignedSubjects.find(
      (s) => s.subject?.toLowerCase() === subjectName.toLowerCase()
    );

    // Or check allSubjects
    const globalSubject = allSubjects.find(
      (s) => s.name?.toLowerCase() === subjectName.toLowerCase()
    );

    const subjectId = assignedMatch ? assignedMatch.subjectId : (globalSubject ? globalSubject.id : subjectName);
    // When changing subject, ALWAYS use the teacher assigned to THIS subject!
    const defaultTeacher = assignedMatch ? (assignedMatch.teacher || '') : '';
    const defaultTeacherId = assignedMatch ? (assignedMatch.teacherId || '') : '';

    setGrid((prev) => ({
      ...prev,
      [key]: {
        subject: subjectName,
        teacher: defaultTeacher,
        subjectId: subjectId,
        teacherId: defaultTeacherId,
      },
    }));
  };

  const handleCellTeacherChange = (slotIdx, dayIdx, teacherName) => {
    const key = `${slotIdx}-${dayIdx}`;
    const tObj = allTeachers.find((t) => t.name?.toLowerCase() === teacherName?.toLowerCase());

    setGrid((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        teacher: teacherName,
        teacherId: tObj ? tObj.id : teacherName,
      },
    }));
  };

  const handleClearCell = (slotIdx, dayIdx) => {
    const key = `${slotIdx}-${dayIdx}`;
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // --- Bulk Helpers ---
  const handleSetRowActivity = (slotIdx, activityName) => {
    setGrid((prev) => {
      const next = { ...prev };
      DAYS.forEach((_, dayIdx) => {
        next[`${slotIdx}-${dayIdx}`] = {
          subject: activityName,
          teacher: '',
          subjectId: activityName,
          teacherId: '',
        };
      });
      return next;
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire timetable grid for this class?')) {
      setGrid({});
    }
  };

  // --- Publish Timetable ---
  const handlePublish = async () => {
    if (!selectedClassId) {
      setStatusMessage({ type: 'error', text: 'Please select a class before publishing.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      // Sanitize grid before publishing: guarantee breaks/special activities have no teacher assigned
      const sanitizedGrid = {};
      Object.entries(grid).forEach(([k, cell]) => {
        if (!cell || !cell.subject) return;
        const rawSubj = cell.subject.trim();
        const isSpecial = SPECIAL_ACTIVITIES.includes(rawSubj) ||
          rawSubj.toLowerCase().includes('lunch') ||
          rawSubj.toLowerCase().includes('assembly') ||
          rawSubj.toLowerCase().includes('break') ||
          rawSubj.toLowerCase().includes('recess') ||
          rawSubj.toLowerCase().includes('study hall') ||
          rawSubj.toLowerCase().includes('free period') ||
          rawSubj.toLowerCase() === 'library';

        sanitizedGrid[k] = {
          ...cell,
          teacher: isSpecial ? '' : (cell.teacher || ''),
          teacherId: isSpecial ? '' : (cell.teacherId || ''),
        };
      });

      const payload = {
        classId: selectedClassId,
        className: selectedClassId,
        timeSlots: timeSlots,
        subjectMappings: assignedSubjects,
        gridData: sanitizedGrid,
      };

      await timetableService.save(payload);

      const selCls = classes.find((c) => c.id === selectedClassId);
      const clsName = selCls ? `${selCls.name}${selCls.section ? ` - ${selCls.section}` : ''}` : 'the selected class';

      setStatusMessage({
        type: 'success',
        text: `✅ Timetable published successfully for ${clsName}! It is now immediately visible in the respective Teacher and Student portals.`,
      });
    } catch (err) {
      console.error('Error publishing timetable:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to publish timetable: ' + (err.response?.data?.message || err.message || 'Server error'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const isBusy = isLoadingClasses || isLoadingCatalogs || isLoadingTimetable;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-bold text-2xl">
            <Calendar className="w-7 h-7 text-blue-600" />
            <h1>Class Timetable Management</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Build and publish the weekly schedule manually. Once saved, students and teachers will see their schedule live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isLoadingClasses || classes.length === 0}
              className="border border-slate-300 px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 bg-white min-w-[200px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.length === 0 && <option value="">No classes available</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section ? `(${c.section})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Grid */}
          <button
            onClick={handleClearAll}
            disabled={isSaving || Object.keys(grid).length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition"
            title="Clear all slots in grid"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={isSaving || !selectedClassId}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-600/20 transition"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Publishing…' : 'Publish Timetable'}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 border shadow-sm ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Available Subjects Palette for this class */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Class Subjects & Assigned Teachers for {selectedClass ? `${selectedClass.name} ${selectedClass.section ? `(${selectedClass.section})` : ''}` : 'selected class'}
          </h2>
          <span className="text-xs text-slate-400">
            Clicking or selecting these in the grid assigns both the subject and teacher.
          </span>
        </div>

        {isLoadingCatalogs ? (
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading class subjects…
          </p>
        ) : assignedSubjects.length === 0 ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <strong>Note:</strong> No formal teacher-subject assignments have been configured yet on the Teacher Assignments page.
            You can still manually pick from all school subjects and teachers directly in the grid below!
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {assignedSubjects.map((item) => (
              <div
                key={item.subjectId}
                className="flex items-center gap-1.5 bg-blue-50/80 border border-blue-200/80 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                <span className="font-semibold text-blue-900">{item.subject}</span>
                <span className="text-blue-600">({item.teacher || 'Unassigned'})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">Weekly Schedule Grid</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ml-2">
              {timeSlots.length} Periods • 6 Days
            </span>
          </div>

          <button
            onClick={handleAddTimeSlot}
            className="text-xs bg-white hover:bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Add Period Slot
          </button>
        </div>

        {isBusy ? (
          <div className="p-16 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="font-medium">Loading schedule data…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <th className="p-3 w-40 border-r border-slate-200">Time Slot</th>
                  {DAYS.map((day) => (
                    <th key={day} className="p-3 text-center border-r border-slate-200 min-w-[140px]">
                      {day}
                    </th>
                  ))}
                  <th className="p-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timeSlots.map((slot, slotIdx) => (
                  <tr key={slot.id || slotIdx} className="hover:bg-slate-50/50 transition">
                    {/* Time Slot Header & Quick Helpers */}
                    <td className="p-2.5 border-r border-slate-200 bg-slate-50/70 align-top">
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={slot.label}
                          onChange={(e) => handleSlotChange(slotIdx, e.target.value)}
                          placeholder={`Period ${slotIdx + 1}`}
                          className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 text-center shadow-xs focus:ring-1 focus:ring-blue-500 outline-none"
                        />

                        {/* Quick Set Row as Lunch / Assembly */}
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSetRowActivity(slotIdx, 'Lunch Break')}
                            className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5 font-medium transition"
                            title="Fill this entire row as Lunch Break"
                          >
                            🍱 Lunch
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetRowActivity(slotIdx, 'Study Hall / Free Period')}
                            className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5 font-medium transition"
                            title="Fill this row as Free Period"
                          >
                            Free
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Day Columns */}
                    {DAYS.map((day, dayIdx) => {
                      const cellData = grid[`${slotIdx}-${dayIdx}`] || {};
                      const isSpecialActivity = SPECIAL_ACTIVITIES.includes(cellData.subject);

                      return (
                        <td
                          key={dayIdx}
                          className={`p-2 border-r border-slate-200 align-top transition ${
                            isSpecialActivity
                              ? 'bg-amber-50/40'
                              : cellData.subject
                              ? 'bg-blue-50/30'
                              : 'bg-white'
                          }`}
                        >
                          <div className="space-y-1.5 relative group">
                            {/* Subject Dropdown */}
                            <select
                              value={cellData.subject || ''}
                              onChange={(e) => handleCellSubjectChange(slotIdx, dayIdx, e.target.value)}
                              className={`w-full p-1.5 border rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none transition ${
                                cellData.subject
                                  ? 'border-blue-300 bg-white font-semibold text-slate-900 shadow-xs'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              <option value="">-- Free / None --</option>

                              {/* Class Assigned Subjects */}
                              {assignedSubjects.length > 0 && (
                                <optgroup label="Class Subjects">
                                  {assignedSubjects.map((s) => (
                                    <option key={`assigned-${s.subjectId}`} value={s.subject}>
                                      {s.subject} ({s.teacher || 'Assigned'})
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {/* All School Subjects */}
                              <optgroup label="All School Subjects">
                                {allSubjects.map((s) => (
                                  <option key={`all-${s.id}`} value={s.name}>
                                    {s.name}
                                  </option>
                                ))}
                              </optgroup>

                              {/* Special Activities & Breaks */}
                              <optgroup label="Breaks & Activities">
                                {SPECIAL_ACTIVITIES.map((act) => (
                                  <option key={act} value={act}>
                                    {act}
                                  </option>
                                ))}
                              </optgroup>
                            </select>

                            {/* Teacher Dropdown (if subject is selected and not a break) */}
                            {cellData.subject && !isSpecialActivity && (
                              <select
                                value={cellData.teacher || ''}
                                onChange={(e) => handleCellTeacherChange(slotIdx, dayIdx, e.target.value)}
                                className="w-full p-1 border border-slate-200 rounded text-[11px] bg-white text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none"
                              >
                                <option value="">-- No Teacher --</option>
                                {allTeachers.map((t) => (
                                  <option key={t.id} value={t.name}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* Special Activity label */}
                            {isSpecialActivity && (
                              <div className="text-[10px] text-amber-700 font-semibold text-center py-0.5">
                                ☕ Break / Activity
                              </div>
                            )}

                            {/* Clear cell button on hover */}
                            {cellData.subject && (
                              <button
                                type="button"
                                onClick={() => handleClearCell(slotIdx, dayIdx)}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-400 hover:bg-rose-600 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                                title="Clear slot"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Delete Row Action */}
                    <td className="p-2 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(slotIdx)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                        title="Delete period slot"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}