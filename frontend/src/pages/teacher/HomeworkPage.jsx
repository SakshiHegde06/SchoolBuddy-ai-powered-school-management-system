import { useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { homeworkService } from '../../services/homeworkService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

const todayIso = new Date().toISOString().slice(0, 10)
const emptyForm = { subjectId: '', title: '', description: '', dueDate: todayIso }

export default function HomeworkPage() {
  const { user } = useAuth()
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: assignments } = useFetch(
    () => user?.refId ? teacherAssignmentService.listByTeacher(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const [classId, setClassId] = useState('')
  const [form, setForm] = useState(emptyForm)
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
    ? (subjects || [])
    : (assignedSubjectIdsForClass.length > 0
        ? (subjects || []).filter((s) => assignedSubjectIdsForClass.includes(s.id))
        : (subjects || []))

  const {
    data: classHomework,
    refetch: refetchHomework,
  } = useFetch(() => (classId ? homeworkService.findByClass(classId) : Promise.resolve({ data: [] })), [classId])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      await homeworkService.create({ classId, ...form })
      setMessage('Homework posted.')
      setForm({ ...emptyForm, subjectId: form.subjectId })
      refetchHomework()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to post homework.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'dueDate', header: 'Due' },
  ]

  return (
    <Card title="Homework">
      <FormField label="Class">
        <select
          className={inputClass}
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value)
            setForm({ ...form, subjectId: '' })
          }}
        >
          <option value="">Select a class…</option>
          {visibleClasses?.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
          ))}
        </select>
      </FormField>

      {classId && (
        <>
          <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Subject">
              <select
                required
                className={inputClass}
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              >
                <option value="">Select…</option>
                {visibleSubjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Due date">
              <input required type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Title">
                <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Description">
                <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Posting…' : 'Post homework'}
              </Button>
              {message && <span className="ml-3 text-sm text-ink-600">{message}</span>}
            </div>
          </form>

          <h4 className="mb-2 font-display text-base text-navy-900">Homework for this class</h4>
          <Table columns={columns} rows={classHomework} emptyLabel="No homework posted yet." />
        </>
      )}
    </Card>
  )
}