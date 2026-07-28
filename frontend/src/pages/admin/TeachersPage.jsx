import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { teacherService } from '../../services/teacherService'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { name: '', email: '', password: '', phone: '', address: '', maxWeeklyHours: '' }

export default function TeachersPage() {
  const { data: teachers, isLoading, error, refetch } = useFetch(() => teacherService.list(), [])
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

  function openEdit(teacher) {
    setEditingId(teacher.id)
    setForm({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      maxWeeklyHours: teacher.maxWeeklyHours ?? '',
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
        maxWeeklyHours: form.maxWeeklyHours === '' ? null : Number(form.maxWeeklyHours),
      }
      if (editingId) {
        await teacherService.update(editingId, payload)
      } else {
        await teacherService.create(payload)
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
    if (!confirm('Remove this teacher? This also deletes their login account.')) return
    await teacherService.remove(id)
    refetch()
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'maxWeeklyHours', header: 'Max hrs/wk' },
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
      title="Teachers"
      action={<Button variant="accent" onClick={openCreate}>Add teacher</Button>}
    >
      {isLoading && <Spinner label="Loading teachers…" />}
      {error && <p className="text-sm text-danger-600">Couldn't load teachers.</p>}
      {!isLoading && !error && (
        teachers && teachers.length > 0 ? (
          <Table columns={columns} rows={teachers} />
        ) : (
          <EmptyState title="No teachers yet" description="Add your first teacher to get started." />
        )
      )}

      <Modal
        title={editingId ? 'Edit teacher' : 'Add teacher'}
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
          <FormField label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Address">
            <input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          <FormField label="Max weekly teaching hours">
            <input type="number" min="0" className={inputClass} value={form.maxWeeklyHours} onChange={(e) => setForm({ ...form, maxWeeklyHours: e.target.value })} />
          </FormField>
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      </Modal>
    </Card>
  )
}