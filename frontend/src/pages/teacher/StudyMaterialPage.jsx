import { useState } from 'react'
import {
  Brain,
  Download,
  Eye,
  Trash2,
  FileText,
  Upload,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Table from '../../components/common/Table'
import Badge from '../../components/common/Badge'
import FormField, { inputClass } from '../../components/common/FormField'
import AiStudyTutorModal from '../../components/materials/AiStudyTutorModal'
import PdfViewerModal from '../../components/materials/PdfViewerModal'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { studyMaterialService } from '../../services/studyMaterialService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { subjectId: '', title: '', type: 'PDF', externalUrl: '' }

export default function StudyMaterialsPage() {
  const { user } = useAuth()
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: assignments } = useFetch(
    () => (user?.refId ? teacherAssignmentService.listByTeacher(user.refId) : Promise.resolve({ data: [] })),
    [user?.refId]
  )

  const [classId, setClassId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Modals state
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiModalTab, setAiModalTab] = useState('TOPICS')
  const [selectedForAi, setSelectedForAi] = useState(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedForViewer, setSelectedForViewer] = useState(null)
  const [viewerBlobUrl, setViewerBlobUrl] = useState(null)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [viewerError, setViewerError] = useState(null)

  const isAdmin = user?.role === 'ADMIN'

  const assignedClassIds =
    assignments?.length > 0
      ? [...new Set(assignments.map((a) => a.classId).filter(Boolean))]
      : []

  const visibleClasses = isAdmin
    ? classes || []
    : assignedClassIds.length > 0
    ? (classes || []).filter((c) => assignedClassIds.includes(c.id))
    : classes || []

  const assignedSubjectIdsForClass = (assignments || [])
    .filter((a) => a.classId === classId)
    .map((a) => a.subjectId)
    .filter(Boolean)

  const visibleSubjects = isAdmin
    ? subjects || []
    : assignedSubjectIdsForClass.length > 0
    ? (subjects || []).filter((s) => assignedSubjectIdsForClass.includes(s.id))
    : subjects || []

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
      setMessage('Study material posted successfully.')
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
    if (!window.confirm('Are you sure you want to delete this study material?')) return
    await studyMaterialService.remove(id)
    refetchMaterials()
  }

  async function handleView(row) {
    if (row.type === 'LINK') {
      window.open(row.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setSelectedForViewer(row)
    setViewerOpen(true)
    setViewerLoading(true)
    setViewerError(null)
    try {
      const blobUrl = await studyMaterialService.getPdfBlobUrl(row.id)
      setViewerBlobUrl(blobUrl)
    } catch (err) {
      setViewerError('Could not load in-browser preview. You can still download the PDF below.')
    } finally {
      setViewerLoading(false)
    }
  }

  async function handleDownload(row) {
    if (row.type === 'LINK') {
      window.open(row.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    const fileName = row.originalFileName || `${row.title}.pdf`
    await studyMaterialService.downloadFile(row.id, fileName)
  }

  function handleOpenAi(row, tab = 'TOPICS') {
    setSelectedForAi(row)
    setAiModalTab(tab)
    setAiModalOpen(true)
  }

  const columns = [
    {
      key: 'title',
      header: 'Title & Subject',
      render: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.title}</p>
          <p className="text-xs text-ink-400">{row.subjectName || 'Subject'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={row.type === 'PDF' ? 'neutral' : 'success'}>
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'uploadedAt',
      header: 'Posted',
      render: (row) => (row.uploadedAt ? new Date(row.uploadedAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      header: 'Actions & AI',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleView(row)}
            className="inline-flex items-center gap-1 rounded bg-paper-100 px-2 py-1 text-xs font-medium text-navy-900 hover:bg-paper-200"
            title="Read / View Document"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View</span>
          </button>

          {row.type === 'PDF' && (
            <button
              onClick={() => handleDownload(row)}
              className="inline-flex items-center gap-1 rounded bg-paper-100 px-2 py-1 text-xs font-medium text-navy-900 hover:bg-paper-200"
              title="Download File"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          )}

          <button
            onClick={() => handleOpenAi(row, 'TOPICS')}
            className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 border border-amber-200"
            title="Preview AI Questions & Topics"
          >
            <Brain className="h-3.5 w-3.5 text-amber-600" />
            <span>AI Tutor</span>
          </button>

          <button
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-danger-600 hover:bg-danger-100"
            title="Delete Material"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card
        title="Upload & Manage Study Materials"
        subtitle="Share lecture notes, PDFs, and learning references with your assigned classes."
      >
        <FormField label="Select Class">
          <select
            className={inputClass}
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value)
              setForm({ ...form, subjectId: '' })
            }}
          >
            <option value="">Select a class…</option>
            {visibleClasses?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.section}
              </option>
            ))}
          </select>
        </FormField>

        {classId && (
          <>
            <form onSubmit={handleSubmit} className="mt-4 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-paper-50 p-4 border border-paper-200">
              <FormField label="Subject">
                <select
                  required
                  className={inputClass}
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                >
                  <option value="">Select subject…</option>
                  {visibleSubjects?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Material Type">
                <select
                  className={inputClass}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="PDF">PDF Upload</option>
                  <option value="LINK">External Web Link</option>
                </select>
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Topic / Document Title">
                  <input
                    required
                    placeholder="e.g. Chapter 4: Thermodynamics & Heat Transfer"
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </FormField>
              </div>

              {form.type === 'PDF' ? (
                <div className="sm:col-span-2">
                  <FormField label="PDF File">
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
                  <FormField label="Resource URL">
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

              <div className="sm:col-span-2 flex items-center gap-3">
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Uploading…' : 'Publish Material'}
                </Button>
                {message && <span className="text-sm font-medium text-ink-600">{message}</span>}
              </div>
            </form>

            <div className="border-t border-paper-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-base font-semibold text-navy-900">
                  Posted Materials for this Class
                </h4>
                <span className="text-xs text-ink-400">
                  {classMaterials?.length || 0} items published
                </span>
              </div>
              <Table
                columns={columns}
                rows={classMaterials}
                emptyLabel="No study materials posted for this class yet."
              />
            </div>
          </>
        )}
      </Card>

      {/* In-App PDF Reader Modal */}
      <PdfViewerModal
        material={selectedForViewer}
        blobUrl={viewerBlobUrl}
        loading={viewerLoading}
        error={viewerError}
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false)
          setViewerBlobUrl(null)
          setSelectedForViewer(null)
        }}
        onDownload={handleDownload}
        onOpenAiTutor={handleOpenAi}
      />

      {/* AI Study Tutor Modal */}
      <AiStudyTutorModal
        material={selectedForAi}
        initialTab={aiModalTab}
        isOpen={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false)
          setSelectedForAi(null)
        }}
      />
    </div>
  )
}