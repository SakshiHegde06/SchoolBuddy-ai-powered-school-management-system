import { useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { subjectService } from '../../services/subjectService'
import { markService } from '../../services/markService'
import { teacherService } from '../../services/teacherService'
import { useFetch } from '../../hooks/useFetch'

const TYPES = ['EXAM', 'QUIZ', 'ASSIGNMENT']
const todayIso = new Date().toISOString().slice(0, 10)
const emptyForm = { subjectId: '', academicYearId: '2026-2027', term: '', type: 'QUIZ', marksObtained: '', maxMarks: '', date: todayIso }

export default function MarksPage() {
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: allStudents } = useFetch(() => studentService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: allTeachers } = useFetch(() => teacherService.list(), [])

  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const {
    data: studentMarks,
    refetch: refetchMarks,
  } = useFetch(() => (studentId ? markService.findByStudent(studentId) : Promise.resolve({ data: [] })), [studentId])

  const classStudents = (allStudents || []).filter((s) => s.classId === classId)

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      await markService.create({
        studentId,
        ...form,
        marksObtained: Number(form.marksObtained),
        maxMarks: Number(form.maxMarks),
      })
      setMessage('Mark entry saved.')
      setForm({ ...emptyForm })
      refetchMarks()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save mark entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const teacherNameFor = (id) => allTeachers?.find((t) => t.id === id)?.name || '—'
  const subjectNameFor = (id) => subjects?.find((s) => s.id === id)?.name || '—'

  const markColumns = [
    { key: 'subject', header: 'Subject', render: (row) => subjectNameFor(row.subjectId) },
    { key: 'term', header: 'Term' },
    { key: 'type', header: 'Type' },
    { key: 'score', header: 'Score', render: (row) => `${row.marksObtained} / ${row.maxMarks}` },
    { key: 'date', header: 'Date' },
    { key: 'enteredBy', header: 'Entered by', render: (row) => teacherNameFor(row.enteredBy) },
  ]

  return (
    <Card title="Upload marks">
      <div className="mb-6 flex flex-wrap gap-4">
        <FormField label="Class">
          <select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId('') }}>
            <option value="">Select a class…</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Student">
          <select className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={!classId}>
            <option value="">Select a student…</option>
            {classStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </FormField>
      </div>

      {studentId && (
        <>
          <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Subject">
              <select required className={inputClass} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">Select…</option>
                {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
            <FormField label="Term">
              <input required className={inputClass} placeholder="e.g. Term 1" value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} />
            </FormField>
            <FormField label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Marks obtained">
              <input required type="number" min="0" className={inputClass} value={form.marksObtained} onChange={(e) => setForm({ ...form, marksObtained: e.target.value })} />
            </FormField>
            <FormField label="Max marks">
              <input required type="number" min="0" className={inputClass} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
            </FormField>
            <FormField label="Date">
              <input required type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </FormField>
            <div className="sm:col-span-3">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save mark entry'}
              </Button>
              {message && <span className="ml-3 text-sm text-ink-600">{message}</span>}
            </div>
          </form>

          <h4 className="mb-2 font-display text-base text-navy-900">Marks history for this student</h4>
          <Table columns={markColumns} rows={studentMarks} emptyLabel="No marks recorded yet." />
        </>
      )}
    </Card>
  )
}