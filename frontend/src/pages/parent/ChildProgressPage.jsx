import { useEffect, useState, useMemo } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import SubjectDeck from '../../components/marks/SubjectDeck'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'
import StudentAttendanceLogbook from '../../components/attendance/StudentAttendanceLogbook'
import ReportCardModal from '../../components/reports/ReportCardModal'
import { Award } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { parentService } from '../../services/parentService'
import { studentService } from '../../services/studentService'
import { subjectService } from '../../services/subjectService'
import { markService } from '../../services/markService'
import { attendanceService } from '../../services/attendanceService'
import { remarkService } from '../../services/remarkService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { formatDate, formatPercent } from '../../utils/formatters'

export default function ChildProgressPage() {
  const { user } = useAuth()
  const { data: parent, isLoading: isLoadingParent } = useFetch(
    () => parentService.getById(user.refId),
    [user.refId]
  )

  const [children, setChildren] = useState([])
  const [isLoadingChildren, setIsLoadingChildren] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    if (!user?.refId) {
      setChildren([])
      setIsLoadingChildren(false)
      return
    }

    setIsLoadingChildren(true)
    parentService
      .getChildren(user.refId)
      .then((res) => {
        const list = res.data || []
        if (list.length > 0) {
          setChildren(list)
          setSelectedChildId((current) => current ?? list[0]?.id ?? null)
        } else if (parent?.childrenIds?.length) {
          // Fallback to legacy childrenIds lookup
          return Promise.all(parent.childrenIds.map((id) => studentService.getById(id))).then((responses) => {
            const loaded = responses.map((r) => r.data)
            setChildren(loaded)
            setSelectedChildId((current) => current ?? loaded[0]?.id ?? null)
          })
        } else {
          setChildren([])
        }
      })
      .catch(() => {
        if (parent?.childrenIds?.length) {
          Promise.all(parent.childrenIds.map((id) => studentService.getById(id))).then((responses) => {
            const loaded = responses.map((r) => r.data)
            setChildren(loaded)
            setSelectedChildId((current) => current ?? loaded[0]?.id ?? null)
          })
        }
      })
      .finally(() => setIsLoadingChildren(false))
  }, [user?.refId, parent])

  const { data: subjects } = useFetch(() => subjectService.list(), [])

  const { data: marks, isLoading: marksLoading } = useFetch(
    () => (selectedChildId ? markService.findByStudent(selectedChildId) : Promise.resolve({ data: [] })),
    [selectedChildId]
  )

  const { data: attendance, isLoading: attendanceLoading } = useFetch(
    () => (selectedChildId ? attendanceService.getByStudent(selectedChildId) : Promise.resolve({ data: [] })),
    [selectedChildId]
  )

  const { data: remarks, isLoading: remarksLoading } = useFetch(
    () => (selectedChildId ? remarkService.getByStudent(selectedChildId) : Promise.resolve({ data: [] })),
    [selectedChildId]
  )

  const selectedChild = children.find((c) => c.id === selectedChildId)
  const childClassId = selectedChild?.classId

  const { data: assignments } = useFetch(
    () => (childClassId ? teacherAssignmentService.listByClass(childClassId) : Promise.resolve({ data: [] })),
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

  if (isLoadingParent || isLoadingChildren) {
    return (
      <Card title="Child progress">
        <Spinner label="Loading children…" />
      </Card>
    )
  }

  if (!children.length) {
    return (
      <Card title="Child progress">
        <EmptyState
          title="No linked children yet"
          description="Once a child is linked to your account, their progress will show up here."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {selectedChild ? `${selectedChild.name}'s Academic Progress` : 'Child Progress'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time marks, daily attendance, teacher remarks, and certified report cards.
          </p>
        </div>

        {selectedChildId && (
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Award size={16} className="text-amber-300" />
            <span>Official Academic Report Card</span>
          </button>
        )}
      </div>

      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((child) => (
            <Button
              key={child.id}
              variant={child.id === selectedChildId ? 'primary' : 'ghost'}
              onClick={() => setSelectedChildId(child.id)}
            >
              {child.name}{child.section ? ` (${child.section})` : ''}
            </Button>
          ))}
        </div>
      )}

      {/* Everyday Attendance Logbook & AI Analytics */}
      <StudentAttendanceLogbook studentId={selectedChildId} classId={childClassId} />

      <Card title="Marks by subject">
        {marksLoading ? (
          <Spinner label="Loading marks…" />
        ) : (
          <SubjectDeck marks={marks || []} subjects={subjects || []} teacherMap={teacherMap} />
        )}
      </Card>

      <Card title="Teacher remarks">
        {remarksLoading ? (
          <Spinner label="Loading remarks…" />
        ) : remarks && remarks.length > 0 ? (
          <div className="space-y-3">
            {remarks.map((r) => (
              <div key={r.id} className="rounded-md border border-paper-200 p-3">
                <p className="text-sm text-ink-900">{r.remark}</p>
                <p className="mt-1 text-xs text-ink-400">{r.examType} · {formatDate(r.createdAt)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No remarks yet" description="Teacher feedback will show up here once added." />
        )}
      </Card>

      {selectedChildId && (
        <AiPerformanceAnalysis studentId={selectedChildId} title="AI performance analysis" />
      )}

      {selectedChildId && (
        <ReportCardModal
          studentId={selectedChildId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  )
}