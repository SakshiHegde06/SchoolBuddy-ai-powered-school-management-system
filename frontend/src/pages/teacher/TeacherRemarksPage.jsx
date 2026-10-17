import { useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { subjectService } from '../../services/subjectService'
import { remarkService } from '../../services/remarkService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

const EXAM_TYPES = ['FA1', 'FA2', 'SA1', 'Mid-Term', 'Final', 'General Assessment']

export default function TeacherRemarksPage() {
  const { user } = useAuth()
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: allStudents } = useFetch(() => studentService.list(), [])
  const { data: allSubjects } = useFetch(() => subjectService.list(), [])
  const { data: assignments } = useFetch(
    () => user?.refId ? teacherAssignmentService.listByTeacher(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [examType, setExamType] = useState('General Assessment')
  const [studentId, setStudentId] = useState('')
  const [remark, setRemark] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    ? (allSubjects || [])
    : (assignedSubjectIdsForClass.length > 0
        ? (allSubjects || []).filter((s) => assignedSubjectIdsForClass.includes(s.id))
        : (allSubjects || []))

  const classStudents = (allStudents || []).filter((s) => s.classId === classId)

  async function saveRemark(e) {
    e?.preventDefault()
    if (!classId || !subjectId || !studentId || !remark.trim()) {
      setMessage('Please select a class, subject, student, and write a remark.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      await remarkService.create({
        studentId,
        classId,
        subjectId,
        examType: examType || 'General Assessment',
        remark: remark.trim(),
      })

      setRemark('')
      setMessage('Remark saved successfully.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save remark.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card title="Student Remarks">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Class">
          <select
            className={inputClass}
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setSubjectId('')
              setStudentId('')
            }}
          >
            <option value="">Select Class…</option>
            {visibleClasses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Subject">
          <select
            className={inputClass}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!classId}
          >
            <option value="">Select Subject…</option>
            {visibleSubjects?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Exam / Assessment">
          <select
            className={inputClass}
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            {EXAM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Student">
          <select
            className={inputClass}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={!classId}
          >
            <option value="">Select Student…</option>
            {classStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.rollNumber ? `(${s.rollNumber})` : ''}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="Teacher Remark">
        <textarea
          rows={4}
          placeholder="Write constructive academic or behavioural feedback for the student and parents..."
          className={inputClass}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </FormField>

      <div className="mt-4 flex items-center gap-4">
        <Button
          variant="primary"
          onClick={saveRemark}
          disabled={isSubmitting || !classId || !subjectId || !studentId || !remark.trim()}
        >
          {isSubmitting ? 'Saving…' : 'Save Remark'}
        </Button>
        {message && (
          <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </Card>
  )
}