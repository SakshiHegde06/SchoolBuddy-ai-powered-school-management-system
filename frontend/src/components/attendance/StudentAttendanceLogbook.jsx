import { useState, useMemo } from 'react'
import {
  ClipboardCheck,
  Brain,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Search,
  Filter,
  BookOpen,
  TrendingUp,
  Award,
} from 'lucide-react'
import Card from '../common/Card'
import Spinner from '../common/Spinner'
import Badge from '../common/Badge'
import EmptyState from '../common/EmptyState'
import { attendanceService } from '../../services/attendanceService'
import { subjectService } from '../../services/subjectService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { teacherService } from '../../services/teacherService'
import { useFetch } from '../../hooks/useFetch'

/**
 * Format ISO date string into readable format: "Fri, 16 Oct 2026"
 */
function formatLogDate(isoDate) {
  if (!isoDate) return '—'
  try {
    const d = new Date(isoDate + (isoDate.length === 10 ? 'T00:00:00' : ''))
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

export default function StudentAttendanceLogbook({ studentId, classId }) {
  const [activeTab, setActiveTab] = useState('analytics') // 'analytics' | 'logbook'
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Fetch Student Attendance Records
  const { data: attendanceList, isLoading: attendanceLoading } = useFetch(
    () => (studentId ? attendanceService.getByStudent(studentId) : Promise.resolve({ data: [] })),
    [studentId]
  )

  // 2. Fetch All Subjects
  const { data: subjects, isLoading: subjectsLoading } = useFetch(
    () => subjectService.list(),
    []
  )

  // 3. Fetch Class Teacher Assignments (if classId is provided)
  const { data: assignments } = useFetch(
    () => (classId ? teacherAssignmentService.listByClass(classId) : Promise.resolve({ data: [] })),
    [classId]
  )

  // 4. Fetch All Teachers (for fallback lookup by markedBy)
  const { data: teachers } = useFetch(
    () => teacherService.list(),
    []
  )

  // Build subject lookup map: subjectId -> Subject
  const subjectMap = useMemo(() => {
    const map = {}
    ;(subjects || []).forEach((s) => {
      map[s.id] = s
    })
    return map
  }, [subjects])

  // Build teacher assignment map: subjectId -> Teacher Name
  const subjectTeacherMap = useMemo(() => {
    const map = {}
    // First from teacher assignments of the class
    ;(assignments || []).forEach((a) => {
      if (a.subjectId && a.teacherName) {
        map[a.subjectId] = a.teacherName
      }
    })
    // Also extract from any attendance record with teacherName or markedBy
    ;(attendanceList || []).forEach((rec) => {
      if (rec.subjectId && rec.teacherName && !map[rec.subjectId]) {
        map[rec.subjectId] = rec.teacherName
      } else if (rec.subjectId && rec.markedBy && !map[rec.subjectId]) {
        const foundTeacher = (teachers || []).find((t) => t.id === rec.markedBy)
        if (foundTeacher) {
          map[rec.subjectId] = foundTeacher.name
        }
      }
    })
    return map
  }, [assignments, attendanceList, teachers])

  // Calculate subject-wise attendance statistics & AI analytics
  const subjectStats = useMemo(() => {
    const list = attendanceList || []
    const groups = {}

    // Group records by subject
    list.forEach((rec) => {
      const sId = rec.subjectId || 'GENERAL'
      if (!groups[sId]) {
        groups[sId] = {
          subjectId: sId,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          records: [],
          teacherName: rec.teacherName || null,
        }
      }
      groups[sId].total += 1
      if (rec.status === 'PRESENT') groups[sId].present += 1
      else if (rec.status === 'ABSENT') groups[sId].absent += 1
      else if (rec.status === 'LATE') groups[sId].late += 1
      groups[sId].records.push(rec)
    })

    // Also include registered subjects that may have 0 records yet
    ;(subjects || []).forEach((sub) => {
      if (!groups[sub.id]) {
        groups[sub.id] = {
          subjectId: sub.id,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          records: [],
          teacherName: null,
        }
      }
    })

    // Compute metrics & AI analytics for each subject
    return Object.values(groups).map((item) => {
      const subjectObj = subjectMap[item.subjectId]
      const name = subjectObj?.name || (item.subjectId === 'GENERAL' ? 'General' : 'Subject ' + item.subjectId)
      const code = subjectObj?.code || null
      const teacher = item.teacherName || subjectTeacherMap[item.subjectId] || 'Assigned Faculty'

      const total = item.total
      const present = item.present
      const absent = item.absent
      const late = item.late
      const percentage = total > 0 ? Math.round((present / total) * 100) : null

      // AI Risk & Insight Calculation
      let riskLevel = 'NO_DATA'
      let riskLabel = 'No Records'
      let riskTone = 'neutral'
      let aiInsight = 'No attendance recorded yet for this subject.'
      let consecutiveNeeded = 0
      let safeLeavesAllowed = 0

      if (total > 0 && percentage !== null) {
        if (percentage >= 85) {
          riskLevel = 'LOW'
          riskLabel = 'Low Risk (Safe)'
          riskTone = 'success'
          // How many classes can safely be missed while staying >= 75%
          // P / (N + y) >= 0.75  =>  y <= (4P - 3N) / 3
          safeLeavesAllowed = Math.max(0, Math.floor((4 * present - 3 * total) / 3))
          aiInsight = safeLeavesAllowed > 0
            ? `Excellent attendance (${percentage}%). Safely above the 75% mandatory cutoff. Student can absorb up to ${safeLeavesAllowed} emergency absence(s) without losing eligibility.`
            : `Consistent attendance (${percentage}%). Safe buffer above threshold. Maintain regularity.`
        } else if (percentage >= 75) {
          riskLevel = 'MODERATE'
          riskLabel = 'Moderate Risk (Borderline)'
          riskTone = 'warning'
          // At 75-84%, missing 1 class might drop below 75%
          aiInsight = `Borderline attendance (${percentage}%). Meets minimum 75% academic requirement, but any further absences will trigger a shortage alert. Consistent presence is strongly recommended.`
        } else {
          riskLevel = 'CRITICAL'
          riskLabel = 'Critical Risk (< 75%)'
          riskTone = 'danger'
          // Consecutive classes needed to reach 75%:
          // (P + x) / (N + x) >= 0.75  =>  0.25x >= 0.75N - P  =>  x >= 3N - 4P
          consecutiveNeeded = Math.max(1, Math.ceil(3 * total - 4 * present))
          aiInsight = `CRITICAL DEFICIT: Attendance is at ${percentage}%, strictly below the 75% regulatory cutoff. AI Action Plan: Student must attend the next ${consecutiveNeeded} consecutive class(es) without absence to restore exam eligibility.`
        }
      }

      return {
        ...item,
        name,
        code,
        teacher,
        percentage,
        riskLevel,
        riskLabel,
        riskTone,
        aiInsight,
        consecutiveNeeded,
        safeLeavesAllowed,
      }
    })
  }, [attendanceList, subjects, subjectMap, subjectTeacherMap])

  // Overall student attendance overview
  const overallStats = useMemo(() => {
    const list = attendanceList || []
    const total = list.length
    if (total === 0) return { total: 0, present: 0, absent: 0, late: 0, pct: null }

    const present = list.filter((r) => r.status === 'PRESENT').length
    const absent = list.filter((r) => r.status === 'ABSENT').length
    const late = list.filter((r) => r.status === 'LATE').length
    const pct = Math.round((present / total) * 100)

    return { total, present, absent, late, pct }
  }, [attendanceList])

  // Filtered attendance records for the everyday logbook
  const filteredLogbook = useMemo(() => {
    let records = (attendanceList || []).map((rec) => {
      const subjectObj = subjectMap[rec.subjectId]
      const subjectName = rec.subjectName || subjectObj?.name || (rec.subjectId === 'GENERAL' ? 'General' : 'Subject')
      const teacherName = rec.teacherName || subjectTeacherMap[rec.subjectId] || 'Assigned Faculty'
      return {
        ...rec,
        subjectName,
        teacherName,
      }
    })

    // Filter by subject
    if (selectedSubjectFilter !== 'ALL') {
      records = records.filter((r) => r.subjectId === selectedSubjectFilter)
    }

    // Filter by status
    if (selectedStatusFilter !== 'ALL') {
      records = records.filter((r) => r.status === selectedStatusFilter)
    }

    // Filter by search query (subject, teacher, or date)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      records = records.filter(
        (r) =>
          (r.subjectName && r.subjectName.toLowerCase().includes(q)) ||
          (r.teacherName && r.teacherName.toLowerCase().includes(q)) ||
          (r.date && r.date.includes(q))
      )
    }

    // Sort latest date first
    return records.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [attendanceList, subjectMap, subjectTeacherMap, selectedSubjectFilter, selectedStatusFilter, searchQuery])

  if (attendanceLoading || subjectsLoading) {
    return (
      <Card title="Attendance & AI Analytics">
        <Spinner label="Loading attendance data and analytics…" />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              overallStats.pct === null
                ? 'bg-slate-100 text-slate-500'
                : overallStats.pct >= 85
                ? 'bg-emerald-100 text-emerald-700'
                : overallStats.pct >= 75
                ? 'bg-amber-100 text-amber-700'
                : 'bg-rose-100 text-rose-700'
            }`}>
              <ClipboardCheck size={32} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Overall Attendance Turnout
              </p>
              <h3 className="text-3xl font-extrabold text-slate-900">
                {overallStats.pct !== null ? `${overallStats.pct}%` : 'N/A'}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {overallStats.pct !== null
                  ? overallStats.pct >= 75
                    ? '✅ Satisfies mandatory 75% attendance threshold'
                    : '⚠️ Below 75% threshold — Action needed to avoid shortage'
                  : 'No attendance records yet'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 md:border-t-0 md:pt-0">
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-center shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Classes</span>
              <p className="text-xl font-bold text-slate-800">{overallStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-center shadow-xs">
              <span className="text-xs font-medium text-emerald-700">Present</span>
              <p className="text-xl font-bold text-emerald-700">{overallStats.present}</p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 text-center shadow-xs">
              <span className="text-xs font-medium text-rose-700">Absent</span>
              <p className="text-xl font-bold text-rose-700">{overallStats.absent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Brain size={18} />
          Subject AI Analytics & Turnout
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logbook')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'logbook'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar size={18} />
          Everyday Attendance Logbook ({filteredLogbook.length})
        </button>
      </div>

      {/* TAB 1: SUBJECT AI ANALYTICS & TURNOUT */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain size={20} className="text-blue-600" />
              Everyday Attendance & AI Analytics by Subject
            </h3>
            <p className="text-xs text-slate-500">
              Turnout percentage, teacher assignments, and predictive risk insights for each enrolled subject.
            </p>
          </div>

          {subjectStats.length === 0 ? (
            <EmptyState
              title="No subjects or attendance data found"
              description="Once attendance is marked for subjects, analytics will appear here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {subjectStats.map((sub) => {
                const isCritical = sub.riskLevel === 'CRITICAL'
                const isModerate = sub.riskLevel === 'MODERATE'
                const isSafe = sub.riskLevel === 'LOW'

                return (
                  <div
                    key={sub.subjectId}
                    className={`flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-sm ${
                      isCritical
                        ? 'border-rose-300 bg-rose-50/40 hover:shadow-md'
                        : isModerate
                        ? 'border-amber-300 bg-amber-50/40 hover:shadow-md'
                        : isSafe
                        ? 'border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Subject Header & Teacher Name */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                              <BookOpen size={16} />
                            </span>
                            <h4 className="font-bold text-slate-900">{sub.name}</h4>
                          </div>
                          {sub.code && (
                            <span className="text-xs font-mono text-slate-400 ml-8">
                              Code: {sub.code}
                            </span>
                          )}
                        </div>

                        {/* Attendance % Badge */}
                        <div className="text-right">
                          <span
                            className={`inline-block rounded-xl px-2.5 py-1 text-sm font-extrabold ${
                              sub.percentage === null
                                ? 'bg-slate-100 text-slate-600'
                                : isCritical
                                ? 'bg-rose-100 text-rose-800'
                                : isModerate
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {sub.percentage !== null ? `${sub.percentage}%` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Teacher's Name */}
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2">
                        <span className="text-blue-600">👨‍🏫</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            Subject Teacher
                          </p>
                          <p className="truncate text-xs font-bold text-slate-800">
                            {sub.teacher}
                          </p>
                        </div>
                      </div>

                      {/* Attendance Breakdown Pills */}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-slate-100/80 p-2">
                          <p className="text-[10px] uppercase font-semibold text-slate-400">Classes</p>
                          <p className="font-bold text-slate-800">{sub.total}</p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                          <p className="text-[10px] uppercase font-semibold text-emerald-600">Present</p>
                          <p className="font-bold">{sub.present}</p>
                        </div>
                        <div className="rounded-lg bg-rose-50 p-2 text-rose-800">
                          <p className="text-[10px] uppercase font-semibold text-rose-600">Absent</p>
                          <p className="font-bold">{sub.absent}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {sub.percentage !== null && (
                        <div className="mt-4">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCritical
                                  ? 'bg-rose-500'
                                  : isModerate
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                            />
                          </div>
                          <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400">
                            <span>0%</span>
                            <span className="text-amber-600">75% Cutoff</span>
                            <span>100%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Analytics Section */}
                    <div className="mt-4 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Brain size={14} className="text-blue-600" />
                          <span>AI Attendance Analytics</span>
                        </div>
                        <Badge tone={sub.riskTone}>
                          {sub.riskLabel}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">
                        {sub.aiInsight}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EVERYDAY ATTENDANCE LOGBOOK */}
      {activeTab === 'logbook' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Subject Filter */}
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-slate-400" />
                <select
                  value={selectedSubjectFilter}
                  onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Subjects</option>
                  {(subjects || []).map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present Only</option>
                  <option value="ABSENT">Absent Only</option>
                  <option value="LATE">Late Only</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search teacher, subject, date…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Logbook Table */}
          {filteredLogbook.length === 0 ? (
            <EmptyState
              title="No attendance entries found"
              description={
                searchQuery || selectedSubjectFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                  ? 'Try clearing the search query or status filter to see more records.'
                  : 'No attendance records have been registered for this student yet.'
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Subject Teacher</th>
                    <th className="py-3 px-4 font-semibold">Attendance Status</th>
                    <th className="py-3 px-4 font-semibold">Remarks / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogbook.map((record, idx) => {
                    const isPresent = record.status === 'PRESENT'
                    const isAbsent = record.status === 'ABSENT'
                    const isLate = record.status === 'LATE'

                    return (
                      <tr
                        key={record.id || `${record.date}-${record.subjectId}-${idx}`}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            <span>{formatLogDate(record.date)}</span>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>{record.subjectName}</span>
                          </div>
                        </td>

                        {/* Teacher's Name */}
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-blue-700 border border-blue-200">
                              👨‍🏫
                            </span>
                            <span className="font-medium text-slate-800">
                              {record.teacherName}
                            </span>
                          </div>
                        </td>

                        {/* Attendance Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isPresent && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              PRESENT
                            </span>
                          )}
                          {isAbsent && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                              <XCircle size={13} className="text-rose-600" />
                              ABSENT
                            </span>
                          )}
                          {isLate && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                              <Clock size={13} className="text-amber-600" />
                              LATE
                            </span>
                          )}
                          {!isPresent && !isAbsent && !isLate && (
                            <Badge tone="neutral">{record.status || 'RECORDED'}</Badge>
                          )}
                        </td>

                        {/* Remarks / Action */}
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {isPresent && <span className="text-emerald-600">Attended full session</span>}
                          {isAbsent && <span className="text-rose-600 font-medium">Unexcused absence</span>}
                          {isLate && <span className="text-amber-600">Arrived late to class</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
