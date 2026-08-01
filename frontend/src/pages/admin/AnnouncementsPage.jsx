import { useState } from 'react'
import { Megaphone, Pencil, Trash2, Plus, X } from 'lucide-react'

import Card from '../../components/common/Card'
import Spinner from '../../components/common/Spinner'
import { useFetch } from '../../hooks/useFetch'
import { announcementService } from '../../services/announcementService'

const EMPTY_FORM = { title: '', message: '', priority: 'MEDIUM' }

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AnnouncementsPage() {
  const { data: announcements, isLoading, error, refetch } = useFetch(
    () => announcementService.list(),
    []
  )

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  const startEdit = (announcement) => {
    setEditingId(announcement.id)
    setForm({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority || 'MEDIUM',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      setFormError('Title and message are required.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    try {
      if (editingId) {
        await announcementService.update(editingId, form)
      } else {
        await announcementService.create(form)
      }
      cancelEdit()
      refetch()
    } catch (err) {
      setFormError(
        err?.response?.data?.message || 'Could not save the announcement. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return
    try {
      await announcementService.remove(id)
      refetch()
    } catch {
      window.alert('Could not delete the announcement. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Announcements</h1>
        <p className="mt-1 text-sm text-slate-500">
          Post updates for the whole school. Anything you publish or edit here
          shows up immediately on the teacher, student and parent dashboards.
        </p>
      </div>

      <Card title={editingId ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Republic Day holiday notice"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Details for staff, students and parents..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-48"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <Plus size={16} />
              {editingId ? 'Save Changes' : 'Post Announcement'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card title="All Announcements">
        {isLoading && <Spinner label="Loading announcements..." />}

        {error && (
          <p className="text-sm text-red-600">Unable to load announcements.</p>
        )}

        {announcements && announcements.length === 0 && (
          <p className="text-sm text-slate-500">No announcements yet. Post the first one above.</p>
        )}

        {announcements && announcements.length > 0 && (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Megaphone size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900">{a.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{a.message}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {a.updatedAt && a.updatedAt !== a.createdAt
                        ? `Updated ${formatDate(a.updatedAt)}`
                        : `Posted ${formatDate(a.createdAt)}`}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600"
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}