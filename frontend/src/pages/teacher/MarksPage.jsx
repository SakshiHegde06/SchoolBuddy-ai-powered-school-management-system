import { useEffect, useState, useMemo } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Table from '../../components/common/Table'
import FormField, { inputClass } from '../../components/common/FormField'
import EmptyState from '../../components/common/EmptyState'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { subjectService } from '../../services/subjectService'
import { examService } from '../../services/examService'
import { markService } from '../../services/markService'
import { performanceService } from '../../services/performanceService'
import { academicYearService } from '../../services/academicYearService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

const todayIso = new Date().toISOString().slice(0, 10)

export default function MarksPage() {
  const { user } = useAuth()
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: allStudents } = useFetch(() => studentService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: academicYears } = useFetch(() => academicYearService.list(), [])
  const { data: assignments } = useFetch(
    () => user?.refId ? teacherAssignmentService.listByTeacher(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [examId, setExamId] = useState('')
  const [scores, setScores] = useState({}) // { [studentId]: marksObtained }
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [message, setMessage] = useState('')

  const isAdmin = user?.role === 'ADMIN'

  const assignedClassIds = (assignments?.length > 0)
    ? [...new Set(assignments.map((a) => a.classId).filter(Boolean))]
    : []

  const visibleClasses = isAdmin
    ? (classes || [])
    : (assignedClassIds.length > 0 ? (classes || []).filter((c) => assignedClassIds.includes(c.id)) : (classes || []))

  const assignedSubjectIdsForClass = (assignments || [])
    .filter((a) => a.classId === classId)
    .map((a) => a.subjectId)
    .filter(Boolean)

  const visibleSubjects = isAdmin
    ? (subjects || [])
    : (assignedSubjectIdsForClass.length > 0
        ? (subjects || []).filter((s) => assignedSubjectIdsForClass.includes(s.id))
        : (subjects || []))

  const activeAcademicYear = (academicYears || []).find((y) => y.isCurrent || y.current)?.name || '2026-2027'

  const { data: exams } = useFetch(
    () => (classId ? examService.listByClass(classId) : Promise.resolve({ data: [] })),
    [classId]
  )

  // Exams apply either to a specific subject, or to every subject in the class (subjectId === null)
  const examOptions = (exams || []).filter((e) => !subjectId || !e.subjectId || e.subjectId === subjectId)
  const selectedExam = (exams || []).find((e) => e.id === examId)

  const classStudents = (allStudents || []).filter((s) => s.classId === classId)

  // Reset downstream selections when an upstream one changes
  useEffect(() => { setSubjectId(''); setExamId(''); setScores({}) }, [classId])
  useEffect(() => { setExamId(''); setScores({}) }, [subjectId])
  useEffect(() => { setScores({}) }, [examId])

  // Validate if any entered score exceeds the exam max marks or is negative
  const invalidScores = useMemo(() => {
    if (!selectedExam) return []
    return Object.entries(scores)
      .filter(([, value]) => value !== '' && value !== undefined)
      .filter(([, value]) => {
        const n = Number(value)
        return isNaN(n) || n < 0 || n > selectedExam.maxMarks
      })
  }, [scores, selectedExam])

  const hasInvalidScore = invalidScores.length > 0

  async function handleSaveAndPublish() {
    if (!classId || !subjectId || !selectedExam) return

    if (hasInvalidScore) {
      setMessage(`Cannot save: One or more marks exceed the maximum exam limit of ${selectedExam.maxMarks} or are negative. Please correct the highlighted entries.`)
      return
    }

    const entries = Object.entries(scores).filter(([, value]) => value !== '' && value !== undefined)
    if (entries.length === 0) {
      setMessage('Please enter marks for at least one student before saving.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      await Promise.all(
        entries.map(([studentId, marksObtained]) =>
          markService.create({
            studentId,
            classId,
            subjectId,
            academicYearId: activeAcademicYear,
            term: selectedExam.name,
            type: selectedExam.type,
            marksObtained: Number(marksObtained),
            maxMarks: selectedExam.maxMarks,
            date: todayIso,
            examId: selectedExam.id,
            status: 'PUBLISHED',
          })
        )
      )
      // Also ensure all marks for this exam are marked PUBLISHED
      await markService.publishByExam(selectedExam.id).catch(() => {})
      setMessage(`✅ Saved and published marks for ${entries.length} student(s)! Parents and students can now view them immediately.`)
      setScores({})
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save marks. Please check the values and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveAll() {
    if (!classId || !subjectId || !selectedExam) return

    if (hasInvalidScore) {
      setMessage(`Cannot save: One or more marks exceed the maximum exam limit of ${selectedExam.maxMarks} or are negative. Please correct the highlighted entries.`)
      return
    }

    const entries = Object.entries(scores).filter(([, value]) => value !== '' && value !== undefined)
    if (entries.length === 0) {
      setMessage('Please enter marks for at least one student before saving.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      await Promise.all(
        entries.map(([studentId, marksObtained]) =>
          markService.create({
            studentId,
            classId,
            subjectId,
            academicYearId: activeAcademicYear,
            term: selectedExam.name,
            type: selectedExam.type,
            marksObtained: Number(marksObtained),
            maxMarks: selectedExam.maxMarks,
            date: todayIso,
            examId: selectedExam.id,
            status: 'DRAFT',
          })
        )
      )
      setMessage(`Saved marks for ${entries.length} student(s) as draft. Note: Parents/students cannot see drafts until published. Click "Publish All Marks" when ready.`)
      setScores({})
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save marks. Please check the values and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePublish() {
    if (!selectedExam) return
    if (!confirm(`Publish all marks for "${selectedExam.name}"? Students and parents will be able to see them immediately.`)) return
    setIsPublishing(true)
    setMessage('')
    try {
      const published = await markService.publishByExam(selectedExam.id)
      setMessage(`✅ Published ${published.data?.length ?? 0} mark(s) for ${selectedExam.name}. Parents and students can now view them.`)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to publish marks.')
    } finally {
      setIsPublishing(false)
    }
  }

  const subjectNameFor = (id) => {
    if (!id) return '—'
    const found = subjects?.find((s) => s.id === id || s.name?.toLowerCase() === id?.toLowerCase())
    return found?.name || id || '—'
  }

  return (
    <div className="space-y-6">
      <Card title="Enter marks in bulk">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Class">
            <select className={inputClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select a class…</option>
              {visibleClasses?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Subject">
            <select className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId}>
              <option value="">Select a subject…</option>
              {visibleSubjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Exam">
            <select className={inputClass} value={examId} onChange={(e) => setExamId(e.target.value)} disabled={!subjectId}>
              <option value="">Select an exam…</option>
              {examOptions.map((e) => <option key={e.id} value={e.id}>{e.name} (max {e.maxMarks})</option>)}
            </select>
          </FormField>
        </div>

        {subjectId && examOptions.length === 0 && (
          <EmptyState
            title="No exams set up for this class/subject yet"
            description="Ask an admin to create one on the Exams page (e.g. FA1, Mid-Term) before entering marks."
          />
        )}

        {selectedExam && classStudents.length === 0 && (
          <EmptyState title="No students in this class yet" />
        )}

        {selectedExam && classStudents.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-paper-200 text-xs uppercase tracking-wide text-ink-400">
                    <th className="py-2 pr-4 font-medium">Roll</th>
                    <th className="py-2 pr-4 font-medium">Student</th>
                    <th className="py-2 pr-4 font-medium">Marks (out of {selectedExam.maxMarks})</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((s, i) => {
                    const rawVal = scores[s.id]
                    const numVal = rawVal !== '' && rawVal !== undefined ? Number(rawVal) : null
                    const isExceeded = numVal !== null && !isNaN(numVal) && numVal > selectedExam.maxMarks
                    const isNegative = numVal !== null && !isNaN(numVal) && numVal < 0
                    const isInvalid = isExceeded || isNegative

                    return (
                      <tr key={s.id} className="border-b border-paper-200/60 last:border-0">
                        <td className="py-2.5 pr-4 text-ink-600 font-mono text-xs">{s.rollNumber || i + 1}</td>
                        <td className="py-2.5 pr-4 text-ink-900 font-medium">{s.name}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex flex-col">
                            <input
                              type="number"
                              min="0"
                              max={selectedExam.maxMarks}
                              step="any"
                              className={`${inputClass} w-32 ${
                                isInvalid
                                  ? '!border-red-500 !bg-red-50 !text-red-900 focus:!border-red-600 focus:!ring-red-200'
                                  : ''
                              }`}
                              value={scores[s.id] ?? ''}
                              onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })}
                              placeholder={`0 - ${selectedExam.maxMarks}`}
                            />
                            {isExceeded && (
                              <span className="mt-1 text-xs font-semibold text-red-600 flex items-center gap-1">
                                ⚠️ Exceeds max marks ({selectedExam.maxMarks})
                              </span>
                            )}
                            {isNegative && (
                              <span className="mt-1 text-xs font-semibold text-red-600">
                                ⚠️ Cannot be negative
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {hasInvalidScore && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm font-semibold text-red-700">
                ⚠️ Error: One or more student marks exceed the maximum exam limit of {selectedExam.maxMarks}. You must correct them before saving.
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                onClick={handleSaveAndPublish}
                disabled={isSubmitting || hasInvalidScore}
              >
                {isSubmitting ? 'Saving & Publishing…' : '🚀 Save & Publish Marks (Instant for Parents)'}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSaveAll}
                disabled={isSubmitting || hasInvalidScore}
              >
                {isSubmitting ? 'Saving…' : 'Save as Draft'}
              </Button>
              <Button variant="accent" onClick={handlePublish} disabled={isPublishing}>
                {isPublishing ? 'Publishing…' : `Publish All "${selectedExam.name}" Marks`}
              </Button>
              {message && <span className="text-sm font-medium text-ink-700">{message}</span>}
            </div>
          </>
        )}
      </Card>

      {classId && subjectId && (
        <Card title="Class analytics (overview & student performance)">
          <ClassAnalytics classId={classId} subjectId={subjectId} refetchKey={message} />
        </Card>
      )}

      {classId && (
        <Card title="Recent entries for this class">
          <StudentMarksHistory classId={classId} students={classStudents} subjectNameFor={subjectNameFor} refetchKey={message} />
        </Card>
      )}
    </div>
  )
}

// Class-level averages/highest/lowest/pass% and a "needs attention" list,
// computed server-side from published marks only.
function ClassAnalytics({ classId, subjectId, refetchKey }) {
  const { data: stats, isLoading, error, refetch } = useFetch(
    () => performanceService.getForClass(classId, subjectId),
    [classId, subjectId, refetchKey]
  )

  useEffect(() => {
    if (classId && subjectId) {
      refetch()
    }
  }, [refetchKey])

  if (isLoading) return <p className="text-sm text-ink-600">Loading class analytics…</p>
  if (error) return <p className="text-sm text-danger-600">Couldn't load class analytics.</p>
  if (!stats || stats.studentCount === 0) {
    return (
      <EmptyState
        title="No marks recorded yet for this class & subject"
        description="Class Analytics automatically calculates the class average, highest/lowest scores, pass percentage, and highlights students needing attention once marks are saved above."
      />
    )
  }

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Class average" value={`${stats.averagePercent}%`} />
        <Stat label="Highest" value={`${stats.highestPercent}%`} />
        <Stat label="Lowest" value={`${stats.lowestPercent}%`} />
        <Stat label="Pass rate" value={`${stats.passPercentage}%`} />
      </div>
      {stats.studentsNeedingAttention.length > 0 && (
        <div>
          <h4 className="mb-2 font-display text-base text-navy-900">Students needing attention</h4>
          <ul className="space-y-1 text-sm">
            {stats.studentsNeedingAttention.map((s) => (
              <li key={s.studentId} className="flex justify-between rounded-md border border-paper-200 px-3 py-1.5">
                <span className="text-ink-900">{s.studentName}</span>
                <span className="text-danger-600">{s.averagePercent}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-paper-200 p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="font-display text-xl text-navy-900">{value}</p>
    </div>
  )
}

// Small helper: lets the teacher pick one student to review their full mark
// history (including status), without cluttering the bulk-entry flow above.
function StudentMarksHistory({ classId, students, subjectNameFor, refetchKey }) {
  const [studentId, setStudentId] = useState('')

  const { data: studentMarks, isLoading, refetch } = useFetch(
    () => (studentId ? markService.findByStudent(studentId) : Promise.resolve({ data: [] })),
    [studentId, refetchKey]
  )

  useEffect(() => {
    if (studentId) {
      refetch()
    }
  }, [refetchKey])

  const columns = [
    { key: 'subject', header: 'Subject', render: (row) => subjectNameFor(row.subjectId) },
    { key: 'term', header: 'Exam' },
    { key: 'score', header: 'Score', render: (row) => `${row.marksObtained} / ${row.maxMarks}` },
    { key: 'date', header: 'Date' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'PUBLISHED' ? 'success' : 'warning'}>
          {row.status === 'PUBLISHED' ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Visibility',
      render: (row) =>
        row.status !== 'PUBLISHED' ? (
          <button
            type="button"
            className="rounded bg-navy-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-navy-900 transition cursor-pointer"
            onClick={async () => {
              try {
                await markService.publish(row.id)
                refetch()
              } catch {
                alert('Failed to publish mark')
              }
            }}
          >
            Publish Now
          </button>
        ) : (
          <span className="text-xs font-medium text-green-700">✓ Visible to Parent</span>
        ),
    },
  ]

  return (
    <div>
      <FormField label="Student">
        <select className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId}>
          <option value="">Select a student…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber ? `Roll #${s.rollNumber}` : 'No Roll#'})</option>)}
        </select>
      </FormField>
      {studentId && (
        isLoading ? (
          <p className="py-6 text-center text-xs text-slate-500">Loading student records…</p>
        ) : (
          <Table columns={columns} rows={studentMarks || []} emptyLabel="No marks recorded yet for this student." />
        )
      )}
    </div>
  )
}