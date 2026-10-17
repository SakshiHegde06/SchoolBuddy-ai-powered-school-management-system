import { useMemo, useState, useEffect } from 'react'
import {
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Brain,
  FileText,
  Clock,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react'
import Card from '../../components/common/Card'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'
import SubjectDeck from '../../components/marks/SubjectDeck'
import StudentAttendanceLogbook from '../../components/attendance/StudentAttendanceLogbook'
import ReportCardModal from '../../components/reports/ReportCardModal'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { markService } from '../../services/markService'
import { studentService } from '../../services/studentService'
import { subjectService } from '../../services/subjectService'
import { teacherService } from '../../services/teacherService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { timetableService } from '../../services/timetableService'
import { attendanceService } from '../../services/attendanceService'
import { homeworkService } from '../../services/homeworkService'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [studentRefId, setStudentRefId] = useState(user?.refId || null)

  // Auto-resolve student ID if missing on the user auth object
  useEffect(() => {
    if (user?.refId) {
      setStudentRefId(user.refId)
    } else if (user?.email) {
      studentService
        .list()
        .then((res) => {
          const list = res.data || []
          const found = list.find(
            (s) =>
              s.email?.toLowerCase() === user.email.toLowerCase() ||
              s.userId === user.id
          )
          if (found) setStudentRefId(found.id)
        })
        .catch(() => {})
    }
  }, [user?.refId, user?.email, user?.id])

  const { data: marks, isLoading: marksLoading } = useFetch(
    () =>
      studentRefId
        ? markService.findByStudent(studentRefId)
        : Promise.resolve({ data: [] }),
    [studentRefId]
  )

  const { data: attendance } = useFetch(
    () =>
      studentRefId
        ? attendanceService.getByStudent(studentRefId)
        : Promise.resolve({ data: [] }),
    [studentRefId]
  )

  const { data: profile, isLoading: profileLoading } = useFetch(
    () =>
      studentRefId
        ? studentService.getById(studentRefId)
        : Promise.resolve({ data: null }),
    [studentRefId]
  )

  const classId = profile?.classId

  const { data: assignments } = useFetch(
    () =>
      classId
        ? teacherAssignmentService.listByClass(classId)
        : Promise.resolve({ data: [] }),
    [classId]
  )

  const teacherMap = useMemo(() => {
    const map = {}
    ;(assignments || []).forEach((a) => {
      if (a.subjectId && a.teacherName) {
        map[a.subjectId] = a.teacherName
      }
    })
    return map
  }, [assignments])

  const { data: homeworkList, isLoading: homeworkLoading } = useFetch(
    () =>
      classId
        ? homeworkService.findByClass(classId)
        : Promise.resolve({ data: [] }),
    [classId]
  )

  const { data: subjects } = useFetch(() => subjectService.list(), [])

  const { data: teachers } = useFetch(() => teacherService.list(), [])

  // Subject-wise Attendance Breakdown (Rule: Each subject must be >= 75%)
  const subjectAttendanceStats = useMemo(() => {
    if (!attendance || attendance.length === 0 || !subjects) return []
    const bySub = {}
    attendance.forEach((a) => {
      const sId = a.subjectId || 'GENERAL'
      if (!bySub[sId]) bySub[sId] = { total: 0, present: 0 }
      bySub[sId].total += 1
      if (a.status === 'PRESENT') bySub[sId].present += 1
    })

    return subjects
      .map((s) => {
        const stat = bySub[s.id]
        const total = stat?.total || 0
        const present = stat?.present || 0
        const pct = total > 0 ? Math.round((present / total) * 100) : null
        const isEligible = pct !== null ? pct >= 75 : true
        return {
          id: s.id,
          name: s.name,
          total,
          present,
          pct,
          isEligible,
        }
      })
      .filter((s) => s.total > 0)
  }, [attendance, subjects])

  const subjectsMeetingRequirement = subjectAttendanceStats.filter(
    (s) => s.pct !== null && s.pct >= 75
  ).length
  const totalSubjectsWithAttendance = subjectAttendanceStats.length
  const hasAttendanceShortage = subjectAttendanceStats.some(
    (s) => s.pct !== null && s.pct < 75
  )

  const averageMarksPct = useMemo(() => {
    if (!marks || marks.length === 0) return null
    const totalObtained = marks.reduce(
      (acc, m) => acc + (m.marksObtained || 0),
      0
    )
    const totalMax = marks.reduce((acc, m) => acc + (m.maxMarks || 0), 0)
    if (totalMax === 0) return null
    return Math.round((totalObtained / totalMax) * 100)
  }, [marks])

  const { data: timetable, isLoading: timetableLoading } = useFetch(
    () =>
      classId
        ? timetableService.getByClass(classId)
        : Promise.resolve({ data: null }),
    [classId]
  )

  const subjectName = (idOrName) => {
    if (!idOrName) return 'Free'
    const match = subjects?.find(
      (sub) =>
        sub.id === idOrName ||
        sub.name?.toLowerCase() === idOrName?.toLowerCase()
    )
    return match ? match.name : idOrName
  }

  const teacherName = (idOrName) => {
    if (!idOrName) return ''
    const match = teachers?.find(
      (teacher) =>
        teacher.id === idOrName ||
        teacher.name?.toLowerCase() === idOrName?.toLowerCase()
    )
    return match ? match.name : idOrName
  }

  const tableRows = useMemo(() => {
    if (!timetable || !timetable.entries) return []

    const periodsCount =
      timetable.periodsPerDay || (timetable.timeSlots?.length || 7)
    const daysCount = timetable.daysPerWeek || 6

    return Array.from({ length: periodsCount }, (_, periodIndex) => {
      const slotLabel =
        timetable.timeSlots?.[periodIndex] || `Period ${periodIndex + 1}`
      const row = {
        periodIndex,
        slotLabel,
        periodName: `Period ${periodIndex + 1}`,
      }

      for (let dayIndex = 0; dayIndex < daysCount; dayIndex += 1) {
        const entry = timetable.entries.find(
          (e) => e.dayIndex === dayIndex && e.periodIndex === periodIndex
        )

        if (entry) {
          const sName = entry.subjectName || subjectName(entry.subjectId)
          const lowerSub = (sName || '').toLowerCase().trim()
          const isBreak =
            lowerSub.includes('lunch') ||
            lowerSub.includes('break') ||
            lowerSub.includes('assembly') ||
            lowerSub.includes('recess') ||
            lowerSub.includes('study hall') ||
            lowerSub.includes('free period') ||
            lowerSub === 'library'

          const assignedTeacher =
            teacherMap[entry.subjectId] ||
            (assignments || []).find(
              (a) => a.subjectName?.toLowerCase() === sName.toLowerCase()
            )?.teacherName

          const tName = isBreak
            ? ''
            : (assignedTeacher ||
                entry.teacherName ||
                teacherName(entry.teacherId))

          row[`day${dayIndex}`] = {
            subject: sName,
            teacher: isBreak ? '' : tName,
            isBreak,
          }
        } else {
          row[`day${dayIndex}`] = {
            subject: 'Free',
            teacher: '',
            isBreak: false,
          }
        }
      }
      return row
    })
  }, [timetable, subjects, teachers])

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 p-8 text-white shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-2 text-blue-100">
            Track your subject-wise attendance (min 75%), homework assignments, and official academic records.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Award className="w-5 h-5 text-amber-500" />
          <span>Official Academic Transcript</span>
        </button>
      </div>

      <AnnouncementsWidget limit={3} title="Latest Announcements" />

      {/* Summary Cards: Subject Attendance Compliance & Average Marks */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Subject-Wise Attendance Compliance (>= 75% rule) */}
        <div className="rounded-2xl border bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Subject Attendance (≥75% Rule)
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-blue-600">
                {totalSubjectsWithAttendance > 0
                  ? `${subjectsMeetingRequirement}/${totalSubjectsWithAttendance}`
                  : 'Eligible'}
              </h2>
              <div className="mt-1">
                {hasAttendanceShortage ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                    <AlertTriangle size={14} /> Shortage in 1+ subjects
                  </span>
                ) : totalSubjectsWithAttendance > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <CheckCircle2 size={14} /> All subjects ≥ 75%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Requires ≥ 75% per subject
                  </span>
                )}
              </div>
            </div>
            <ClipboardCheck
              size={42}
              className={hasAttendanceShortage ? 'text-rose-500' : 'text-blue-500'}
            />
          </div>
        </div>

        {/* Card 2: Average Marks */}
        <div className="rounded-2xl border bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Average Marks
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-emerald-600">
                {averageMarksPct !== null ? `${averageMarksPct}%` : 'N/A'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {marks?.length
                  ? `Across ${marks.length} recorded exam(s)`
                  : 'No exams evaluated yet'}
              </p>
            </div>
            <BookOpen size={42} className="text-emerald-500" />
          </div>
        </div>

        {/* Card 3: AI Status */}
        <div className="rounded-2xl border bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-500">
                AI Performance Advisor
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-purple-600">
                Active
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Predictive scores & personalized tips
              </p>
            </div>
            <Brain size={42} className="text-purple-500" />
          </div>
        </div>
      </div>

      {/* Academic Performance & Marks Section */}
      <Card title="Academic Performance & Exam Results">
        {marksLoading ? (
          <Spinner label="Loading your marks..." />
        ) : (
          <SubjectDeck
            marks={marks}
            subjects={subjects}
            teacherMap={teacherMap}
            attendance={attendance}
            onOpenTranscript={() => setIsReportModalOpen(true)}
          />
        )}
      </Card>

      {/* Everyday Attendance Logbook & AI Analytics */}
      <StudentAttendanceLogbook
        studentId={studentRefId}
        classId={classId}
      />

      {/* Timetable + Detailed Homework Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class Timetable */}
        <Card title="Class Timetable">
          {timetableLoading || profileLoading ? (
            <Spinner label="Loading timetable..." />
          ) : !classId ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-sky-50 px-6 text-center">
              <CalendarDays size={52} className="text-blue-400" />
              <p className="mt-4 text-gray-500">
                Your student profile has no class assigned yet.
              </p>
            </div>
          ) : !timetable?.entries?.length ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 px-6 text-center">
              <CalendarDays size={48} className="text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No timetable published for your class yet.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Check back soon! Once your teachers or administrator publish the schedule, it will appear right here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-600 border-r border-slate-200 w-36">
                      Time / Period
                    </th>
                    {Array.from({ length: timetable.daysPerWeek || 6 }).map(
                      (_, dayIndex) => (
                        <th
                          key={dayIndex}
                          className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-600 border-r border-slate-200 min-w-[130px]"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex] || `Day ${dayIndex + 1}`}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tableRows.map((row) => (
                    <tr
                      key={row.periodIndex}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                    >
                      <td className="px-4 py-3 border-r border-slate-200 bg-slate-50/60">
                        <div className="font-bold text-xs text-slate-800">
                          {row.slotLabel}
                        </div>
                        {row.slotLabel !== row.periodName && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {row.periodName}
                          </div>
                        )}
                      </td>
                      {Array.from({ length: timetable.daysPerWeek || 6 }).map(
                        (_, dayIndex) => {
                          const cell = row[`day${dayIndex}`] || { subject: 'Free' }
                          const isFree =
                            !cell.subject ||
                            cell.subject.toLowerCase() === 'free'

                          return (
                            <td
                              key={dayIndex}
                              className={`px-3 py-2.5 text-center border-r border-slate-200 transition ${
                                cell.isBreak
                                  ? 'bg-amber-50/50'
                                  : isFree
                                  ? 'bg-white'
                                  : 'bg-blue-50/30'
                              }`}
                            >
                              <div
                                className={`text-xs ${
                                  cell.isBreak
                                    ? 'font-semibold text-amber-800'
                                    : isFree
                                    ? 'text-slate-400 italic'
                                    : 'font-semibold text-slate-800'
                                }`}
                              >
                                {cell.subject}
                              </div>
                              {cell.teacher && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {cell.teacher}
                                </div>
                              )}
                            </td>
                          )
                        }
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Detailed Homework Assignments Section */}
        <Card title={`Homework Assignments (${homeworkList?.length || 0})`}>
          {homeworkLoading ? (
            <Spinner label="Loading homework..." />
          ) : !homeworkList || homeworkList.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <FileText size={40} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No homework due right now
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Great job! You are all caught up with your classroom assignments.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {homeworkList.map((hw) => (
                <div
                  key={hw.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">
                      {hw.title}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {subjectName(hw.subjectId)}
                    </span>
                  </div>

                  {hw.description && (
                    <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {hw.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                      <Calendar size={13} />
                      <span>
                        Due:{' '}
                        {hw.dueDate
                          ? new Date(
                              hw.dueDate +
                                (hw.dueDate.length === 10 ? 'T00:00:00' : '')
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No deadline'}
                      </span>
                    </div>

                    {hw.attachmentUrls && hw.attachmentUrls.length > 0 && (
                      <a
                        href={hw.attachmentUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Download size={13} />
                        <span>Attachment</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI Performance Analysis */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Brain size={30} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-blue-700">
            AI Performance Analysis
          </h2>
        </div>
        {studentRefId && <AiPerformanceAnalysis studentId={studentRefId} />}
      </div>

      {studentRefId && (
        <ReportCardModal
          studentId={studentRefId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  )
}