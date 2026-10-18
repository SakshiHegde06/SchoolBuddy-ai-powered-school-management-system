import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  MessageSquare,
  Brain,
  Award,
  FileText,
  Calendar,
  Download,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  Clock,
  Sparkles,
} from 'lucide-react'

import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'
import SubjectDeck from '../../components/marks/SubjectDeck'
import StudentAttendanceLogbook from '../../components/attendance/StudentAttendanceLogbook'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'
import ReportCardModal from '../../components/reports/ReportCardModal'
import LmsHeroBanner from '../../components/dashboard/LmsHeroBanner'
import PopularCoursesWidget from '../../components/dashboard/PopularCoursesWidget'
import ActivityProgressWidget from '../../components/dashboard/ActivityProgressWidget'
import BestInstructorsWidget from '../../components/dashboard/BestInstructorsWidget'
import SchoolPerformanceBarWidget from '../../components/dashboard/SchoolPerformanceBarWidget'
import OverallPassDonutWidget from '../../components/dashboard/OverallPassDonutWidget'
import ContentUsageTrendWidget from '../../components/dashboard/ContentUsageTrendWidget'
import { LayoutDashboard } from 'lucide-react'

import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

import { parentService } from '../../services/parentService'
import { studentService } from '../../services/studentService'
import { attendanceService } from '../../services/attendanceService'
import { markService } from '../../services/markService'
import { subjectService } from '../../services/subjectService'
import { remarkService } from '../../services/remarkService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { homeworkService } from '../../services/homeworkService'
import { teacherService } from '../../services/teacherService'

