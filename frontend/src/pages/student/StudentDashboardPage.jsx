import { useMemo, useState } from 'react'
import {
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Brain,
  FileText,
  Clock,
  Award,
} from 'lucide-react'
import ClassTimetableWidget from "../../components/ClassTimetableWidget";
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

  const { data: marks, isLoading: marksLoading } = useFetch(
    () => user?.refId ? markService.findByStudent(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const { data: attendance } = useFetch(
    () => user?.refId ? attendanceService.getByStudent(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const { data: profile, isLoading: profileLoading } = useFetch(
    () => user?.refId ? studentService.getById(user.refId) : Promise.resolve({ data: null }),
    [user?.refId]
  )

  const classId = profile?.classId

  const { data: assignments } = useFetch(
    () => classId ? teacherAssignmentService.listByClass(classId) : Promise.resolve({ data: [] }),
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

  const { data: homeworkList } = useFetch(
    () => classId ? homeworkService.findByClass(classId) : Promise.resolve({ data: [] }),
    [classId]
  )

  const attendancePct = useMemo(() => {
    if (!attendance || attendance.length === 0) return null
    const present = attendance.filter((a) => a.status === 'PRESENT').length
    return Math.round((present / attendance.length) * 100)
  }, [attendance])

  const averageMarksPct = useMemo(() => {
    if (!marks || marks.length === 0) return null
    const totalObtained = marks.reduce((acc, m) => acc + (m.marksObtained || 0), 0)
    const totalMax = marks.reduce((acc, m) => acc + (m.maxMarks || 0), 0)
    if (totalMax === 0) return null
    return Math.round((totalObtained / totalMax) * 100)
  }, [marks])

  const { data: timetable, isLoading: timetableLoading } = useFetch(
    () => classId ? timetableService.getByClass(classId) : Promise.resolve({ data: null }),
    [classId]
  )

  const { data: subjects } = useFetch(
    () => subjectService.list(),
    []
  )

  const { data: teachers } = useFetch(
    () => teacherService.list(),
    []
  )

  const subjectName = (idOrName) => {
    if (!idOrName) return 'Free'
    const match = subjects?.find((sub) => sub.id === idOrName || sub.name?.toLowerCase() === idOrName?.toLowerCase())
    return match ? match.name : idOrName
  }

  const teacherName = (idOrName) => {
    if (!idOrName) return ''
    const match = teachers?.find((teacher) => teacher.id === idOrName || teacher.name?.toLowerCase() === idOrName?.toLowerCase())
    return match ? match.name : idOrName
  }

  const tableRows = useMemo(() => {
    if (!timetable || !timetable.entries) return []

    const periodsCount = timetable.periodsPerDay || (timetable.timeSlots?.length || 7)
    const daysCount = timetable.daysPerWeek || 6

    return Array.from({ length: periodsCount }, (_, periodIndex) => {
      const slotLabel = timetable.timeSlots?.[periodIndex] || `Period ${periodIndex + 1}`
      const row = {
        periodIndex,
        slotLabel,
        periodName: `Period ${periodIndex + 1}`,
      }

      for (let dayIndex = 0; dayIndex < daysCount; dayIndex += 1) {
        const entry = timetable.entries.find(
          (e) => e.dayIndex === dayIndex && e.periodIndex === periodIndex,
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

          const assignedTeacher = teacherMap[entry.subjectId] ||
            (assignments || []).find((a) => a.subjectName?.toLowerCase() === sName.toLowerCase())?.teacherName

          const tName = isBreak ? '' : (assignedTeacher || entry.teacherName || teacherName(entry.teacherId))

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
            Track your attendance, homework, study materials and official academic records.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5"
        >
          <Award className="w-5 h-5 text-amber-500" />
          <span>Official Academic Transcript</span>
        </button>
      </div>

      <AnnouncementsWidget limit={3} title="Latest Announcements" />

      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl border bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Attendance</p>
              <h2 className="mt-2 text-4xl font-bold text-blue-600">
                {attendancePct !== null ? `${attendancePct}%` : 'N/A'}
              </h2>
            </div>
            <ClipboardCheck size={42} className="text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500">Average Marks</p>
              <h2 className="mt-2 text-4xl font-bold text-green-600">
                {averageMarksPct !== null ? `${averageMarksPct}%` : 'N/A'}
              </h2>
            </div>
            <BookOpen size={42} className="text-green-500" />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                AI Status
              </p>

              <h2 className="mt-2 text-2xl font-bold text-purple-600">
                Ready
              </h2>

            </div>

            <Brain
              size={42}
              className="text-purple-500"
            />

          </div>

        </div>

      </div>

      <Card title="Academic Performance">
        {marksLoading ? (
          <Spinner label="Loading your marks..." />
        ) : (
          <SubjectDeck marks={marks} subjects={subjects} teacherMap={teacherMap} />
        )}
      </Card>

      {/* Everyday Attendance Logbook & AI Analytics */}
      <StudentAttendanceLogbook studentId={user?.refId} classId={classId} />

      {/* Timetable + Homework */}

      <div className="grid gap-6 lg:grid-cols-2">

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
                  {Array.from({ length: timetable.daysPerWeek || 6 }).map((_, dayIndex) => (
                    <th
                      key={dayIndex}
                      className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-600 border-r border-slate-200 min-w-[130px]"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex] || `Day ${dayIndex + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tableRows.map((row) => (
                  <tr key={row.periodIndex} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 border-r border-slate-200 bg-slate-50/60">
                      <div className="font-bold text-xs text-slate-800">{row.slotLabel}</div>
                      {row.slotLabel !== row.periodName && (
                        <div className="text-[10px] text-slate-400 font-medium">{row.periodName}</div>
                      )}
                    </td>
                    {Array.from({ length: timetable.daysPerWeek || 6 }).map((_, dayIndex) => {
                      const cell = row[`day${dayIndex}`] || { subject: 'Free' }
                      const isFree = !cell.subject || cell.subject.toLowerCase() === 'free'

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
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

        <Card title="Homework & Study Materials">

          <div className="space-y-5">

            <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">
              <FileText className="text-blue-600" />
              <div>
                <p className="font-semibold">Homework</p>
                <p className="text-sm text-gray-500">
                  {homeworkList?.length
                    ? `${homeworkList.length} assignment(s) posted for your class.`
                    : 'No homework due right now.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl bg-green-50 p-4">
              <Clock className="text-green-600" />
              <div>
                <p className="font-semibold">Study Materials</p>
                <p className="text-sm text-gray-500">
                  Access notes, PDFs, and syllabus in the Study Materials tab.
                </p>
              </div>
            </div>

          </div>

        </Card>

      </div>

      {/* AI Analysis */}

      <div>

        <div className="mb-4 flex items-center gap-3">

          <Brain
            size={30}
            className="text-blue-600"
          />

          <h2 className="text-2xl font-bold text-blue-700">

            AI Performance Analysis

          </h2>

        </div>

        <AiPerformanceAnalysis studentId={user.refId} />

      </div>

      {user?.refId && (
        <ReportCardModal
          studentId={user.refId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

    </div>

  )

}