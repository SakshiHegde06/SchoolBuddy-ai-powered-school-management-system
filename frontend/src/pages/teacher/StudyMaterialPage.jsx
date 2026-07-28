import { useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { studyMaterialService } from '../../services/studyMaterialService'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { subjectId: '', title: '', type: 'PDF', externalUrl: '' }

export default function StudyMaterialsPage() {
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])

  const [classId, setClassId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const {
    data: classMaterials,
    refetch: refetchMaterials,
  } = useFetch(
    () => (classId ? studyMaterialService.findByClass(classId) : Promise.resolve({ data: [] })),
    [classId]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('classId', classId)
      formData.append('subjectId', form.subjectId)
      formData.append('title', form.title)
      formData.append('type', form.type)
      if (form.type === 'PDF') {
        if (!file) {
          setMessage('Choose a PDF file first.')
          setIsSubmitting(false)
          return
        }
        formData.append('file', file)
      } else {
        formData.append('externalUrl', form.externalUrl)
      }

      await studyMaterialService.create(formData)
      setMessage('Study material posted.')
      setForm({ ...emptyForm, subjectId: form.subjectId })
      setFile(null)
      e.target.reset()
      refetchMaterials()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to post study material.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    await studyMaterialService.remove(id)
    refetchMaterials()
  }

  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'type',
      header: 'Type',
      render: (row) => <Badge tone={row.type === 'PDF' ? 'neutral' : 'success'}>{row.type}</Badge>,
    },
    {
      key: 'uploadedAt',
      header: 'Posted',
      render: (row) => new Date(row.uploadedAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button variant="ghost" onClick={() => handleDelete(row.id)}>
          Delete
        </Button>
      ),
    },
  ]

  return (
    <Card title="Study materials">
      <FormField label="Class">
        <select className={inputClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select a class…</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>{c.name} {c.section}</option>
          ))}
        </select>
      </FormField>

      {classId && (
        <>
          <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Subject">
              <select required className={inputClass} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                <option value="">Select…</option>
                {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>

            <FormField label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="PDF">PDF upload</option>
                <option value="LINK">Link</option>
              </select>
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Title">
                <input required className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </FormField>
            </div>

            {form.type === 'PDF' ? (
              <div className="sm:col-span-2">
                <FormField label="PDF file">
                  <input
                    required
                    type="file"
                    accept="application/pdf"
                    className={inputClass}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </FormField>
              </div>
            ) : (
              <div className="sm:col-span-2">
                <FormField label="Link URL">
                  <input
                    required
                    type="url"
                    placeholder="https://…"
                    className={inputClass}
                    value={form.externalUrl}
                    onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                  />
                </FormField>
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Posting…' : 'Post material'}
              </Button>
              {message && <span className="ml-3 text-sm text-ink-600">{message}</span>}
            </div>
          </form>

          <h4 className="mb-2 font-display text-base text-navy-900">Materials for this class</h4>
          <Table columns={columns} rows={classMaterials} emptyLabel="No study materials posted yet." />
        </>
      )}
    </Card>
  )
}