export default function ParentDashboardPage() {
  const { user } = useAuth()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [parentId, setParentId] = useState(user?.refId || null)
  const [activeTab, setActiveTab] = useState('OVERVIEW')

  // Auto-resolve parent ID if missing on user object
  useEffect(() => {
    if (user?.refId) {
      setParentId(user.refId)
    } else if (user?.email) {
      parentService
        .findAll()
        .then((res) => {
          const list = res.data || []
          const found = list.find(
            (p) =>
              p.email?.toLowerCase() === user.email.toLowerCase() ||
              p.userId === user.id
          )
          if (found) setParentId(found.id)
        })
        .catch(() => {})
    }
  }, [user?.refId, user?.email, user?.id])

  const { data: parentProfile, isLoading: parentLoading } = useFetch(
    () => (parentId ? parentService.getById(parentId) : Promise.resolve({ data: null })),
    [parentId]
  )

  const { data: directChildren, isLoading: directChildrenLoading } = useFetch(
    () => (parentId ? parentService.getChildren(parentId) : Promise.resolve({ data: [] })),
    [parentId]
  )

  const legacyChildrenIds = parentProfile?.childrenIds || []

  const { data: legacyChildren, isLoading: legacyLoading } = useFetch(
    () =>
      !directChildren?.length && legacyChildrenIds.length > 0
        ? Promise.all(legacyChildrenIds.map((id) => studentService.getById(id))).then(
            (results) => ({ data: results.map((r) => r.data) })
          )
        : Promise.resolve({ data: [] }),
    [directChildren?.length, JSON.stringify(legacyChildrenIds)]
  )

  const children =
    directChildren && directChildren.length > 0
      ? directChildren
      : legacyChildren || []
  const childrenIds = children.map((c) => c.id)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const activeChildId = selectedChildId || childrenIds[0]

  const activeChild = children.find((c) => c.id === activeChildId)
  const childClassId = activeChild?.classId

  const { data: assignments } = useFetch(
    () =>
      childClassId
        ? teacherAssignmentService.listByClass(childClassId)
        : Promise.resolve({ data: [] }),
    [childClassId]
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

  const { data: attendance } = useFetch(
    () =>
      activeChildId
        ? attendanceService.getByStudent(activeChildId)
        : Promise.resolve({ data: [] }),
    [activeChildId]
  )

  const { data: marks, isLoading: marksLoading } = useFetch(
    () =>
      activeChildId
        ? markService.findByStudent(activeChildId)
        : Promise.resolve({ data: [] }),
    [activeChildId]
  )

  const { data: remarks } = useFetch(
    () =>
      activeChildId
        ? remarkService.getByStudent(activeChildId)
        : Promise.resolve({ data: [] }),
    [activeChildId]
  )

  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: teachers } = useFetch(() => teacherService.list(), [])

  const childCourses = useMemo(() => {
    if (subjects && subjects.length > 0) {
      const styles = [
        { bgColor: 'bg-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200' },
        { bgColor: 'bg-rose-500', tagBg: 'bg-rose-50 text-rose-700 border-rose-200' },
        { bgColor: 'bg-teal-500', tagBg: 'bg-teal-50 text-teal-700 border-teal-200' },
        { bgColor: 'bg-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' },
      ]
      return subjects.slice(0, 4).map((sub, idx) => {
        const style = styles[idx % styles.length]
        return {
          id: sub.id,
          title: sub.name,
          subtext: `${teacherMap[sub.id] ? teacherMap[sub.id] + ' • ' : ''}Curriculum Active`,
          tag: sub.type || 'Academic',
          ...style,
        }
      })
    }
    return [
      { id: 1, title: 'Mathematics', subtext: 'Curriculum Active', tag: 'Core', bgColor: 'bg-blue-600', tagBg: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 2, title: 'Science & Physics', subtext: 'Theory & Practical', tag: 'Science', bgColor: 'bg-amber-400', tagBg: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 3, title: 'English Literature', subtext: 'Language Arts', tag: 'Language', bgColor: 'bg-rose-500', tagBg: 'bg-rose-50 text-rose-700 border-rose-200' },
      { id: 4, title: 'Social Studies', subtext: 'History & Civics', tag: 'Social', bgColor: 'bg-teal-500', tagBg: 'bg-teal-50 text-teal-700 border-teal-200' },
    ]
  }, [subjects, teacherMap])

  const childTeachers = useMemo(() => {
    if (teachers && teachers.length > 0) {
      return teachers.slice(0, 4).map((t, idx) => {
        const colors = ['border-amber-400', 'border-rose-400', 'border-teal-400', 'border-blue-500']
        return {
          id: t.id,
          name: t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Teacher',
          role: t.designation || t.department || 'Subject Teacher',
          avatar: t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name || 'T')}&background=0ea5e9&color=fff&bold=true`,
          color: colors[idx % colors.length],
        }
      })
    }
    return [
      { id: 1, name: 'Ali Haider', role: 'Mathematics Lead', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', color: 'border-amber-400' },
      { id: 2, name: 'Naeem Trump', role: 'Computer Science Faculty', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', color: 'border-rose-400' },
      { id: 3, name: 'Tyler Desk', role: 'Physics & Sciences Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', color: 'border-teal-400' },
      { id: 4, name: 'Johan Alem', role: 'Language & Arts', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', color: 'border-blue-500' },
    ]
  }, [teachers])

  const { data: homeworkList, isLoading: homeworkLoading } = useFetch(
    () =>
      childClassId
        ? homeworkService.findByClass(childClassId)
        : Promise.resolve({ data: [] }),
    [childClassId]
  )

  const subjectName = (idOrName) => {
    if (!idOrName) return 'Subject'
    const match = subjects?.find(
      (sub) =>
        sub.id === idOrName ||
        sub.name?.toLowerCase() === idOrName?.toLowerCase()
    )
    return match ? match.name : idOrName
  }

  if (parentLoading || directChildrenLoading) {
    return <Spinner label="Loading parent dashboard..." />
  }

  if (childrenIds.length === 0) {
    return (
      <Card title="No Linked Student Found">
        <p className="text-sm text-slate-500">
          Your parent account is active. Once the school administrator links your account to your child, their attendance, homework, and marks will display here.
        </p>
      </Card>
    )
  }

  const PARENT_TABS = [
    { id: 'OVERVIEW', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'ACADEMICS', label: 'Academic Grades & Performance', icon: Award },
    { id: 'ATTENDANCE', label: 'Attendance Logbook (≥75% Rule)', icon: CalendarCheck },
    { id: 'HOMEWORK', label: `Homework (${homeworkList?.length || 0}) & Faculty Remarks`, icon: FileText },
    { id: 'NOTICES', label: 'School Announcements', icon: MessageSquare },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. LMS Hero Banner & Quick Actions */}
      <LmsHeroBanner
        greetingTitle={`Welcome, ${user?.name || 'Guardian'}!`}
        greetingSubtitle={`Track ${activeChild ? activeChild.name + "'s" : "your child's"} syllabus progress, attendance compliance, exam grades, and teacher remarks.`}
        badge1={{
          icon: GraduationCap,
          label: 'Student',
          value: activeChild?.name || 'Enrolled Ward',
          color: 'pink',
        }}
        badge2={{
          icon: BookOpen,
          label: 'Class',
          value: activeChild?.grade ? `Grade ${activeChild.grade}` : 'Active',
          color: 'amber',
        }}
        illustrationSrc="/assets/student_banner_illustration.jpg"
        actionTitle="Guardian Quick Action"
        actionBtnText="📄 Official Academic Transcript"
        onActionClick={() => setIsReportModalOpen(true)}
        statBox1={{
          label: 'Enrolled Subjects',
          value: `${subjects?.length || 6}`,
        }}
        statBox2={{
          label: 'Pending Tasks',
          value: `${homeworkList?.length || 0}`,
        }}
      />

      {/* Child Switcher (if parent has multiple enrolled children) */}
      {children && children.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            Select Child:
          </span>
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeChildId === child.id
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400'
              }`}
            >
              <Users size={14} />
              <span>{child.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* 2. Workspace Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs gap-1 overflow-x-auto scrollbar-none">
        {PARENT_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Tab Content Panels */}

      {/* TAB 0: DASHBOARD OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Row 2: Popular Courses | Current Activity | Best Instructors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-4 flex">
              <div className="w-full">
                <PopularCoursesWidget
                  title="Enrolled Subjects"
                  viewAllText="View Grades"
                  onViewAll={() => setActiveTab('ACADEMICS')}
                  courses={childCourses}
                  onCourseClick={() => setActiveTab('ACADEMICS')}
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex">
              <div className="w-full">
                <ActivityProgressWidget
                  title="Academic Growth"
                  chartSubtitle="Monthly Score Trajectory"
                  stat1={{
                    value: '92%',
                    label: 'Term Attendance',
                    bgColor: 'from-amber-400 to-amber-500',
                    onClick: () => setActiveTab('ATTENDANCE'),
                  }}
                  stat2={{
                    value: 'Grade A',
                    label: 'Academic Standing',
                    bgColor: 'from-rose-500 to-rose-600',
                    onClick: () => setActiveTab('ACADEMICS'),
                  }}
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex">
              <div className="w-full">
                <BestInstructorsWidget
                  title="Subject Teachers"
                  viewAllText="Faculty Feedback"
                  onViewAll={() => setActiveTab('HOMEWORK')}
                  instructors={childTeachers}
                  onChat={() => setActiveTab('HOMEWORK')}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Performance Bar | Attendance Donut | Engagement Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-5 flex">
              <div className="w-full">
                <SchoolPerformanceBarWidget
                  title="Subject Scores Breakdown"
                  data={[
                    { name: 'Mathematics', score: 88, color: '#0ea5e9' },
                    { name: 'Physics', score: 82, color: '#6366f1' },
                    { name: 'Chemistry', score: 79, color: '#14b8a6' },
                    { name: 'English', score: 91, color: '#f43f5e' },
                    { name: 'Social Studies', score: 85, color: '#f59e0b' },
                  ]}
                />
              </div>
            </div>

            <div className="lg:col-span-4 flex">
              <div className="w-full">
                <OverallPassDonutWidget
                  title="Attendance Compliance"
                  passRate={92}
                  failRate={8}
                  passLabel="Present (≥75%)"
                  failLabel="Absent"
                />
              </div>
            </div>

            <div className="lg:col-span-3 flex">
              <div className="w-full">
                <ContentUsageTrendWidget
                  title="Learning Engagement"
                  trendText="5.2% higher this month"
                />
              </div>
            </div>
          </div>

          {/* Quick Access & Announcements */}
          <div className="grid gap-6 lg:grid-cols-2 pt-2">
            <AnnouncementsWidget limit={3} title="Recent School Notices" />

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Guardian Quick Shortcuts
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access examination results, teacher remarks, or download official report cards.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => setActiveTab('ACADEMICS')}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100 transition text-left"
                  >
                    <Award size={18} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 mt-1">Academics</span>
                    <span className="text-[10px] text-indigo-600 font-medium">Exam marks deck</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('ATTENDANCE')}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-100 transition text-left"
                  >
                    <CalendarCheck size={18} className="text-teal-600" />
                    <span className="text-xs font-bold text-teal-950 mt-1">Attendance</span>
                    <span className="text-[10px] text-teal-600 font-medium">≥75% compliance log</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('HOMEWORK')}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 transition text-left"
                  >
                    <FileText size={18} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-950 mt-1">Homework</span>
                    <span className="text-[10px] text-amber-600 font-medium">Teacher feedback</span>
                  </button>

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-100 transition text-left"
                  >
                    <Download size={18} className="text-rose-600" />
                    <span className="text-xs font-bold text-rose-950 mt-1">Report Card</span>
                    <span className="text-[10px] text-rose-600 font-medium">Download PDF</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{activeChild?.name} • Grade {activeChild?.grade || 'Active'}</span>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Download Transcript →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ACADEMICS & GRADES */}
      {activeTab === 'ACADEMICS' && (
        <div className="space-y-6">
          <Card title="Subject-Wise Examination Marks">
            {marksLoading ? (
              <Spinner label="Loading marks..." />
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

          <Card title="AI Academic Performance Analysis">
            <AiPerformanceAnalysis studentId={activeChildId} />
          </Card>
        </div>
      )}

      {/* TAB 2: ATTENDANCE LOGBOOK */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-6">
          <StudentAttendanceLogbook
            studentId={activeChildId}
            classId={childClassId}
          />
        </div>
      )}

      {/* TAB 3: HOMEWORK & TEACHER REMARKS */}
      {activeTab === 'HOMEWORK' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Homework Column */}
          <Card title={`Class Homework Assignments (${homeworkList?.length || 0})`}>
            {homeworkLoading ? (
              <Spinner label="Loading homework..." />
            ) : !homeworkList || homeworkList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  No pending homework assigned
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your child is all caught up with their current class assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {homeworkList.map((hw) => (
                  <div
                    key={hw.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">
                        {hw.title}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {subjectName(hw.subjectId)}
                      </span>
                    </div>

                    {hw.description && (
                      <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-3">
                        {hw.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                        <Clock size={13} />
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
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold text-xs"
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

          {/* Teacher Remarks Column */}
          <Card title="Teacher Remarks & Feedback">
            {remarks && remarks.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {remarks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-indigo-600" />
                      <span className="font-bold text-slate-800 text-sm">
                        {item.teacherName || 'Assigned Faculty'}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-700 leading-relaxed italic">
                      &ldquo;{item.remark}&rdquo;
                    </p>

                    <p className="mt-2 text-[10px] text-slate-400 font-medium">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : 'Recent'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No teacher remarks recorded yet for this student.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: SCHOOL NOTICES */}
      {activeTab === 'NOTICES' && (
        <div className="space-y-6">
          <AnnouncementsWidget limit={6} title="Official School Announcements" />
        </div>
      )}

      {activeChildId && (
        <ReportCardModal
          studentId={activeChildId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  )
}