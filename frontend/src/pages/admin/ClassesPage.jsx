import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { classService } from '../../services/classService'
import { teacherService } from '../../services/teacherService'
import { subjectService } from '../../services/subjectService'
import { academicYearService } from '../../services/academicYearService'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { name: '', section: '', classTeacherId: '', academicYearId: '', subjectIds: [] }

export default function ClassesPage() {
  const { data: classes, isLoading, error, refetch } = useFetch(() => classService.list(), [])
  const { data: teachers } = useFetch(() => teacherService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: academicYears } = useFetch(() => academicYearService.list(), [])
  const [isModalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openCreate() {
    setEditingId(null)
    const currentYear = academicYears?.find((y) => y.isCurrent)
    setForm({ ...emptyForm, academicYearId: currentYear?.id || '' })
    setSubmitError('')
    setModalOpen(true)
  }

  function openEdit(schoolClass) {
    setEditingId(schoolClass.id)
    setForm({
      name: schoolClass.name || '',
      section: schoolClass.section || '',
      classTeacherId: schoolClass.classTeacherId || '',
      academicYearId: schoolClass.academicYearId || '',
      subjectIds: schoolClass.subjectIds || [],
    })
    setSubmitError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    try {
      if (editingId) {
        await classService.update(editingId, form)
      } else {
        await classService.create(form)
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
    if (!confirm('Remove this class?')) return
    await classService.remove(id)
    refetch()
  }

  const teacherNameFor = (id) => teachers?.find((t) => t.id === id)?.name || '—'

  const columns = [
    { key: 'name', header: 'Class' },
    { key: 'section', header: 'Section' },
    { key: 'classTeacher', header: 'Class teacher', render: (row) => teacherNameFor(row.classTeacherId) },
    { key: 'studentCount', header: 'Students' },
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
      title="Classes"
      action={<Button variant="accent" onClick={openCreate}>Add class</Button>}
    >
      {isLoading && <Spinner label="Loading classes…" />}
      {error && <p className="text-sm text-danger-600">Couldn't load classes.</p>}
      {!isLoading && !error && (
        classes && classes.length > 0 ? (
          <Table columns={columns} rows={classes} />
        ) : (
          <EmptyState title="No classes yet" description="Add your first class to get started." />
        )
      )}

      <Modal
        title={editingId ? 'Edit class' : 'Add class'}
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
          <FormField label="Class name (e.g. Grade 8)">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Section (e.g. A)">
            <input className={inputClass} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
          </FormField>
          <FormField label="Class teacher">
            <select className={inputClass} value={form.classTeacherId} onChange={(e) => setForm({ ...form, classTeacherId: e.target.value })}>
              <option value="">None assigned</option>
              {teachers?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Class subjects">
            <select
              multiple
              className={inputClass}
              value={form.subjectIds}
              onChange={(e) => setForm({
                ...form,
                subjectIds: Array.from(e.target.selectedOptions, (opt) => opt.value),
              })}
              size={Math.min(6, subjects?.length || 6)}
            >
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Academic year">
            <select
              className={inputClass}
              value={form.academicYearId}
              onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}
            >
              <option value="">Select an academic year…</option>
              {(academicYears || []).map((y) => (
                <option key={y.id} value={y.id}>{y.label}{y.isCurrent ? ' (current)' : ''}</option>
              ))}
            </select>
            {(!academicYears || academicYears.length === 0) && (
              <p className="mt-1 text-xs text-ink-400">No academic years yet — add one on the Academic Years page.</p>
            )}
          </FormField>
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      </Modal>
    </Card>
  )
}