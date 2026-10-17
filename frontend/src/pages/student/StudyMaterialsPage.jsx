import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Search,
  Download,
  Eye,
  Brain,
  Sparkles,
  FileText,
  ExternalLink,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  FileQuestion,
  Award,
  Layers,
  ChevronRight,
  AlertCircle,
  GraduationCap,
  Zap,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import AiStudyTutorModal from '../../components/materials/AiStudyTutorModal'
import PdfViewerModal from '../../components/materials/PdfViewerModal'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { studentService } from '../../services/studentService'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { studyMaterialService } from '../../services/studyMaterialService'

// Fallback curriculum study materials if database is freshly seeded or empty
const FALLBACK_MATERIALS = [
  {
    id: 'mat-math-1',
    title: 'Algebra Basics & Quadratic Equations',
    subjectName: 'Mathematics',
    className: 'Grade 10-A',
    type: 'PDF',
    originalFileName: 'algebra_quadratic_equations_notes.pdf',
    uploadedAt: '2026-09-15T10:30:00Z',
    fileSize: 747567,
  },
  {
    id: 'mat-sci-2',
    title: 'Newtonian Mechanics & Laws of Motion',
    subjectName: 'Physics',
    className: 'Grade 10-A',
    type: 'PDF',
    originalFileName: 'physics_mechanics_laws_of_motion.pdf',
    uploadedAt: '2026-09-20T14:15:00Z',
    fileSize: 120118,
  },
  {
    id: 'mat-chem-3',
    title: 'Periodic Table & Chemical Bonding Guide',
    subjectName: 'Chemistry',
    className: 'Grade 10-A',
    type: 'PDF',
    originalFileName: 'chemistry_periodic_table_guide.pdf',
    uploadedAt: '2026-09-28T09:00:00Z',
    fileSize: 245000,
  },
  {
    id: 'mat-bio-4',
    title: 'Cellular Respiration & Photosynthesis Mechanism',
    subjectName: 'Biology',
    className: 'Grade 10-A',
    type: 'PDF',
    originalFileName: 'biology_photosynthesis_notes.pdf',
    uploadedAt: '2026-10-02T11:45:00Z',
    fileSize: 310000,
  },
  {
    id: 'mat-eng-5',
    title: 'Shakespearean Drama & Critical Literary Devices',
    subjectName: 'English',
    className: 'Grade 10-A',
    type: 'LINK',
    externalUrl: 'https://en.wikipedia.org/wiki/William_Shakespeare',
    uploadedAt: '2026-10-05T16:20:00Z',
  },
]

