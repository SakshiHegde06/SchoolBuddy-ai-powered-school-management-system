import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnnouncementsWidget from "../../components/common/AnnouncementsWidget";
import {
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  MessageSquare,
  FileText
} from 'lucide-react'


import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { teacherService } from '../../services/teacherService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { timetableService } from '../../services/timetableService'
import ClassTimetableWidget from '../../components/ClassTimetableWidget'

export default function TeacherDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: teacherProfile, isLoading: teacherLoading } = useFetch(
    () => user?.refId ? teacherService.getById(user.refId) : Promise.resolve({ data: null }),
    [user?.refId],
  )

  const { data: assignments } = useFetch(
    () => user?.refId ? teacherAssignmentService.listByTeacher(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const assignedClassIds = useMemo(() => {
    const fromAssignments = (assignments || []).map((a) => a.classId).filter(Boolean)
    if (fromAssignments.length > 0) return [...new Set(fromAssignments)]
    return teacherProfile?.classIds || []
  }, [assignments, teacherProfile])

  const { data: classes, isLoading: classesLoading } = useFetch(
    () => classService.list(),
    [],
  )

  const [selectedClassId, setSelectedClassId] = useState('')
  const selectedClass = classes?.find((cls) => cls.id === selectedClassId)

  useEffect(() => {
    if (!selectedClassId) {
      if (assignedClassIds?.length > 0) {
        setSelectedClassId(assignedClassIds[0])
      } else if (classes?.length > 0) {
        setSelectedClassId(classes[0].id)
      }
    }
  }, [assignedClassIds, classes, selectedClassId])

  const { data: timetable, isLoading: timetableLoading } = useFetch(
    () => selectedClassId ? timetableService.getByClass(selectedClassId) : Promise.resolve({ data: null }),
    [selectedClassId],
  )

  const { data: classAssignments } = useFetch(
    () => selectedClassId ? teacherAssignmentService.listByClass(selectedClassId) : Promise.resolve({ data: [] }),
    [selectedClassId]
  )

  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: teachers, isLoading: teachersLoading } = useFetch(() => teacherService.list(), [])

  const subjectName = (idOrName) => {
    if (!idOrName) return 'Free'
    const match = subjects?.find((sub) => sub.id === idOrName || sub.name?.toLowerCase() === idOrName?.toLowerCase())
    return match ? match.name : idOrName
  }

  const teacherName = (idOrName) => {
    if (!idOrName) return ''
    const match = teachers?.find((t) => t.id === idOrName || t.name?.toLowerCase() === idOrName?.toLowerCase())
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

          // Official class assignment for this subject in the selected class
          const officialAssignment = classAssignments?.find(
            (a) =>
              (entry.subjectId && a.subjectId === entry.subjectId) ||
              (sName && a.subjectName && a.subjectName.toLowerCase() === sName.toLowerCase())
          )

          // Does the logged-in teacher actually teach this subject in this class?
          const isAssignedSubject = (assignments || []).some(
            (a) =>
              (!a.classId || a.classId === selectedClassId) &&
              (
                (entry.subjectId && a.subjectId === entry.subjectId) ||
                (sName && a.subjectName && a.subjectName.toLowerCase() === sName.toLowerCase())
              )
          )

          // Resolve teacher name:
          // 1. Breaks and activities never have a teacher
          // 2. If official class assignment exists, use the assigned teacher
          // 3. Otherwise fallback to entry teacherName
          let tName = ''
          if (!isBreak) {
            if (officialAssignment?.teacherName) {
              tName = officialAssignment.teacherName
            } else {
              tName = entry.teacherName || teacherName(entry.teacherId)
            }
          }

          // A period is ONLY "Your Class" if:
          // 1. It is NOT a break / special activity
          // 2. The subject is one this teacher is officially assigned to teach
          // 3. The teacher for this period matches this logged-in teacher
          const teacherMatches =
            (entry.teacherId && entry.teacherId === user?.refId) ||
            (entry.teacherName && user?.name && entry.teacherName.toLowerCase() === user.name.toLowerCase()) ||
            (tName && user?.name && tName.toLowerCase() === user.name.toLowerCase()) ||
            (officialAssignment?.teacherId && officialAssignment.teacherId === user?.refId)

          const isMyClass = !isBreak && isAssignedSubject && teacherMatches

          row[`day${dayIndex}`] = {
            subject: sName,
            teacher: isBreak ? '' : tName,
            isMyClass,
            isBreak,
          }
        } else {
          row[`day${dayIndex}`] = {
            subject: 'Free',
            teacher: '',
            isMyClass: false,
            isBreak: false,
          }
        }
      }
      return row
    })
  }, [timetable, subjects, teachers, user, assignments, classAssignments, selectedClassId])

  const actions = [
    {
      title: 'Mark Attendance',
      description: 'Record today’s attendance.',
      icon: ClipboardCheck,
      color: 'bg-blue-100 text-blue-600',
      path: '/teacher/attendance',
    },
    {
      title: 'Upload Marks',
      description: 'Enter examination marks.',
      icon: GraduationCap,
      color: 'bg-green-100 text-green-600',
      path: '/teacher/marks',
    },
    {
      title: 'Homework',
      description: 'Assign homework to students.',
      icon: BookOpen,
      color: 'bg-orange-100 text-orange-600',
      path: '/teacher/homework',
    },
    {
      title: 'Study Materials',
      description: 'Upload PDFs and useful links.',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      path: '/teacher/materials',
    },
    {
      title: 'Student Remarks',
      description: 'Write remarks for students.',
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-600',
      path: '/teacher/remarks',
    },
  ]

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 p-8 text-white shadow-xl">
        <p className="mt-2 text-blue-100">
          Manage your classes, assignments, attendance, study materials and student performance from one dashboard.
        </p>
      </div>

      {/* Timetable */}
      <div className="rounded-2xl bg-white shadow-md border p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <CalendarDays size={28} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Class Timetable
              </h2>
              <p className="text-xs text-slate-500">
                Weekly schedule for your classes. Slots marked with ⭐ indicate your assigned classes.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="max-w-md">
            <label className="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wide">
              Select Class:
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={classesLoading || (!classes?.length)}
            >
              {!classes?.length && <option value="">No classes available</option>}

              {/* Assigned classes first */}
              {assignedClassIds.length > 0 && (
                <optgroup label="⭐ Your Assigned Classes">
                  {classes?.filter((cls) => assignedClassIds.includes(cls.id)).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} {cls.section ? `(${cls.section})` : ''} - Assigned
                    </option>
                  ))}
                </optgroup>
              )}

              {/* Other classes */}
              <optgroup label={assignedClassIds.length > 0 ? "Other School Classes" : "All Classes"}>
                {classes?.filter((cls) => !assignedClassIds.includes(cls.id)).map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.section ? `(${cls.section})` : ''}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {(timetableLoading || teacherLoading || classesLoading || teachersLoading) ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-sky-50">
              <Spinner label="Loading timetable..." />
            </div>
          ) : !selectedClassId ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-sky-50 px-6 text-center">
              <CalendarDays size={52} className="text-blue-400" />
              <p className="mt-4 text-gray-500">
                Select a class above to view its timetable.
              </p>
            </div>
          ) : !timetable?.entries?.length ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 px-6 text-center">
              <CalendarDays size={48} className="text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No timetable published for this class yet.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                The school administrator has not published a schedule for {selectedClass?.name || 'this class'} yet.
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
                        className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-600 border-r border-slate-200 min-w-[140px]"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex] || `Day ${dayIndex + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tableRows.map((row) => (
                    <tr key={row.periodIndex} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      {/* Period Header */}
                      <td className="px-4 py-3 border-r border-slate-200 bg-slate-50/60">
                        <div className="font-bold text-xs text-slate-800">{row.slotLabel}</div>
                        {row.slotLabel !== row.periodName && (
                          <div className="text-[10px] text-slate-400 font-medium">{row.periodName}</div>
                        )}
                      </td>

                      {/* Day Cells */}
                      {Array.from({ length: timetable.daysPerWeek || 6 }).map((_, dayIndex) => {
                        const cell = row[`day${dayIndex}`] || { subject: 'Free' }
                        const isFree = !cell.subject || cell.subject.toLowerCase() === 'free'

                        return (
                          <td
                            key={dayIndex}
                            className={`px-3 py-2.5 text-center border-r border-slate-200 transition ${
                              cell.isMyClass
                                ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-300'
                                : cell.isBreak
                                ? 'bg-amber-50/50'
                                : isFree
                                ? 'bg-white'
                                : 'bg-blue-50/30'
                            }`}
                          >
                            {cell.isMyClass && (
                              <div className="inline-block text-[10px] font-bold px-1.5 py-0.5 mb-1 bg-emerald-600 text-white rounded">
                                ⭐ Your Class
                              </div>
                            )}

                            <div
                              className={`text-xs ${
                                cell.isMyClass
                                  ? 'font-bold text-emerald-900'
                                  : cell.isBreak
                                  ? 'font-semibold text-amber-800'
                                  : isFree
                                  ? 'text-slate-400 italic'
                                  : 'font-semibold text-slate-800'
                              }`}
                            >
                              {cell.subject}
                            </div>

                            {cell.teacher && (
                              <div
                                className={`text-[11px] mt-0.5 ${
                                  cell.isMyClass ? 'text-emerald-700 font-medium' : 'text-slate-500'
                                }`}
                              >
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
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-blue-700 mb-5">
          Quick Actions
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <div
                key={action.title}
                className="rounded-2xl border bg-white p-6 shadow-md hover:shadow-xl transition-all"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.color}`}
                >
                  <Icon size={28} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-800">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>

                <button
                  onClick={() => navigate(action.path)}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  Open
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Announcements */}
      <AnnouncementsWidget />

    </div>
  )
}