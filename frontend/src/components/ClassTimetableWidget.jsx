import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../utils/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ClassTimetableWidget({ className }) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!className) return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    axios
      .get(`${API_BASE_URL}/timetable/class/${className}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      .then((res) => setTimetable(res.data))
      .catch((err) => console.error('No timetable published for this class yet.', err))
      .finally(() => setLoading(false));
  }, [className]);

  if (loading) return <p className="text-sm text-slate-500 py-4">Loading class schedule...</p>;
  if (!timetable || (!timetable.entries?.length && !timetable.periods?.length)) {
    return <p className="text-sm text-slate-500 py-4">No published timetable for Class {className}.</p>;
  }

  const daysCount = timetable.daysPerWeek || 6;
  const periodsCount = timetable.periodsPerDay || (timetable.timeSlots?.length || 7);

  // If new entries format
  if (timetable.entries && timetable.entries.length > 0) {
    const rows = Array.from({ length: periodsCount }, (_, pIdx) => {
      const slotLabel = timetable.timeSlots?.[pIdx] || `Period ${pIdx + 1}`;
      const daySlots = [];

      for (let dIdx = 0; dIdx < daysCount; dIdx += 1) {
        const entry = timetable.entries.find((e) => e.dayIndex === dIdx && e.periodIndex === pIdx);
        const rawSubj = entry ? (entry.subjectName || entry.subjectId) : '-';
        const isBreak =
          entry &&
          (rawSubj.toLowerCase().includes('lunch') ||
           rawSubj.toLowerCase().includes('assembly') ||
           rawSubj.toLowerCase().includes('break') ||
           rawSubj.toLowerCase().includes('recess') ||
           rawSubj.toLowerCase().includes('study hall'));

        daySlots.push({
          subject: rawSubj,
          teacher: entry && !isBreak ? (entry.teacherName || entry.teacherId) : '',
          isBreak,
        });
      }

      return { slotLabel, daySlots };
    });

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-base font-bold text-slate-800 mb-3">Class {className} Weekly Schedule</h3>
        <table className="min-w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200">
              <th className="p-2 border border-slate-200 font-bold text-slate-700 w-32">Slot</th>
              {DAYS.slice(0, daysCount).map((d) => (
                <th key={d} className="p-2 border border-slate-200 font-bold text-slate-700 min-w-[110px]">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="p-2 border border-slate-200 font-semibold text-slate-800 bg-slate-50">
                  {row.slotLabel}
                </td>
                {row.daySlots.map((slot, dIdx) => (
                  <td key={dIdx} className="p-2 border border-slate-200">
                    <div className="font-semibold text-slate-800">{slot.subject}</div>
                    {slot.teacher && <div className="text-[10px] text-slate-500">({slot.teacher})</div>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Fallback for legacy format
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <h3 className="text-base font-bold text-slate-800 mb-3">Class {className} Weekly Schedule</h3>
      <table className="min-w-full text-xs text-center border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="p-2 border border-slate-200">Slot</th>
            {DAYS.map((d) => (
              <th key={d} className="p-2 border border-slate-200">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timetable.periods?.map((period, idx) => (
            <tr key={idx}>
              <td className="p-2 border border-slate-200 font-bold">{period.timeSlot}</td>
              {DAYS.map((dayKey) => {
                const slot = period[dayKey.toLowerCase()] || {};
                return (
                  <td key={dayKey} className="p-2 border border-slate-200">
                    <div className="font-bold">{slot.subjectName || '-'}</div>
                    {slot.teacherName && <div className="text-[10px] text-slate-500">({slot.teacherName})</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}