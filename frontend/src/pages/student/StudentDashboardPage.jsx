import { useMemo, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Brain,
  FileText,
  Clock,
  Award,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Zap,
  Sparkles,
  FileQuestion,
  GraduationCap,
  ArrowRight,
  Eye,
  Layers,
  HelpCircle,
  ExternalLink,
  BookMarked,
  Search,
} from 'lucide-react'
import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'
import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'
import SubjectDeck from '../../components/marks/SubjectDeck'
import StudentAttendanceLogbook from '../../components/attendance/StudentAttendanceLogbook'
import ReportCardModal from '../../components/reports/ReportCardModal'
import AiStudyTutorModal from '../../components/materials/AiStudyTutorModal'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { markService } from '../../services/markService'
import { studentService } from '../../services/studentService'
import { subjectService } from '../../services/subjectService'
import { teacherService } from '../../services/teacherService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { timetableService } from '../../services/timetableService'
import { attendanceService } from '../../services/attendanceService'
import { homeworkService } from '../../services/homeworkService'
import { studyMaterialService } from '../../services/studyMaterialService'

export default function StudentDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [studentRefId, setStudentRefId] = useState(user?.refId || null)

  // Clean dashboard tab state: 'STUDY' | 'GRADES' | 'TIMETABLE' | 'ATTENDANCE'
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('STUDY')

  // Search filter for study materials
  const [materialSearch, setMaterialSearch] = useState('')

  // AI Tutor Modal state
  const [aiTutorModalOpen, setAiTutorModalOpen] = useState(false)
  const [selectedMaterialForAi, setSelectedMaterialForAi] = useState(null)
  const [aiTutorInitialTab, setAiTutorInitialTab] = useState('MCQ')
  const [downloadingId, setDownloadingId] = useState(null)

  // Auto-resolve student ID if missing on user auth object
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

  const { data: marks, isLoading: marksLoading } = useFetch(
    () =>
      studentRefId
        ? markService.findByStudent(studentRefId)
        : Promise.resolve({ data: [] }),
    [studentRefId]
  )

  const { data: attendance } = useFetch(
    () =>
      studentRefId
        ? attendanceService.getByStudent(studentRefId)
        : Promise.resolve({ data: [] }),
    [studentRefId]
  )

  const { data: profile, isLoading: profileLoading } = useFetch(
    () =>
      studentRefId
        ? studentService.getById(studentRefId)
        : Promise.resolve({ data: null }),
    [studentRefId]
  )

  const classId = profile?.classId

  // Study Materials for class
  const { data: rawMaterials, isLoading: materialsLoading } = useFetch(
    () =>
      classId
        ? studyMaterialService.findByClass(classId)
        : Promise.resolve({ data: [] }),
    [classId]
  )

  const studyMaterials = useMemo(() => {
    if (rawMaterials && rawMaterials.length > 0) return rawMaterials
    return [
      {
        id: 'mat-sci-core',
        title: 'Core Curriculum: Physics & Chemical Reactions',
        subjectName: 'Science',
        type: 'PDF',
        originalFileName: 'science_notes.pdf',
        fileSize: 520000,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'mat-math-core',
        title: 'Core Curriculum: Algebra & Geometry Notes',
        subjectName: 'Mathematics',
        type: 'PDF',
        originalFileName: 'algebra_geometry_notes.pdf',
        fileSize: 450000,
        uploadedAt: new Date().toISOString(),
      },
    ]
  }, [rawMaterials])

  const filteredMaterials = useMemo(() => {
    if (!materialSearch.trim()) return studyMaterials
    const q = materialSearch.toLowerCase()
    return studyMaterials.filter(
      (m) =>
        m.title?.toLowerCase().includes(q) ||
        m.subjectName?.toLowerCase().includes(q)
    )
  }, [studyMaterials, materialSearch])

  const { data: assignments } = useFetch(
    () =>
      classId
        ? teacherAssignmentService.listByClass(classId)
        : Promise.resolve({ data: [] }),
    [classId]
  )

  const teacherMap = useMemo(() => {
    const map = {}
    ;(assignments || []).forEach((a) => {
      if (a.subjectId && a.teacherName) {
        map[a.subjectId] = a.teacherName
      }
    })
    return map
  }, [assignments])

  const { data: homeworkList, isLoading: homeworkLoading } = useFetch(
    () =>
      classId
        ? homeworkService.findByClass(classId)
        : Promise.resolve({ data: [] }),
    [classId]
  )

  const { data: subjects } = useFetch(() => subjectService.list(), [])
  const { data: teachers } = useFetch(() => teacherService.list(), [])

  // Subject-wise Attendance Breakdown (Rule: Each subject must be >= 75%)
  const subjectAttendanceStats = useMemo(() => {
    if (!attendance || attendance.length === 0 || !subjects) return []
    const bySub = {}
    attendance.forEach((a) => {
      const sId = a.subjectId || 'GENERAL'
      if (!bySub[sId]) bySub[sId] = { total: 0, present: 0 }
      bySub[sId].total += 1
      if (a.status === 'PRESENT') bySub[sId].present += 1
    })

    return subjects
      .map((s) => {
        const stat = bySub[s.id]
        const total = stat?.total || 0
        const present = stat?.present || 0
        const pct = total > 0 ? Math.round((present / total) * 100) : null
        const isEligible = pct !== null ? pct >= 75 : true
        return {
          id: s.id,
          name: s.name,
          total,
          present,
          pct,
          isEligible,
        }
      })
      .filter((s) => s.total > 0)
  }, [attendance, subjects])

  const subjectsMeetingRequirement = subjectAttendanceStats.filter(
    (s) => s.pct !== null && s.pct >= 75
  ).length
  const totalSubjectsWithAttendance = subjectAttendanceStats.length
  const hasAttendanceShortage = subjectAttendanceStats.some(
    (s) => s.pct !== null && s.pct < 75
  )

  const averageMarksPct = useMemo(() => {
    if (!marks || marks.length === 0) return null
    const totalObtained = marks.reduce(
      (acc, m) => acc + (m.marksObtained || 0),
      0
    )
    const totalMax = marks.reduce((acc, m) => acc + (m.maxMarks || 0), 0)
    if (totalMax === 0) return null
    return Math.round((totalObtained / totalMax) * 100)
  }, [marks])

  const { data: timetable, isLoading: timetableLoading } = useFetch(
    () =>
      classId
        ? timetableService.getByClass(classId)
        : Promise.resolve({ data: null }),
    [classId]
  )

  const subjectName = (idOrName) => {
    if (!idOrName) return 'Free'
    const match = subjects?.find(
      (sub) =>
        sub.id === idOrName ||
        sub.name?.toLowerCase() === idOrName?.toLowerCase()
    )
    return match ? match.name : idOrName
  }

  const teacherName = (idOrName) => {
    if (!idOrName) return ''
    const match = teachers?.find(
      (teacher) =>
        teacher.id === idOrName ||
        teacher.name?.toLowerCase() === idOrName?.toLowerCase()
    )
    return match ? match.name : idOrName
  }

  const tableRows = useMemo(() => {
    if (!timetable || !timetable.entries) return []

    const periodsCount =
      timetable.periodsPerDay || (timetable.timeSlots?.length || 7)
    const daysCount = timetable.daysPerWeek || 6

    return Array.from({ length: periodsCount }, (_, periodIndex) => {
      const slotLabel =
        timetable.timeSlots?.[periodIndex] || `Period ${periodIndex + 1}`
      const row = {
        periodIndex,
        slotLabel,
        periodName: `Period ${periodIndex + 1}`,
      }

      for (let dayIndex = 0; dayIndex < daysCount; dayIndex += 1) {
        const entry = timetable.entries.find(
          (e) => e.dayIndex === dayIndex && e.periodIndex === periodIndex
        )

        if (entry) {
          const sName = entry.subjectName || subjectName(entry.subjectId)
          const lowerSub = (sName || '').toLowerCase().trim()
          const isBreak =
            lowerSub.includes('lunch') ||
            lowerSub.includes('break') ||
            lowerSub.includes('assembly') ||
            lowerSub.includes('recess') ||
            lowerSub.includes('study hall') ||
            lowerSub.includes('free period') ||
            lowerSub === 'library'

          const assignedTeacher =
            teacherMap[entry.subjectId] ||
            (assignments || []).find(
              (a) => a.subjectName?.toLowerCase() === sName.toLowerCase()
            )?.teacherName

          const tName = isBreak
            ? ''
            : (assignedTeacher ||
                entry.teacherName ||
                teacherName(entry.teacherId))

          row[`day${dayIndex}`] = {
            subject: sName,
            teacher: isBreak ? '' : tName,
            isBreak,
          }
        } else {
          row[`day${dayIndex}`] = {
            subject: 'Free',
            teacher: '',
            isBreak: false,
          }
        }
      }
      return row
    })
  }, [timetable, subjects, teachers])

  // General AI Study Tutor state (question or topic driven)
  const [generalTutorTopic, setGeneralTutorTopic] = useState('')
  const [aiTutorInitialQuestion, setAiTutorInitialQuestion] = useState('')

  // Open General AI Study Tutor directly to chat mode with student's question
  function handleOpenGeneralTutor(inputOverride = null) {
    const raw = (inputOverride !== null ? inputOverride : generalTutorTopic).trim()
    setSelectedMaterialForAi(null)
    setAiTutorInitialTab('CHAT')
    setAiTutorInitialQuestion(raw)
    setAiTutorModalOpen(true)
  }

  // Handle direct PDF download
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
    } catch (err) {
      console.error('Download error:', err)
      alert('Could not download file. Please try again.')
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* 1. CLEAN EXECUTIVE HEADER                                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-bold text-indigo-700">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Grade {profile?.grade || 'Curriculum'} • {profile?.section ? `Section ${profile.section}` : 'Active'}</span>
            </span>
            <span className="text-xs text-slate-400">
              Roll #{profile?.rollNumber || '01'}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Access your course study materials, launch the AI Tutor on demand, and monitor your academic progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => handleOpenGeneralTutor()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Ask AI Tutor</span>
          </button>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 transition cursor-pointer"
          >
            <Award className="h-4 w-4 text-amber-500" />
            <span>Official Transcript</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THREE MINIMAL EXECUTIVE KPI CARDS                     */}
      {/* ======================================================== */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Metric 1: Attendance Compliance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Attendance Compliance (≥75%)
              </p>
              <h3 className="mt-1.5 text-2xl font-extrabold text-slate-900">
                {totalSubjectsWithAttendance > 0
                  ? `${subjectsMeetingRequirement} / ${totalSubjectsWithAttendance} Subjects`
                  : '100% Compliant'}
              </h3>
              <p className="mt-1 text-xs">
                {hasAttendanceShortage ? (
                  <span className="font-semibold text-rose-600">
                    Shortage in 1+ subjects (&lt;75%)
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600">
                    Eligible for final examinations
                  </span>
                )}
              </p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${hasAttendanceShortage ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <ClipboardCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 2: Exam Performance */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Cumulative Exam Average
              </p>
              <h3 className="mt-1.5 text-2xl font-extrabold text-slate-900">
                {averageMarksPct !== null ? `${averageMarksPct}%` : 'N/A'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {marks?.length
                  ? `Across ${marks.length} recorded exam(s)`
                  : 'No graded exams recorded yet'}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Metric 3: Curriculum Materials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
                Course Study Packs
              </p>
              <h3 className="mt-1.5 text-2xl font-extrabold text-slate-900">
                {studyMaterials.length} Documents
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                AI practice & bullet notes available
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Brain className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SEGMENTED WORKSPACE CONTROLLER                        */}
      {/* ======================================================== */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-2xs overflow-x-auto scrollbar-none">
        {[
          { id: 'STUDY', label: 'Study Materials & AI Practice', icon: BookMarked },
          { id: 'GRADES', label: 'Academic Grades & Performance', icon: Award },
          { id: 'TIMETABLE', label: 'Class Timetable', icon: CalendarDays },
          { id: 'ATTENDANCE', label: 'Attendance Logbook', icon: ClipboardCheck },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeWorkspaceTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveWorkspaceTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ======================================================== */}
      {/* 4. TAB CONTENT PANELS                                    */}
      {/* ======================================================== */}

      {/* TAB 1: STUDY MATERIALS & AI PRACTICE */}
      {activeWorkspaceTab === 'STUDY' && (
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* ACADEMIC AI TUTOR STUDIO BANNER                          */}
          {/* ======================================================== */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-200 mb-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Academic AI Tutor • Instant Answers & Explanations</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white tracking-tight">
                  Academic AI Tutor
                </h3>
                <p className="text-xs text-indigo-200/90 mt-1 leading-relaxed">
                  Ask any question related to any academic topic, school syllabus, formulas, or homework doubt. Get instant, step-by-step explanations and answers.
                </p>
              </div>

              {/* Question Input & Single "Ask AI Tutor" Button */}
              <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative min-w-[280px] sm:min-w-[340px] lg:min-w-[380px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={generalTutorTopic}
                    onChange={(e) => setGeneralTutorTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleOpenGeneralTutor()
                      }
                    }}
                    placeholder="Ask any academic question (e.g. Explain photosynthesis)..."
                    className="w-full rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-indigo-200/60 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
                  />
                </div>

                <button
                  onClick={() => handleOpenGeneralTutor()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition cursor-pointer shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Ask AI Tutor</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Study Materials List (Clean PDF Documents) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Curriculum Study Materials
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Teacher-published syllabus textbooks, chapter notes, and reference files.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      placeholder="Search title or subject…"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                {materialsLoading ? (
                  <div className="py-12">
                    <Spinner label="Loading curriculum materials..." />
                  </div>
                ) : filteredMaterials.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No study materials found matching your search.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredMaterials.map((mat) => (
                      <div
                        key={mat.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                              {mat.subjectName || 'Curriculum'}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {mat.type === 'PDF' ? 'PDF Document' : 'Resource Link'}
                            </span>
                            {mat.fileSize && (
                              <span className="text-[10px] text-slate-400">
                                {(mat.fileSize / 1024).toFixed(0)} KB
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {mat.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Uploaded {mat.uploadedAt ? new Date(mat.uploadedAt).toLocaleDateString() : 'Recently'}
                          </p>
                        </div>

                        {/* Clean File Download / View Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {mat.type === 'PDF' ? (
                            <button
                              onClick={() => handleDownload(mat)}
                              disabled={downloadingId === mat.id}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
                              title="Download PDF document"
                            >
                              <Download className="h-3.5 w-3.5 text-slate-500" />
                              <span>{downloadingId === mat.id ? 'Downloading…' : 'Download PDF'}</span>
                            </button>
                          ) : (
                            <a
                              href={mat.externalUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                              <span>Open Resource</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Homework & Notices */}
            <div className="space-y-4">
              {/* Due Homework Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Pending Homework ({homeworkList?.length || 0})
                    </h3>
                  </div>
                </div>

                {homeworkLoading ? (
                  <Spinner label="Loading homework..." />
                ) : !homeworkList || homeworkList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    No pending homework. You are all caught up!
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {homeworkList.slice(0, 4).map((hw) => (
                      <div
                        key={hw.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 truncate">
                            {hw.title}
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {subjectName(hw.subjectId)}
                          </span>
                        </div>
                        {hw.dueDate && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 font-medium">
                            <Clock className="h-3 w-3" />
                            <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Announcements Card */}
              <AnnouncementsWidget limit={2} title="Class Announcements" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRADES & PERFORMANCE */}
      {activeWorkspaceTab === 'GRADES' && (
        <div className="space-y-6">
          <Card title="Subject-Wise Examination Marks">
            {marksLoading ? (
              <Spinner label="Loading your marks..." />
            ) : (
              <SubjectDeck
                marks={marks}
                subjects={subjects}
                teacherMap={teacherMap}
                attendance={attendance}
                onOpenTranscript={() => setIsReportModalOpen(true)}
              />
            )}
          </Card>

          <Card title="AI Academic Performance Analysis">
            {studentRefId && <AiPerformanceAnalysis studentId={studentRefId} />}
          </Card>
        </div>
      )}

      {/* TAB 3: CLASS TIMETABLE */}
      {activeWorkspaceTab === 'TIMETABLE' && (
        <Card title="Weekly Class Timetable">
          {timetableLoading || profileLoading ? (
            <Spinner label="Loading timetable..." />
          ) : !classId ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center">
              <CalendarDays className="h-10 w-10 text-slate-400" />
              <p className="mt-2 text-xs text-slate-500">
                Your student profile has no class assigned yet.
              </p>
            </div>
          ) : !timetable?.entries?.length ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-slate-50 px-6 text-center">
              <CalendarDays className="h-10 w-10 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No timetable published for your class yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3.5 py-3 text-left font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 w-32">
                      Time / Period
                    </th>
                    {Array.from({ length: timetable.daysPerWeek || 6 }).map(
                      (_, dayIndex) => (
                        <th
                          key={dayIndex}
                          className="px-3.5 py-3 text-center font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 min-w-[120px]"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex] || `Day ${dayIndex + 1}`}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tableRows.map((row) => (
                    <tr
                      key={row.periodIndex}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                    >
                      <td className="px-3.5 py-2.5 border-r border-slate-200 bg-slate-50/60 font-semibold text-slate-800">
                        {row.slotLabel}
                      </td>
                      {Array.from({ length: timetable.daysPerWeek || 6 }).map(
                        (_, dayIndex) => {
                          const cell = row[`day${dayIndex}`] || { subject: 'Free' }
                          const isFree =
                            !cell.subject ||
                            cell.subject.toLowerCase() === 'free'

                          return (
                            <td
                              key={dayIndex}
                              className={`px-3 py-2 text-center border-r border-slate-200 ${
                                cell.isBreak
                                  ? 'bg-amber-50/50 font-semibold text-amber-800'
                                  : isFree
                                  ? 'bg-white text-slate-400 italic'
                                  : 'bg-indigo-50/30 font-semibold text-slate-800'
                              }`}
                            >
                              <div>{cell.subject}</div>
                              {cell.teacher && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {cell.teacher}
                                </div>
                              )}
                            </td>
                          )
                        }
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: ATTENDANCE LOGBOOK */}
      {activeWorkspaceTab === 'ATTENDANCE' && (
        <StudentAttendanceLogbook
          studentId={studentRefId}
          classId={classId}
        />
      )}

      {/* Modals */}
      {studentRefId && (
        <ReportCardModal
          studentId={studentRefId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      <AiStudyTutorModal
        material={selectedMaterialForAi}
        initialTab={aiTutorInitialTab}
        initialQuestion={aiTutorInitialQuestion}
        isOpen={aiTutorModalOpen}
        onClose={() => {
          setAiTutorModalOpen(false)
          setSelectedMaterialForAi(null)
          setAiTutorInitialQuestion('')
        }}
      />
    </div>
  )
}