import { useState } from 'react'
import { Pencil, Trash2, Plus, X } from 'lucide-react'

import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import FormField, { inputClass } from '../../components/common/FormField'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import Table from '../../components/common/Table'
import { useFetch } from '../../hooks/useFetch'
import { holidayService } from '../../services/holidayService'

const initialForm = { title: '', description: '', date: '', recurring: false }

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function HolidaysPage() {
  const { data: holidays, isLoading, error, refetch } = useFetch(() => holidayService.list(), [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [submitError, setSubmitError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openCreate = () => {
    setEditingId(null)
    setForm(initialForm)
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const openEdit = (holiday) => {
    setEditingId(holiday.id)
    setForm({
      title: holiday.title || '',
      description: holiday.description || '',
      date: holiday.date || '',
      recurring: holiday.recurring || false,
    })
    setSubmitError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setForm(initialForm)
    setSubmitError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) {
      setSubmitError('Title and date are required.')
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      if (editingId) {
        await holidayService.update(editingId, form)
      } else {
        await holidayService.create(form)
      }
      closeModal()
      refetch()
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Could not save the holiday. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return
    try {
      await holidayService.remove(id)
      refetch()
    } catch {
      window.alert('Could not delete the holiday. Please try again.')
    }
  }

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'description', header: 'Description' },
    { key: 'recurring', header: 'Repeats', render: (row) => (row.recurring ? 'Yes' : 'No') },
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Holidays</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage school holidays and recurring days off. These appear on the calendar pages for students, parents and teachers.
        </p>
      </div>

      <Card title="Holiday calendar" action={<Button variant="accent" onClick={openCreate}><Plus size={16} /> Add holiday</Button>}>
        {isLoading && <Spinner label="Loading holidays…" />}
        {error && <p className="text-sm text-red-600">Unable to load holiday data.</p>}
        {!isLoading && !error && (
          holidays && holidays.length > 0 ? (
            <Table columns={columns} rows={holidays} />
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No holidays yet. Add one to populate the school calendar.</p>
          )
        )}
      </Card>

      <Modal
        title={editingId ? 'Edit holiday' : 'Add holiday'}
        isOpen={isModalOpen}
        onClose={closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save holiday'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </FormField>

          <FormField label="Date">
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className={`${inputClass} min-h-[100px] resize-none`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
            />
            Repeat annually
          </label>

          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        </form>
      </Modal>
    </div>
  )
}
