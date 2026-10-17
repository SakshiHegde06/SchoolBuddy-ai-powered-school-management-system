import { useState, useMemo } from 'react'
import ClassTimetableWidget from "../../components/ClassTimetableWidget";
import {
  Users,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Brain,
} from 'lucide-react'

import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'
import SubjectDeck from '../../components/marks/SubjectDeck'
import StudentAttendanceLogbook from '../../components/attendance/StudentAttendanceLogbook'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'

import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

import { parentService } from '../../services/parentService'
import { studentService } from '../../services/studentService'
import { attendanceService } from '../../services/attendanceService'
import { markService } from '../../services/markService'
import { subjectService } from '../../services/subjectService'
import { remarkService } from '../../services/remarkService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'

import { formatPercent } from '../../utils/formatters'

export default function ParentDashboardPage() {

  const { user } = useAuth()

  const parentId = user?.refId

  const { data: parentProfile, isLoading: parentLoading } = useFetch(
    () => parentService.getById(parentId),
    [parentId]
  )

  const { data: directChildren, isLoading: directChildrenLoading } = useFetch(
    () => parentId ? parentService.getChildren(parentId) : Promise.resolve({ data: [] }),
    [parentId]
  )

  const legacyChildrenIds = parentProfile?.childrenIds || []

  const { data: legacyChildren, isLoading: legacyLoading } = useFetch(
    () =>
      (!directChildren?.length && legacyChildrenIds.length > 0)
        ? Promise.all(legacyChildrenIds.map((id) => studentService.getById(id)))
            .then((results) => ({ data: results.map((r) => r.data) }))
        : Promise.resolve({ data: [] }),
    [directChildren?.length, JSON.stringify(legacyChildrenIds)]
  )

  const children = (directChildren && directChildren.length > 0) ? directChildren : (legacyChildren || [])
  const childrenIds = children.map((c) => c.id)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const activeChildId = selectedChildId || childrenIds[0]

  const activeChild = children.find((c) => c.id === activeChildId)
  const childClassId = activeChild?.classId

  const { data: assignments } = useFetch(
    () => childClassId ? teacherAssignmentService.listByClass(childClassId) : Promise.resolve({ data: [] }),
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

  const { data: subjects } = useFetch(
    () => subjectService.list(),
    []
  )

  const attendancePct =
    attendance && attendance.length > 0
      ? (attendance.filter(a => a.status === 'PRESENT').length / attendance.length) * 100
      : null

  if (parentLoading) {
    return <Spinner label="Loading dashboard..." />
  }

  if (childrenIds.length === 0) {
    return (
      <Card title="No Child Linked">
        <p className="text-sm text-slate-500">
          Ask the school administrator to link your account with your child's profile.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Parent Dashboard
        </h1>

        <p className="mt-1 text-slate-500">
          Monitor your child's attendance, academic performance and teacher remarks.
        </p>
      </div>

      {/* Child Selector */}

      {children && children.length > 1 && (
        <div className="flex flex-wrap gap-3">

          {children.map(child => (

            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition ${
                activeChildId === child.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-blue-500'
              }`}
            >
              <Users size={16} />
              {child.name}
            </button>

          ))}

        </div>
      )}

      {/* Summary */}

      <div className="grid gap-5 md:grid-cols-3">

        <SummaryCard
          icon={<ClipboardCheck size={20} />}
          label="Attendance"
          value={formatPercent(attendancePct)}
        />

        <SummaryCard
          icon={<GraduationCap size={20} />}
          label="Subjects"
          value={subjects?.length || 0}
        />

        <SummaryCard
          icon={<Brain size={20} />}
          label="AI Status"
          value="Coming Soon"
        />

      </div>

      <AnnouncementsWidget limit={3} title="Recent Announcements" />

      {/* Marks & Academic Performance */}

      <Card title="Academic Performance">

        {marksLoading ? (
          <Spinner />
        ) : (
          <SubjectDeck
            marks={marks}
            subjects={subjects}
            teacherMap={teacherMap}
          />
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

            {remarks.map(item => (

              <div
                key={item.id}
                className="rounded-lg border border-slate-200 p-4"
              >

                <div className="flex items-center gap-2">

                  <MessageSquare
                    size={18}
                    className="text-slate-500"
                  />

                  <span className="font-medium text-slate-800">
                    {item.teacherName}
                  </span>

                </div>

                <p className="mt-3 text-slate-700">
                  {item.remark}
                </p>

                <p className="mt-3 text-xs text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>

              </div>

            ))}

          </div>

        ) : (

          <p className="text-slate-500">
            No teacher remarks available.
          </p>

        )}

      </Card>

      {/* AI Performance Analysis */}

      <div>
        <div className="mb-4 flex items-center gap-3">
          <Brain size={28} className="text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">
            AI Academic Performance Analysis
          </h2>
        </div>
        <AiPerformanceAnalysis studentId={activeChildId} />
      </div>

    </div>
  )
}

function SummaryCard({ icon, label, value }) {

  return (

    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500">
            {label}
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </h2>

        </div>

        <div className="rounded-lg bg-slate-100 p-3 text-slate-700">
          {icon}
        </div>

      </div>

    </div>

  )

}