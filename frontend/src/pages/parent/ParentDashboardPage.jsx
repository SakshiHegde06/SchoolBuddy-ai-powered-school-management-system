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

export default function ParentDashboardPage() {
  const { user } = useAuth()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [parentId, setParentId] = useState(user?.refId || null)
  const [activeTab, setActiveTab] = useState('ACADEMICS')

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
    { id: 'ACADEMICS', label: 'Academic Grades & Performance', icon: Award },
    { id: 'ATTENDANCE', label: 'Attendance Logbook (≥75% Rule)', icon: CalendarCheck },
    { id: 'HOMEWORK', label: `Homework (${homeworkList?.length || 0}) & Faculty Remarks`, icon: FileText },
    { id: 'NOTICES', label: 'School Announcements', icon: MessageSquare },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header with Child Selector & Transcript Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>{activeChild ? `${activeChild.name}` : 'Student'}</span>
            </span>
            {childClassId && (
              <span className="text-xs text-slate-400 font-medium">
                Enrolled Student
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Parent Academic Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Review {activeChild ? `${activeChild.name}'s` : "your child's"} syllabus grades, subject attendance compliance, homework, and teacher remarks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {activeChildId && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Official Academic Transcript</span>
            </button>
          )}
        </div>
      </div>

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