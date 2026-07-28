import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { subjectService } from '../../services/subjectService'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { name: '', code: '', practical: false, weeklyFrequency: '' }

export default function SubjectsPage() {
  const { data: subjects, isLoading, error, refetch } = useFetch(() => subjectService.list(), [])
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

  function openEdit(subject) {
    setEditingId(subject.id)
    setForm({
      name: subject.name || '',
      code: subject.code || '',
      practical: !!subject.practical,
      weeklyFrequency: subject.weeklyFrequency ?? '',
    })
    setSubmitError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const payload = { ...form, weeklyFrequency: Number(form.weeklyFrequency) || 0 }
      if (editingId) {
        await subjectService.update(editingId, payload)
      } else {
        await subjectService.create(payload)
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
    if (!confirm('Remove this subject?')) return
    await subjectService.remove(id)
    refetch()
  }

  const columns = [
    { key: 'name', header: 'Subject' },
    { key: 'code', header: 'Code' },
    { key: 'practical', header: 'Practical?', render: (row) => (row.practical ? 'Yes' : 'No') },
    { key: 'weeklyFrequency', header: 'Periods/week' },
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
      title="Subjects"
      action={<Button variant="accent" onClick={openCreate}>Add subject</Button>}
    >
      {isLoading && <Spinner label="Loading subjects…" />}
      {error && <p className="text-sm text-danger-600">Couldn't load subjects.</p>}
      {!isLoading && !error && (
        subjects && subjects.length > 0 ? (
          <Table columns={columns} rows={subjects} />
        ) : (
          <EmptyState title="No subjects yet" description="Add your first subject to get started." />
        )
      )}

      <Modal
        title={editingId ? 'Edit subject' : 'Add subject'}
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
          <FormField label="Subject name">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="Code">
            <input required className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </FormField>
          <FormField label="Periods per week">
            <input type="number" min="0" className={inputClass} value={form.weeklyFrequency} onChange={(e) => setForm({ ...form, weeklyFrequency: e.target.value })} />
          </FormField>
          <label className="mb-4 flex items-center gap-2 text-sm text-ink-900">
            <input type="checkbox" checked={form.practical} onChange={(e) => setForm({ ...form, practical: e.target.checked })} />
            Practical subject (needs a lab room)
          </label>
          {submitError && <p className="text-sm text-danger-600">{submitError}</p>}
        </form>
      </Modal>
    </Card>
  )
}