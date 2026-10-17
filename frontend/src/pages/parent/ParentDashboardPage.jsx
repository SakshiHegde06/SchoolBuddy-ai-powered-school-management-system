import { useState, useMemo, useEffect } from 'react'
import {
  Users,
  MessageSquare,
  Brain,
  Award,
  FileText,
  Calendar,
  Download,
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

  return (
    <div className="space-y-8">
      {/* Header with Child Selector & Transcript Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Parent Academic Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track {activeChild ? `${activeChild.name}'s` : "your child's"} subject attendance (≥75% rule), exam marks, homework, and teacher remarks.
          </p>
        </div>

        {activeChildId && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>Official Academic Transcript</span>
          </button>
        )}
      </div>

      {/* Child Selector (if multiple children) */}
      {children && children.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition cursor-pointer ${
                activeChildId === child.id
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-500'
              }`}
            >
              <Users size={16} />
              {child.name}
            </button>
          ))}
        </div>
      )}

      <AnnouncementsWidget limit={3} title="Recent Announcements" />

      {/* Marks & Academic Performance (with per-subject attendance ≥75%) */}
      <Card title="Academic Performance & Exam Results">
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

      {/* Detailed Homework Assignments for Child */}
      <Card title={`Class Homework Assignments (${homeworkList?.length || 0})`}>
        {homeworkLoading ? (
          <Spinner label="Loading homework..." />
        ) : !homeworkList || homeworkList.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <FileText size={36} className="mx-auto text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">
              No pending homework assigned
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your child is all caught up with their current class assignments.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {homeworkList.map((hw) => (
              <div
                key={hw.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    {hw.title}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
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

      {/* Everyday Attendance Logbook & AI Analytics */}
      <StudentAttendanceLogbook
        studentId={activeChildId}
        classId={childClassId}
      />

      {/* Teacher Remarks */}
      <Card title="Teacher Remarks">
        {remarks && remarks.length > 0 ? (
          <div className="space-y-4">
            {remarks.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-600" />
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
          <p className="text-xs text-slate-500">
            No teacher remarks recorded yet for this student.
          </p>
        )}
      </Card>

      {/* AI Academic Performance Analysis */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Brain size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">
            AI Academic Performance Analysis
          </h2>
        </div>
        <AiPerformanceAnalysis studentId={activeChildId} />
      </div>

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