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
import LmsHeroBanner from '../../components/dashboard/LmsHeroBanner'
import PopularCoursesWidget from '../../components/dashboard/PopularCoursesWidget'
import ActivityProgressWidget from '../../components/dashboard/ActivityProgressWidget'
import BestInstructorsWidget from '../../components/dashboard/BestInstructorsWidget'
import SchoolPerformanceBarWidget from '../../components/dashboard/SchoolPerformanceBarWidget'
import OverallPassDonutWidget from '../../components/dashboard/OverallPassDonutWidget'
import ContentUsageTrendWidget from '../../components/dashboard/ContentUsageTrendWidget'

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

  const teacherCourses = useMemo(() => {
    if (assignments && assignments.length > 0) {
      const styles = [
        { bgColor: 'bg-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200' },
        { bgColor: 'bg-rose-500', tagBg: 'bg-rose-50 text-rose-700 border-rose-200' },
        { bgColor: 'bg-teal-500', tagBg: 'bg-teal-50 text-teal-700 border-teal-200' },
        { bgColor: 'bg-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' },
      ]
      return assignments.slice(0, 4).map((a, idx) => {
        const style = styles[idx % styles.length]
        return {
          id: a.id || idx,
          title: a.subjectName || subjectName(a.subjectId) || 'Assigned Subject',
          subtext: `${a.className || 'Class Section'} • Active`,
          tag: 'Assigned',
          ...style,
        }
      })
    }
    return [
      { id: 1, title: 'Higher Mathematics', subtext: 'Grade 10A • In Session', tag: 'Period 1', bgColor: 'bg-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 2, title: 'Physics & Lab', subtext: 'Grade 10B • In Session', tag: 'Period 3', bgColor: 'bg-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 3, title: 'Computer Science', subtext: 'Grade 9A • In Session', tag: 'Period 4', bgColor: 'bg-teal-500', tagBg: 'bg-teal-50 text-teal-700 border-teal-200' },
      { id: 4, title: 'Applied Mathematics', subtext: 'Grade 9B • In Session', tag: 'Period 6', bgColor: 'bg-rose-500', tagBg: 'bg-rose-50 text-rose-700 border-rose-200' },
    ]
  }, [assignments, subjects])

  const facultyPeers = useMemo(() => {
    if (teachers && teachers.length > 0) {
      return teachers.slice(0, 4).map((t, idx) => {
        const colors = ['border-amber-400', 'border-rose-400', 'border-teal-400', 'border-blue-500']
        return {
          id: t.id,
          name: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Teacher',
          role: t.designation || t.department || 'Faculty Colleague',
          avatar: t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || 'T')}&background=0ea5e9&color=fff&bold=true`,
          color: colors[idx % colors.length],
        }
      })
    }
    return [
      { id: 1, name: 'Ali Haider', role: 'Mathematics Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', color: 'border-amber-400' },
      { id: 2, name: 'Naeem Trump', role: 'Computer Science Faculty', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', color: 'border-rose-400' },
      { id: 3, name: 'Tyler Desk', role: 'Physical Sciences Head', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', color: 'border-teal-400' },
      { id: 4, name: 'Johan Alem', role: 'Languages & Arts', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', color: 'border-blue-500' },
    ]
  }, [teachers])

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

      {/* Row 1: LMS Hero Banner & Quick Actions */}
      <LmsHeroBanner
        greetingTitle="Empower & Guide Your Students!"
        greetingSubtitle="Manage your classrooms, publish syllabus notes, track daily attendances, and evaluate academic marks."
        badge1={{
          icon: GraduationCap,
          label: 'Assigned Classes',
          value: `${assignedClassIds?.length || 3} Classes`,
          color: 'pink',
        }}
        badge2={{
          icon: BookOpen,
          label: 'Weekly Periods',
          value: '36+ Slots',
          color: 'amber',
        }}
        illustrationSrc="/assets/student_banner_illustration.jpg"
        actionTitle="Classroom Quick Action"
        actionBtnText="+ Take Today's Attendance"
        onActionClick={() => navigate('/teacher/attendance')}
        statBox1={{
          label: 'Assigned Subjects',
          value: `${assignments?.length || 4}`,
        }}
        statBox2={{
          label: 'Pending Evaluations',
          value: '6',
        }}
      />

      {/* Row 2: Assigned Subjects | Teaching Activity | Faculty Peers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <PopularCoursesWidget
              title="Assigned Subjects"
              viewAllText="Study Materials"
              onViewAll={() => navigate('/teacher/materials')}
              courses={teacherCourses}
              onCourseClick={() => navigate('/teacher/materials')}
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <ActivityProgressWidget
              title="Teaching Activity"
              chartSubtitle="Monthly Lecture Delivery"
              stat1={{
                value: '340+',
                label: 'Lectures Given',
                bgColor: 'from-amber-400 to-amber-500',
                onClick: () => navigate('/teacher/attendance'),
              }}
              stat2={{
                value: '98%',
                label: 'Attendance Marked',
                bgColor: 'from-rose-500 to-rose-600',
                onClick: () => navigate('/teacher/attendance'),
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <BestInstructorsWidget
              title="Faculty Peers"
              viewAllText="All Faculty"
              onViewAll={() => {}}
              instructors={facultyPeers}
              onChat={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Class Performance | Attendance Rate Donut | Submissions Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 flex">
          <div className="w-full">
            <SchoolPerformanceBarWidget
              title="Class Average Performance"
              data={[
                { name: 'Grade 10A', score: 89, color: '#0ea5e9' },
                { name: 'Grade 10B', score: 84, color: '#6366f1' },
                { name: 'Grade 9A', score: 76, color: '#14b8a6' },
                { name: 'Grade 9B', score: 72, color: '#f43f5e' },
                { name: 'Grade 8A', score: 68, color: '#f59e0b' },
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex">
          <div className="w-full">
            <OverallPassDonutWidget
              title="Class Attendance Rate"
              passRate={91}
              failRate={9}
              passLabel="Present"
              failLabel="Absent"
            />
          </div>
        </div>

        <div className="lg:col-span-3 flex">
          <div className="w-full">
            <ContentUsageTrendWidget
              title="Homework Submissions"
              trendText="6.8% higher than last week"
            />
          </div>
        </div>
      </div>

      {/* Timetable */}
      <div className="rounded-3xl bg-white shadow-xs border border-slate-200 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <CalendarDays size={26} className="text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">
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
        <h2 className="font-display text-xl font-bold text-slate-900 mb-5">
          Classroom Workspace Tools
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <div
                key={action.title}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                    {action.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <button
                  onClick={() => navigate(action.path)}
                  className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-600 cursor-pointer shadow-xs"
                >
                  Access {action.title} &rarr;
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