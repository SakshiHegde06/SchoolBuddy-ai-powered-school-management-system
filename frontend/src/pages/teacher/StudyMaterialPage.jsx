import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Brain,
  Download,
  Eye,
  Trash2,
  FileText,
  Upload,
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  Zap,
  CheckCircle2,
  FileQuestion,
  Award,
  BookOpen,
  Filter,
  Search,
  School,
  Calendar,
  Layers,
  X,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import AiStudyTutorModal from '../../components/materials/AiStudyTutorModal'
import PdfViewerModal from '../../components/materials/PdfViewerModal'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { studyMaterialService } from '../../services/studyMaterialService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { subjectId: '', title: '', type: 'PDF', externalUrl: '' }

export default function StudyMaterialPage() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

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
  const [message, setMessage] = useState(null) // { text: string, type: 'success' | 'error' }
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL')
  const [isDownloadingId, setIsDownloadingId] = useState(null)

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

  // Teacher assigned classes
  const assignedClassIds = useMemo(() => {
    return assignments?.length > 0
      ? [...new Set(assignments.map((a) => a.classId).filter(Boolean))]
      : []
  }, [assignments])

  const visibleClasses = useMemo(() => {
    if (isAdmin) return classes || []
    if (assignedClassIds.length > 0) {
      return (classes || []).filter((c) => assignedClassIds.includes(c.id))
    }
    return classes || []
  }, [isAdmin, classes, assignedClassIds])

  // Auto-select initial class
  useEffect(() => {
    if (!classId && visibleClasses && visibleClasses.length > 0) {
      setClassId(visibleClasses[0].id)
    }
  }, [visibleClasses, classId])

  // Subjects assigned to teacher for the active class
  const assignedSubjectIdsForClass = useMemo(() => {
    return (assignments || [])
      .filter((a) => a.classId === classId)
      .map((a) => a.subjectId)
      .filter(Boolean)
  }, [assignments, classId])

  const visibleSubjects = useMemo(() => {
    if (isAdmin) return subjects || []
    if (assignedSubjectIdsForClass.length > 0) {
      return (subjects || []).filter((s) => assignedSubjectIdsForClass.includes(s.id))
    }
    return subjects || []
  }, [isAdmin, subjects, assignedSubjectIdsForClass])

  // Auto-select first valid subject when class or visibleSubjects updates
  useEffect(() => {
    if (visibleSubjects && visibleSubjects.length > 0) {
      if (!form.subjectId || !visibleSubjects.some((s) => s.id === form.subjectId)) {
        setForm((prev) => ({ ...prev, subjectId: visibleSubjects[0].id }))
      }
    }
  }, [visibleSubjects])

  // Materials for selected class
  const {
    data: classMaterials,
    isLoading: materialsLoading,
    refetch: refetchMaterials,
  } = useFetch(
    () => (classId ? studyMaterialService.findByClass(classId) : Promise.resolve({ data: [] })),
    [classId]
  )

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    if (!classMaterials) return []
    return classMaterials.filter((m) => {
      const matchSearch =
        searchQuery === '' ||
        m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subjectName?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType =
        selectedTypeFilter === 'ALL' || m.type === selectedTypeFilter
      return matchSearch && matchType
    })
  }, [classMaterials, searchQuery, selectedTypeFilter])

  // Handle Form Submission
  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    try {
      if (!classId) {
        setMessage({ text: 'Please select a target class first.', type: 'error' })
        setIsSubmitting(false)
        return
      }
      if (!form.subjectId) {
        setMessage({ text: 'Please choose an academic subject.', type: 'error' })
        setIsSubmitting(false)
        return
      }
      if (!form.title.trim()) {
        setMessage({ text: 'Please enter a title for the study material.', type: 'error' })
        setIsSubmitting(false)
        return
      }

      const formData = new FormData()
      formData.append('classId', classId)
      formData.append('subjectId', form.subjectId)
      formData.append('title', form.title.trim())
      formData.append('type', form.type)

      if (form.type === 'PDF') {
        if (!file) {
          setMessage({ text: 'Please select or drop a PDF file to upload.', type: 'error' })
          setIsSubmitting(false)
          return
        }
        if (file.size > 50 * 1024 * 1024) {
          setMessage({
            text: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 50MB limit. Please upload a PDF under 50MB.`,
            type: 'error',
          })
          setIsSubmitting(false)
          return
        }
        formData.append('file', file)
      } else {
        if (!form.externalUrl || !form.externalUrl.trim()) {
          setMessage({ text: 'Please provide a valid web link URL.', type: 'error' })
          setIsSubmitting(false)
          return
        }
        formData.append('externalUrl', form.externalUrl.trim())
      }

      await studyMaterialService.create(formData)
      setMessage({ text: `"${form.title}" published successfully! AI quiz & revision notes are now active.`, type: 'success' })
      setForm((prev) => ({ ...emptyForm, subjectId: prev.subjectId }))
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      refetchMaterials()
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Failed to post study material. Please try again.'
      setMessage({ text: errorMsg, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete
  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await studyMaterialService.remove(id)
      setMessage({ text: `Deleted "${title}" successfully.`, type: 'success' })
      refetchMaterials()
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Could not delete material.', type: 'error' })
    }
  }

  // Handle Document Preview in Viewer
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
      console.error(err)
      setViewerError('Could not load in-browser preview. You can still download the PDF below.')
    } finally {
      setViewerLoading(false)
    }
  }

  // Handle PDF Download
  async function handleDownload(row) {
    setIsDownloadingId(row.id)
    try {
      const fileName = row.originalFileName || `${row.title.replaceAll(/[^a-zA-Z0-9.-]/g, '_')}.pdf`
      await studyMaterialService.downloadFile(row.id, fileName)
    } catch (err) {
      console.error('Download error:', err)
      alert('Could not download file. Please try again.')
    } finally {
      setIsDownloadingId(null)
    }
  }

  // Launch AI Tutor preview
  function handleOpenAi(row, tab = 'TOPICS') {
    setSelectedForAi(row)
    setAiModalTab(tab)
    setAiModalOpen(true)
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return 'Standard PDF'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const selectedClassObj = classes?.find((c) => c.id === classId)

  return (
    <div className="space-y-8 pb-16">
      {/* ======================================================== */}
      {/* 1. EXECUTIVE HERO HEADER (FACULTY PORTAL)               */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 h-56 w-56 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-3 border border-indigo-400/30">
              <School className="h-4 w-4 text-indigo-400" />
              <span>Faculty Academic Portal • Study Materials & AI Studio</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Curriculum Study Materials Studio
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Upload certified syllabus notes, lecture slides, and reference links.
              Preview AI-generated practice MCQs, key revision topics, and tutoring explanations
              that your students will receive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Target Class</p>
              <p className="text-base font-extrabold text-white">
                {selectedClassObj ? `${selectedClassObj.name} ${selectedClassObj.section}` : 'Choose Class'}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Published Notes</p>
              <p className="text-base font-extrabold text-amber-300">
                {classMaterials?.length || 0} Documents
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MODERN INTERACTIVE UPLOAD STUDIO                     */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-indigo-600" />
              <span>Publish New Study Material</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select class and subject, attach a PDF or web reference, and publish instantly.
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
            ⚡ Live AI Generation Enabled
          </span>
        </div>

        {/* Status Toast Alert */}
        {message && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-xs animate-fade-in ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {message.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Class & Subject Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Target Class
              </label>
              <select
                required
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value)
                  setMessage(null)
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              >
                <option value="">Select a class…</option>
                {visibleClasses?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Academic Subject
              </label>
              <select
                required
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              >
                <option value="">Select subject…</option>
                {visibleSubjects?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {visibleSubjects?.length > 0 && (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Assigned subjects in this class:{' '}
                  <span className="font-semibold text-indigo-700">
                    {visibleSubjects.map((s) => s.name).join(', ')}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Format Switcher (PDF vs Link) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              3. Resource Format
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'PDF' })}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold border transition cursor-pointer ${
                  form.type === 'PDF'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>PDF Document</span>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'LINK' })}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold border transition cursor-pointer ${
                  form.type === 'LINK'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                <span>External Web Link</span>
              </button>
            </div>
          </div>

          {/* Step 3: Document Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              4. Topic / Document Title
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Unit 1: Principles of Electricity, Ohm's Law & Circuit Diagrams"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Step 4: File Dropzone or External URL */}
          {form.type === 'PDF' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                5. Upload PDF Document
              </label>

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const selectedFile = e.target.files[0]
                        if (selectedFile.size > 50 * 1024 * 1024) {
                          setMessage({
                            text: `"${selectedFile.name}" is ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB, which exceeds the 50MB limit. Please choose a smaller PDF.`,
                            type: 'error',
                          })
                          setFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                          return
                        }
                        setFile(selectedFile)
                        setMessage(null)
                      }
                    }}
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 group-hover:scale-110 transition-transform mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drop your PDF document here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts certified academic PDFs (up to 50MB). AI tutor will analyze this text.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatBytes(file.size)} &bull; Ready to publish
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-rose-600 transition cursor-pointer"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                5. External Web Resource URL
              </label>
              <input
                required
                type="url"
                placeholder="https://khanacademy.org/science/physics/..."
                value={form.externalUrl}
                onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition"
              />
            </div>
          )}

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="xs" />
                  <span>Uploading & Analyzing…</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 text-amber-300" />
                  <span>Publish Material & Activate AI Tutor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 3. PUBLISHED MATERIALS MANAGEMENT LIBRARY               */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Published Course Materials ({filteredMaterials.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Materials shared with {selectedClassObj ? `${selectedClassObj.name} ${selectedClassObj.section}` : 'this class'}.
              Click any AI preview button to test questions and marking schemes.
            </p>
          </div>

          {/* Search & Type Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes & topics…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none transition w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold">
              <button
                onClick={() => setSelectedTypeFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  selectedTypeFilter === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedTypeFilter('PDF')}
                className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  selectedTypeFilter === 'PDF'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                PDFs
              </button>
              <button
                onClick={() => setSelectedTypeFilter('LINK')}
                className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  selectedTypeFilter === 'LINK'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Links
              </button>
            </div>
          </div>
        </div>

        {materialsLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner label="Loading published materials…" />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No study materials published yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Use the studio above to upload syllabus notes, practice papers, or revision PDFs for this class.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMaterials.map((material) => (
              <div
                key={material.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <span className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        {material.subjectName || 'Curriculum'}
                      </span>
                      <Badge tone={material.type === 'PDF' ? 'neutral' : 'success'}>
                        {material.type === 'PDF' ? 'PDF Document' : 'Resource Link'}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {material.uploadedAt
                          ? new Date(material.uploadedAt).toLocaleDateString()
                          : 'Recent'}
                      </span>
                      {material.type === 'PDF' && material.fileSize > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatBytes(material.fileSize)}
                        </span>
                      )}
                    </div>

                    <h4 className="font-display text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                      {material.title}
                    </h4>
                  </div>

                  {/* Actions & AI Preview Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 self-end lg:self-center">
                    {/* Front-of-PDF AI Action Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 px-1 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-600" />
                        AI:
                      </span>
                      <button
                        onClick={() => handleOpenAi(material, 'MCQ')}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs transition cursor-pointer"
                        title="Preview student MCQs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>MCQs</span>
                      </button>
                      <button
                        onClick={() => handleOpenAi(material, 'TOPICS')}
                        className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-amber-50 border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-900 transition cursor-pointer"
                        title="Preview key revision topics"
                      >
                        <BookOpen className="h-3 w-3 text-amber-700" />
                        <span>Notes</span>
                      </button>
                      <button
                        onClick={() => handleOpenAi(material, 'CHAT')}
                        className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-900 transition cursor-pointer"
                        title="Open AI Tutor Chat"
                      >
                        <Sparkles className="h-3 w-3 text-indigo-600" />
                        <span>AI Tutor</span>
                      </button>
                    </div>

                    {/* Document View & Download */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleView(material)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition cursor-pointer"
                        title="Read document"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>View</span>
                      </button>

                      {material.type === 'PDF' && (
                        <button
                          onClick={() => handleDownload(material)}
                          disabled={isDownloadingId === material.id}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="h-3.5 w-3.5 text-white" />
                          <span>{isDownloadingId === material.id ? '…' : 'PDF'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(material.id, material.title)}
                        className="inline-flex items-center justify-center rounded-xl p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. MODALS (IN-APP PDF READER & AI TUTOR PREVIEW)         */}
      {/* ======================================================== */}
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
        onOpenAiTutor={(row, tab) => handleOpenAi(row, tab)}
      />

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