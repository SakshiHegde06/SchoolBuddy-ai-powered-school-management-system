import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { examService } from '../../services/examService'
import { useFetch } from '../../hooks/useFetch'

const TYPES = ['EXAM', 'QUIZ', 'ASSIGNMENT']

const emptyForm = {
  name: '',
  subjectId: '',
  type: 'EXAM',
  maxMarks: '',
  startDate: '',
  endDate: '',
  academicYearId: '2026-2027',
}

export default function ExamsPage() {
  const { data: classes, isLoading: classesLoading } = useFetch(() => classService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])

  const [classId, setClassId] = useState('')

  const {
    data: exams,
    isLoading: examsLoading,
    error: examsError,
    refetch,
  } = useFetch(() => (classId ? examService.listByClass(classId) : Promise.resolve({ data: [] })), [classId])

  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setSubmitError('')
    setModalOpen(true)
  }

  function openEdit(exam) {
    setEditingId(exam.id)
    setForm({
      name: exam.name || '',
      subjectId: exam.subjectId || '',
      type: exam.type || 'EXAM',
      maxMarks: exam.maxMarks ?? '',
      startDate: exam.startDate || '',
      endDate: exam.endDate || '',
      academicYearId: exam.academicYearId || '2026-2027',
    })
    setSubmitError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        ...form,
        classId,
        subjectId: form.subjectId || null,
        maxMarks: Number(form.maxMarks) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      }
      if (editingId) {
        await examService.update(editingId, payload)
      } else {
        await examService.create(payload)
      }
      setModalOpen(false)
      refetch()
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Something went wrong. Please check the details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this exam?')) return
    await examService.remove(id)
    refetch()
  }

  const subjectNameFor = (id) => (id ? subjects?.find((s) => s.id === id)?.name : 'All subjects')

  const columns = [
    { key: 'name', header: 'Exam' },
    { key: 'subjectId', header: 'Subject', render: (row) => subjectNameFor(row.subjectId) || 'All subjects' },
    { key: 'type', header: 'Type' },
    { key: 'maxMarks', header: 'Max marks' },
    { key: 'startDate', header: 'Start' },
    { key: 'endDate', header: 'End' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" className="px-2 py-1" onClick={() => openEdit(row)}>Edit</Button>
          <Button variant="ghost" className="px-2 py-1 text-danger-600" onClick={() => handleDelete(row.id)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <Card
      title="Exams"
      action={<Button variant="accent" onClick={openCreate} disabled={!classId}>Add exam</Button>}
    >
      <FormField label="Class">
        {classesLoading ? (
          <Spinner label="Loading classes…" />
        ) : (
          <select className={inputClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select a class…</option>
            {(classes || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
        )}
      </FormField>

      {!classId && (
        <EmptyState title="Pick a class" description="Select a class above to see and manage its exams (FA1, Mid-Term, Final, etc)." />
      )}

      {classId && examsLoading && <Spinner label="Loading exams…" />}
      {classId && examsError && <p className="text-sm text-danger-600">Couldn't load exams.</p>}
      {classId && !examsLoading && !examsError && (
        exams && exams.length > 0 ? (
          <Table columns={columns} rows={exams} />
        ) : (
          <EmptyState title="No exams yet" description="Add an exam so teachers can pick it from a list instead of retyping the name and max marks each time." />
        )
      )}

      <Modal
        title={editingId ? 'Edit exam' : 'Add exam'}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Exam name">
            <input required className={inputClass} placeholder="e.g. FA1, Mid-Term, Final Exam"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Subject (leave blank to apply to every subject)">
            <select className={inputClass} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              <option value="">All subjects</option>
              {(subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Max marks">
            <input required type="number" min="0" className={inputClass}
              value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} />
          </FormField>
          <FormField label="Start date">
            <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </FormField>
          <FormField label="End date">
            <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </FormField>
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      </Modal>
    </Card>
  )
}