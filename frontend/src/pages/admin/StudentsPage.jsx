import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { studentService } from '../../services/studentService'
import { classService } from '../../services/classService'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = {
  name: '', email: '', password: '', classId: '', section: '',
  admissionNumber: '', rollNumber: '', dob: '',
}

export default function StudentsPage() {
  const { data: students, isLoading, error, refetch } = useFetch(() => studentService.list(), [])
  const { data: classes } = useFetch(() => classService.list(), [])
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

  function openEdit(student) {
    setEditingId(student.id)
    setForm({
      name: student.name || '',
      email: student.email || '',
      password: '',
      classId: student.classId || '',
      section: student.section || '',
      admissionNumber: student.admissionNumber || '',
      rollNumber: student.rollNumber || '',
      dob: student.dob || '',
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
        await studentService.update(editingId, form)
      } else {
        await studentService.create(form)
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
    if (!confirm('Remove this student? This also deletes their login account.')) return
    await studentService.remove(id)
    refetch()
  }

  const classNameFor = (id) => classes?.find((c) => c.id === id)?.name || '—'

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'class', header: 'Class', render: (row) => classNameFor(row.classId) },
    { key: 'rollNumber', header: 'Roll No.' },
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
      title="Students"
      action={<Button variant="accent" onClick={openCreate}>Add student</Button>}
    >
      {isLoading && <Spinner label="Loading students…" />}
      {error && <p className="text-sm text-danger-600">Couldn't load students.</p>}
      {!isLoading && !error && (
        students && students.length > 0 ? (
          <Table columns={columns} rows={students} />
        ) : (
          <EmptyState title="No students yet" description="Add your first student to get started." />
        )
      )}

      <Modal
        title={editingId ? 'Edit student' : 'Add student'}
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
          <FormField label="Name">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Email">
            <input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editingId} />
          </FormField>
          <FormField label={editingId ? 'New password (leave blank to keep current)' : 'Password'}>
            <input type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} />
          </FormField>
          <FormField label="Class">
            <select required className={inputClass} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <option value="">Select a class…</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Section">
            <input className={inputClass} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
          </FormField>
          <FormField label="Date of birth">
            <input type="date" className={inputClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </FormField>
          <FormField label="Admission number">
            <input className={inputClass} value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
          </FormField>
          <FormField label="Roll number">
            <input className={inputClass} value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
          </FormField>
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      </Modal>
    </Card>
  )
}