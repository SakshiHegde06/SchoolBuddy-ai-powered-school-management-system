import { useState } from 'react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import { academicYearService } from '../../services/academicYearService'
import { classService } from '../../services/classService'
import api from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

// classService doesn't have a promote method (it's a class-instance action,
// not a CRUD verb), so we call the endpoint directly.
function promoteRequest(fromClassId, toClassId) {
  return api.post(`/classes/${fromClassId}/promote`, { toClassId })
}

const emptyForm = { label: '', startDate: '', endDate: '', isCurrent: false }

export default function AcademicYearsPage() {
  const { data: years, isLoading, error, refetch } = useFetch(() => academicYearService.list(), [])
  const { data: classes, refetch: refetchClasses } = useFetch(() => classService.list(), [])

  const [isModalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Promotion tool state
  const [fromClassId, setFromClassId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [isPromoting, setIsPromoting] = useState(false)
  const [promoteMessage, setPromoteMessage] = useState('')

  function openCreate() {
    setForm(emptyForm)
    setSubmitError('')
    setModalOpen(true)
  }

  const currentYear = new Date().getFullYear()
  const minYear = 2000
  const maxYear = currentYear + 5

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    const label = form.label?.trim() || ''
    if (!label) {
      setSubmitError('Academic year label is required.')
      return
    }

    // Check year ranges in label (prevent absurd years like 2990)
    const yearMatches = label.match(/\b(\d{4})\b/g)
    if (yearMatches) {
      for (const yStr of yearMatches) {
        const y = parseInt(yStr, 10)
        if (y < minYear || y > maxYear + 1) {
          setSubmitError(
            `Academic year ${y} is out of realistic range (${minYear} to ${maxYear}). Current year is ${currentYear}. Please enter a valid academic year (e.g. ${currentYear}-${currentYear + 1}).`
          )
          return
        }
      }
    }

    if (/^\d+$/.test(label)) {
      const y = parseInt(label, 10)
      if (y < minYear || y > maxYear) {
        setSubmitError(`Academic year ${y} is out of realistic range (${minYear} to ${maxYear}).`)
        return
      }
    }

    // Check start and end dates
    if (form.startDate && form.endDate) {
      if (form.startDate >= form.endDate) {
        setSubmitError('Start date must be before end date.')
        return
      }
      const startY = new Date(form.startDate).getFullYear()
      const endY = new Date(form.endDate).getFullYear()
      if (startY < minYear || startY > maxYear) {
        setSubmitError(`Start date year must be between ${minYear} and ${maxYear}.`)
        return
      }
      if (endY < minYear || endY > maxYear + 1) {
        setSubmitError(`End date year must be between ${minYear} and ${maxYear + 1}.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await academicYearService.create(form)
      setModalOpen(false)
      refetch()
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not save this academic year.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSetCurrent(id) {
    await academicYearService.setCurrent(id)
    refetch()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this academic year?')) return
    await academicYearService.remove(id)
    refetch()
  }

  async function handlePromote() {
    if (!fromClassId || !toClassId || fromClassId === toClassId) return
    if (!confirm('Move every student in the "from" class into the "to" class? Their past marks/attendance stay linked to the old class.')) return
    setIsPromoting(true)
    setPromoteMessage('')
    try {
      const response = await promoteRequest(fromClassId, toClassId)
      setPromoteMessage(`Promoted ${response.data.promotedCount} student(s).`)
      refetchClasses()
    } catch (err) {
      setPromoteMessage(err.response?.data?.message || 'Promotion failed.')
    } finally {
      setIsPromoting(false)
    }
  }

  const columns = [
    { key: 'label', header: 'Academic year' },
    { key: 'startDate', header: 'Start' },
    { key: 'endDate', header: 'End' },
    {
      key: 'isCurrent',
      header: 'Status',
      render: (row) => row.isCurrent
        ? <Badge tone="success">Current</Badge>
        : <Button variant="ghost" className="px-2 py-1" onClick={() => handleSetCurrent(row.id)}>Make current</Button>,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="ghost" className="px-2 py-1 text-danger-600" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card title="Academic years" action={<Button variant="accent" onClick={openCreate}>+ Add year</Button>}>
        {isLoading && <Spinner label="Loading academic years…" />}
        {error && <p className="text-sm text-danger-600">Couldn't load academic years.</p>}
        {!isLoading && !error && (
          years && years.length > 0 ? (
            <Table columns={columns} rows={years} />
          ) : (
            <EmptyState title="No academic years yet" description="Add one (e.g. 2026-2027) and mark it current so new classes default to it." />
          )
        )}
      </Card>

      <Card title="Promote a class">
        <p className="mb-4 text-sm text-ink-600">
          Move every student from one class to another at year-end (e.g. 8A → 9A). Marks, attendance and remarks stay linked to their original class.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <FormField label="From class">
            <select className={inputClass} value={fromClassId} onChange={(e) => setFromClassId(e.target.value)}>
              <option value="">Select…</option>
              {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </FormField>
          <FormField label="To class">
            <select className={inputClass} value={toClassId} onChange={(e) => setToClassId(e.target.value)}>
              <option value="">Select…</option>
              {(classes || []).map((c) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select>
          </FormField>
          <Button variant="primary" onClick={handlePromote} disabled={isPromoting || !fromClassId || !toClassId}>
            {isPromoting ? 'Promoting…' : 'Promote students'}
          </Button>
        </div>
        {promoteMessage && <p className="mt-3 text-sm text-ink-600">{promoteMessage}</p>}
      </Card>

      <Modal
        title="Add academic year"
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
          <FormField label="Label">
            <input
              required
              className={inputClass}
              placeholder={`e.g. ${currentYear}-${currentYear + 1}`}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
            <p className="mt-1 text-xs text-slate-500">
              Allowed range: {minYear} to {maxYear} (e.g. {currentYear}-{currentYear + 1})
            </p>
          </FormField>
          <FormField label="Start date">
            <input
              type="date"
              className={inputClass}
              min={`${minYear}-01-01`}
              max={`${maxYear}-12-31`}
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </FormField>
          <FormField label="End date">
            <input
              type="date"
              className={inputClass}
              min={`${minYear}-01-01`}
              max={`${maxYear + 1}-12-31`}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </FormField>
          <label className="mb-4 flex items-center gap-2 text-sm text-ink-900">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} />
            Make this the current academic year
          </label>
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
              {submitError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}