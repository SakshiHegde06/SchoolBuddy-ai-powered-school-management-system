import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { parentService } from '../../services/parentService'
import { studentService } from '../../services/studentService'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { name: '', email: '', password: '', phone: '', address: '', childrenIds: [] }

export default function ParentsPage() {
  const { data: parents, isLoading, error, refetch } = useFetch(() => parentService.list(), [])
  const { data: students } = useFetch(() => studentService.list(), [])
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

  function openEdit(parent) {
    setEditingId(parent.id)
    setForm({
      name: parent.name || '',
      email: parent.email || '',
      password: '',
      phone: parent.phone || '',
      address: parent.address || '',
      childrenIds: parent.childrenIds || [],
    })
    setSubmitError('')
    setModalOpen(true)
  }

  function toggleChild(studentId) {
    setForm((prev) => {
      const already = prev.childrenIds.includes(studentId)
      return {
        ...prev,
        childrenIds: already
          ? prev.childrenIds.filter((id) => id !== studentId)
          : [...prev.childrenIds, studentId],
      }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    try {
      if (editingId) {
        await parentService.update(editingId, form)
      } else {
        await parentService.create(form)
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
    if (!confirm('Remove this parent? This also deletes their login account.')) return
    await parentService.remove(id)
    refetch()
  }

  const childNamesFor = (ids) =>
    (ids || []).map((id) => students?.find((s) => s.id === id)?.name).filter(Boolean).join(', ') || '—'

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'children', header: 'Children', render: (row) => childNamesFor(row.childrenIds) },
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
      title="Parents"
      action={<Button variant="accent" onClick={openCreate}>Add parent</Button>}
    >
      {isLoading && <Spinner label="Loading parents…" />}
      {error && <p className="text-sm text-danger-600">Couldn't load parents.</p>}
      {!isLoading && !error && (
        parents && parents.length > 0 ? (
          <Table columns={columns} rows={parents} />
        ) : (
          <EmptyState title="No parents yet" description="Add your first parent to get started." />
        )
      )}

      <Modal
        title={editingId ? 'Edit parent' : 'Add parent'}
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
          <FormField label="Children">
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-paper-200 p-2">
              {students && students.length > 0 ? (
                students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-ink-900">
                    <input
                      type="checkbox"
                      checked={form.childrenIds.includes(s.id)}
                      onChange={() => toggleChild(s.id)}
                    />
                    {s.name}
                  </label>
                ))
              ) : (
                <p className="text-xs text-ink-400">No students exist yet — add a student first.</p>
              )}
            </div>
          </FormField>
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      </Modal>
    </Card>
  )
}