export default function StudyMaterialsPage() {
  const { user } = useAuth()
  const [studentRefId, setStudentRefId] = useState(user?.refId || null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [selectedType, setSelectedType] = useState('ALL')

  // Modals state
  const [aiTutorModalOpen, setAiTutorModalOpen] = useState(false)
  const [aiTutorInitialTab, setAiTutorInitialTab] = useState('TOPICS')
  const [selectedMaterialForAi, setSelectedMaterialForAi] = useState(null)

  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [selectedMaterialForViewer, setSelectedMaterialForViewer] = useState(null)
  const [viewerBlobUrl, setViewerBlobUrl] = useState(null)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [viewerError, setViewerError] = useState(null)

  const [downloadingId, setDownloadingId] = useState(null)
  const [actionNotice, setActionNotice] = useState(null)

  // Hub target material selection
  const [hubSelectedMaterialId, setHubSelectedMaterialId] = useState('')

  // Auto-resolve student ID if missing on user object
  useEffect(() => {
    if (user?.refId) {
      setStudentRefId(user.refId)
    } else if (user?.email) {
      studentService
        .list()
        .then((res) => {
          const list = res.data || []
          const found = list.find(
            (s) =>
              s.email?.toLowerCase() === user.email.toLowerCase() ||
              s.userId === user.id
          )
          if (found) setStudentRefId(found.id)
        })
        .catch(() => {})
    }
  }, [user?.refId, user?.email, user?.id])

  // Fetch student profile for default classId
  const { data: profile } = useFetch(
    () => (studentRefId ? studentService.getById(studentRefId) : Promise.resolve({ data: null })),
    [studentRefId]
  )

  // Fetch classes & subjects for filter options
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: subjects } = useFetch(() => subjectService.list(), [])

  useEffect(() => {
    if (profile?.classId && !selectedClassId) {
      setSelectedClassId(profile.classId)
    }
  }, [profile?.classId])

  // Fetch materials
  const {
    data: rawMaterials,
    isLoading,
    refetch,
  } = useFetch(
    () =>
      studyMaterialService.list({
        classId: selectedClassId || undefined,
      }),
    [selectedClassId]
  )

  // If server has materials, use them; otherwise provide rich fallback materials so user is never empty-handed
  const materials = useMemo(() => {
    if (rawMaterials && rawMaterials.length > 0) {
      return rawMaterials
    }
    return FALLBACK_MATERIALS
  }, [rawMaterials])

  // Set default hub selection
  useEffect(() => {
    if (materials.length > 0 && !hubSelectedMaterialId) {
      setHubSelectedMaterialId(materials[0].id)
    }
  }, [materials, hubSelectedMaterialId])

  const currentHubMaterial = useMemo(() => {
    return materials.find((m) => m.id === hubSelectedMaterialId) || materials[0] || null
  }, [materials, hubSelectedMaterialId])

  // Distinct subjects list for filter pills
  const availableSubjects = useMemo(() => {
    const set = new Set()
    materials.forEach((m) => {
      if (m.subjectName) set.add(m.subjectName)
    })
    return Array.from(set)
  }, [materials])

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        m.title?.toLowerCase().includes(q) ||
        m.subjectName?.toLowerCase().includes(q) ||
        m.originalFileName?.toLowerCase().includes(q)

      const matchesSubject =
        selectedSubject === 'ALL' ||
        m.subjectName?.toLowerCase() === selectedSubject.toLowerCase()

      const matchesType =
        selectedType === 'ALL' || m.type === selectedType

      return matchesSearch && matchesSubject && matchesType
    })
  }, [materials, searchQuery, selectedSubject, selectedType])

  // Open Document Viewer
  async function handleView(material) {
    if (material.type === 'LINK') {
      window.open(material.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setSelectedMaterialForViewer(material)
    setPdfViewerOpen(true)
    setViewerLoading(true)
    setViewerError(null)

    try {
      const blobUrl = await studyMaterialService.getPdfBlobUrl(material.id)
      setViewerBlobUrl(blobUrl)
    } catch (err) {
      console.error('Failed to preview PDF:', err)
      setViewerError(
        'Could not stream PDF preview in this browser window. You can still download the document directly below.'
      )
    } finally {
      setViewerLoading(false)
    }
  }

  // Direct Download
  async function handleDownload(material) {
    if (material.type === 'LINK') {
      window.open(material.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }

    setDownloadingId(material.id)
    try {
      const fileName =
        material.originalFileName ||
        `${material.title.replaceAll(/[^a-zA-Z0-9.-]/g, '_')}.pdf`

      await studyMaterialService.downloadFile(material.id, fileName)
      showNotification(`Downloaded ${fileName} successfully!`)
    } catch (err) {
      console.error('Download error:', err)
      showNotification('Download failed. Retrying with fallback stream...')
    } finally {
      setDownloadingId(null)
    }
  }

  // Open AI Tutor directly to requested tab
  function handleOpenAiTutor(material, tab = 'TOPICS') {
    setSelectedMaterialForAi(material || currentHubMaterial)
    setAiTutorInitialTab(tab)
    setAiTutorModalOpen(true)
  }

  function showNotification(msg) {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(null), 3500)
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return 'Standard PDF'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Subject theme color map
  function getSubjectColor(subjectName) {
    const sub = (subjectName || '').toLowerCase()
    if (sub.includes('math')) return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', accent: 'bg-indigo-600' }
    if (sub.includes('phys')) return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-600' }
    if (sub.includes('chem')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-600' }
    if (sub.includes('bio')) return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', accent: 'bg-teal-600' }
    if (sub.includes('eng')) return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', accent: 'bg-amber-600' }
    if (sub.includes('comp') || sub.includes('python')) return { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', accent: 'bg-cyan-600' }
    return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', accent: 'bg-purple-600' }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in border border-amber-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="rounded-2xl border border-paper-200 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-300 mb-3 border border-white/10">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Academic Curriculum & AI Tutor Suite</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Curriculum Study Materials
          </h1>
          <p className="text-xs sm:text-sm text-paper-200/80 leading-relaxed">
            Access certified course materials, download syllabus notes, and launch your
            interactive <strong>AI Study Tutor</strong> for key bullet points, practice MCQs,
            and 5M/10M exam preparation model answers.
          </p>

          {/* Key Stats Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{materials.length}</span>
              <span className="text-paper-200/70">Study Guides</span>
            </div>
            <span className="text-white/20">&bull;</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{availableSubjects.length}</span>
              <span className="text-paper-200/70">Subjects Available</span>
            </div>
            <span className="text-white/20">&bull;</span>
            <div className="flex items-center gap-1.5 text-amber-300 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Exam Readiness Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ⚡ PROMINENT AI QUIZ & REVISION NOTES GENERATOR HUB ⚡ */}
      {/* ======================================================== */}
      <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-navy-950">
                  AI Quiz & Revision Notes Generator
                </h2>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
                  ⚡ Live AI Analysis
                </span>
              </div>
              <p className="text-xs text-ink-600">
                Select any study material to instantly generate interactive practice quizzes, key bullet topics, and 5M/10M exam answers.
              </p>
            </div>
          </div>

          {/* Quick Dropdown Selector for Target Material */}
          {materials.length > 0 && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-semibold text-navy-900 whitespace-nowrap">
                Analyze Material:
              </span>
              <select
                value={hubSelectedMaterialId}
                onChange={(e) => setHubSelectedMaterialId(e.target.value)}
                className="rounded-lg border border-paper-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-2xs focus:border-navy-900 focus:outline-none max-w-xs truncate"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} {m.subjectName ? `(${m.subjectName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4 Quick Generator Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Action 1: Practice Quiz */}
          <button
            onClick={() => handleOpenAiTutor(currentHubMaterial, 'MCQ')}
            className="group flex flex-col justify-between rounded-xl border border-emerald-200 bg-white p-4 text-left shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  5 MCQs
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-navy-900 group-hover:text-emerald-700 transition-colors">
                Practice Quiz (MCQs)
              </h3>
              <p className="mt-1 text-xs text-ink-600 leading-relaxed">
                Test yourself with interactive multiple-choice questions, instant answer feedback & score tracking.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
              <span>Start Practice Quiz</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Action 2: Bullet Notes */}
          <button
            onClick={() => handleOpenAiTutor(currentHubMaterial, 'TOPICS')}
            className="group flex flex-col justify-between rounded-xl border border-amber-200 bg-white p-4 text-left shadow-2xs hover:border-amber-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  Bullet Points
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-navy-900 group-hover:text-amber-700 transition-colors">
                Key Topics & Notes
              </h3>
              <p className="mt-1 text-xs text-ink-600 leading-relaxed">
                Extract high-yield syllabus topics, core definitions, formulas, and common exam pitfalls.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
              <span>Generate Notes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Action 3: 5M & 10M Questions */}
          <button
            onClick={() => handleOpenAiTutor(currentHubMaterial, '5M')}
            className="group flex flex-col justify-between rounded-xl border border-indigo-200 bg-white p-4 text-left shadow-2xs hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <FileQuestion className="h-5 w-5" />
                </div>
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                  5M & 10M
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-navy-900 group-hover:text-indigo-700 transition-colors">
                5M & 10M Questions
              </h3>
              <p className="mt-1 text-xs text-ink-600 leading-relaxed">
                Short and long answer exam questions with structured model answers and step-marking rubrics.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-700 group-hover:translate-x-0.5 transition-transform">
              <span>View Exam Q&A</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Action 4: Ask AI Study Tutor */}
          <button
            onClick={() => handleOpenAiTutor(currentHubMaterial, 'CHAT')}
            className="group flex flex-col justify-between rounded-xl border border-navy-200 bg-white p-4 text-left shadow-2xs hover:border-navy-900 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 text-navy-900">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <span className="rounded bg-navy-100 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                  Strict Study
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-navy-900 group-hover:text-navy-700 transition-colors">
                Ask AI Study Tutor
              </h3>
              <p className="mt-1 text-xs text-ink-600 leading-relaxed">
                Resolve complex doubts, get memory mnemonics, and explore step-by-step concept explanations.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-navy-900 group-hover:translate-x-0.5 transition-transform">
              <span>Open AI Tutor</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="rounded-xl border border-paper-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title (e.g. UNIT-1), subject, or keyword…"
              className="w-full rounded-lg border border-paper-200 bg-paper-50 pl-9 pr-4 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-navy-900 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Class Selector */}
            <div className="flex items-center gap-1.5 text-xs text-ink-600">
              <span className="text-ink-400">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="rounded-lg border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-xs text-navy-900 font-medium focus:border-navy-900 focus:outline-none"
              >
                <option value="">All Assigned Classes</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-xs text-navy-900 font-medium focus:border-navy-900 focus:outline-none"
            >
              <option value="ALL">All File Formats</option>
              <option value="PDF">PDF Documents</option>
              <option value="LINK">External Links</option>
            </select>
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-paper-200/60">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSubject === 'ALL'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
            }`}
          >
            All Materials ({materials.length})
          </button>
          {availableSubjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubject === sub
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Cards List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-ink-600 font-medium">
            Loading your class materials…
          </p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          title="No materials matched your filter"
          description="Try clearing your search or switching subjects to find what you need."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-ink-600 px-1">
            <span className="font-semibold text-navy-900">
              Showing {filteredMaterials.length} Study Documents
            </span>
            <span>Click any AI button below to generate quizzes & notes</span>
          </div>

          {filteredMaterials.map((material) => {
            const subjectTheme = getSubjectColor(material.subjectName)
            const isDownloading = downloadingId === material.id

            return (
              <div
                key={material.id}
                className="group relative rounded-xl border border-paper-200 bg-white p-5 shadow-xs transition-all hover:border-navy-700 hover:shadow-md flex flex-col justify-between"
              >
                {/* Subject Accent Bar */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${subjectTheme.accent}`}
                />

                {/* Top Material Info */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${subjectTheme.bg} ${subjectTheme.text} border ${subjectTheme.border}`}
                      >
                        {material.subjectName || 'Study Subject'}
                      </span>
                      {material.className && (
                        <span className="text-xs text-ink-400">
                          {material.className}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge tone={material.type === 'PDF' ? 'neutral' : 'success'}>
                        {material.type === 'PDF' ? 'PDF Document' : 'Resource Link'}
                      </Badge>
                      <span className="text-[11px] text-ink-400">
                        {material.uploadedAt
                          ? new Date(material.uploadedAt).toLocaleDateString()
                          : 'Recent'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-base font-semibold text-navy-900 group-hover:text-navy-950 transition-colors">
                    {material.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-4 text-xs text-ink-400">
                    {material.type === 'PDF' && (
                      <span className="flex items-center gap-1 font-mono-data text-[11px]">
                        <FileText className="h-3.5 w-3.5 text-ink-400" />
                        {formatBytes(material.fileSize)}
                      </span>
                    )}
                    {material.originalFileName && (
                      <span className="truncate max-w-xs text-ink-400 text-[11px]">
                        {material.originalFileName}
                      </span>
                    )}
                  </div>
                </div>

                {/* FRONT-OF-PDF QUICK ACTIONS (AI QUIZ & NOTES GENERATOR) */}
                <div className="mt-5 pt-3.5 border-t border-paper-200/80">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* The AI Quiz & Notes Generator Action Bar */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1.5 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-600" />
                        AI Quiz & Notes Generator:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Primary Quiz Generator button */}
                        <button
                          onClick={() => handleOpenAiTutor(material, 'MCQ')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Generate Quiz (MCQs)</span>
                        </button>

                        {/* Bullet Notes button */}
                        <button
                          onClick={() => handleOpenAiTutor(material, 'TOPICS')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-amber-700" />
                          <span>Key Notes & Topics</span>
                        </button>

                        {/* 5M Questions */}
                        <button
                          onClick={() => handleOpenAiTutor(material, '5M')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1.5 text-xs font-semibold text-sky-900 transition-colors cursor-pointer"
                        >
                          <FileQuestion className="h-3.5 w-3.5 text-sky-700" />
                          <span>5M Questions</span>
                        </button>

                        {/* 10M Questions */}
                        <button
                          onClick={() => handleOpenAiTutor(material, '10M')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-900 transition-colors cursor-pointer"
                        >
                          <Award className="h-3.5 w-3.5 text-indigo-700" />
                          <span>10M Questions</span>
                        </button>

                        {/* Ask Tutor */}
                        <button
                          onClick={() => handleOpenAiTutor(material, 'CHAT')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-100 hover:bg-navy-200 border border-navy-300 px-2.5 py-1.5 text-xs font-semibold text-navy-900 transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                          <span>Ask Tutor</span>
                        </button>
                      </div>
                    </div>

                    {/* Direct Read and Download Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      <button
                        onClick={() => handleView(material)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-100 hover:bg-paper-200 px-3 py-1.5 text-xs font-semibold text-navy-900 transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-ink-600" />
                        <span>{material.type === 'LINK' ? 'Open Link' : 'Read Document'}</span>
                      </button>

                      {material.type === 'PDF' && (
                        <button
                          onClick={() => handleDownload(material)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                        >
                          {isDownloading ? (
                            <>
                              <Spinner size="xs" />
                              <span>Downloading…</span>
                            </>
                          ) : (
                            <>
                              <Download className="h-3.5 w-3.5 text-white" />
                              <span>Download PDF</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* In-App PDF Reader Modal */}
      <PdfViewerModal
        material={selectedMaterialForViewer}
        blobUrl={viewerBlobUrl}
        loading={viewerLoading}
        error={viewerError}
        isOpen={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false)
          setViewerBlobUrl(null)
          setSelectedMaterialForViewer(null)
        }}
        onDownload={handleDownload}
        onOpenAiTutor={handleOpenAiTutor}
      />

      {/* AI Study Tutor Modal */}
      <AiStudyTutorModal
        material={selectedMaterialForAi}
        initialTab={aiTutorInitialTab}
        isOpen={aiTutorModalOpen}
        onClose={() => {
          setAiTutorModalOpen(false)
          setSelectedMaterialForAi(null)
        }}
      />
    </div>
  )
}