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

  // AI Tutor Modal state
  const [aiTutorModalOpen, setAiTutorModalOpen] = useState(false)
  const [selectedMaterialForAi, setSelectedMaterialForAi] = useState(null)
  const [aiTutorInitialTab, setAiTutorInitialTab] = useState('MCQ')
  const [downloadingId, setDownloadingId] = useState(null)

  // Auto-resolve student ID if missing on the user auth object
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
    // Fallback if class materials list is freshly initialized
    return [
      {
        id: 'mat-math-core',
        title: 'Core Curriculum: Algebra & Geometry Notes',
        subjectName: 'Mathematics',
        type: 'PDF',
        originalFileName: 'algebra_geometry_notes.pdf',
        fileSize: 450000,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'mat-sci-core',
        title: 'Core Curriculum: Physics & Chemical Reactions',
        subjectName: 'Science',
        type: 'PDF',
        originalFileName: 'physics_chemistry_notes.pdf',
        fileSize: 520000,
        uploadedAt: new Date().toISOString(),
      },
    ]
  }, [rawMaterials])

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

  // Open AI Study Tutor modal for a given topic or material
  function handleOpenAiTutor(material = null, tab = 'MCQ') {
    const targetMaterial =
      material ||
      (studyMaterials && studyMaterials.length > 0 ? studyMaterials[0] : null) || {
        id: 'general-studies',
        title: 'Core Curriculum & Exam Preparation',
        subjectName: 'General Academics',
      }
    setSelectedMaterialForAi(targetMaterial)
    setAiTutorInitialTab(tab)
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
    <div className="space-y-8 pb-12">
      {/* ======================================================== */}
      {/* 1. EXECUTIVE WELCOME BANNER (PROFESSIONAL & SLEEK)       */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-7 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 h-56 w-56 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-3 border border-indigo-400/30">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <span>Student Workspace • {profile?.grade ? `Grade ${profile.grade}` : 'Active Session'}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Track your certified coursework, subject-wise attendance (min 75%),
              and launch your <strong>Curriculum AI Study Tutor</strong> for instant practice quizzes,
              important formulas, and 5M/10M exam answer preparation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-all cursor-pointer"
            >
              <Award className="h-4 w-4 text-amber-400" />
              <span>Official Academic Transcript</span>
            </button>
            <button
              onClick={() => handleOpenAiTutor(null, 'CHAT')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Ask AI Tutor</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ⚡ PROMINENT AI QUIZ & REVISION NOTES HUB BANNER ⚡    */}
      {/* ======================================================== */}
      <div className="rounded-3xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 p-6 sm:p-7 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-amber-200/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display text-xl font-bold text-slate-900">
                  AI Quiz & Revision Notes Generator Hub
                </h2>
                <span className="rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-bold text-amber-900 border border-amber-300/80">
                  ⚡ Live Academic AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Practice topic MCQs with instant checks, generate bullet revision notes, or prepare 5M & 10M exam answers.
              </p>
            </div>
          </div>

          <Link
            to="/student/materials"
            className="inline-flex items-center gap-1.5 self-start md:self-center text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl transition"
          >
            <span>All Study Materials</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 5 One-Click AI Tutor Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: MCQs */}
          <button
            onClick={() => handleOpenAiTutor(null, 'MCQ')}
            className="group flex flex-col justify-between rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-3 group-hover:scale-105 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Practice Quiz (MCQs)
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Interactive MCQs with answer checks, explanations & live score tracking.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              Start Quiz &rarr;
            </span>
          </button>

          {/* Card 2: Key Topics & Formulas */}
          <button
            onClick={() => handleOpenAiTutor(null, 'TOPICS')}
            className="group flex flex-col justify-between rounded-2xl border border-amber-200 bg-white p-4 text-left shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                Key Notes & Topics
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Structured bullet points, core definitions, and formulas for rapid review.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
              Generate Notes &rarr;
            </span>
          </button>

          {/* Card 3: 5M Exam Questions */}
          <button
            onClick={() => handleOpenAiTutor(null, '5M')}
            className="group flex flex-col justify-between rounded-2xl border border-sky-200 bg-white p-4 text-left shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700 mb-3 group-hover:scale-105 transition-transform">
                <FileQuestion className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                5-Mark Questions
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Medium exam questions with structured model answers & step scoring.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600">
              View 5M Prep &rarr;
            </span>
          </button>

          {/* Card 4: 10M Exam Questions */}
          <button
            onClick={() => handleOpenAiTutor(null, '10M')}
            className="group flex flex-col justify-between rounded-2xl border border-indigo-200 bg-white p-4 text-left shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 mb-3 group-hover:scale-105 transition-transform">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                10-Mark In-Depth
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Comprehensive questions with essay outlines & official marking rubrics.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700">
              View 10M Prep &rarr;
            </span>
          </button>

          {/* Card 5: Ask AI Tutor */}
          <button
            onClick={() => handleOpenAiTutor(null, 'CHAT')}
            className="group flex flex-col justify-between rounded-2xl border border-purple-200 bg-white p-4 text-left shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Ask AI Tutor
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-snug">
                Academic tutor with guardrails. Answers syllabus questions 24/7.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-purple-700">
              Start Conversation &rarr;
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. RECENT STUDY MATERIALS WITH FRONT-OF-PDF AI BUTTONS   */}
      {/* ======================================================== */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Course Study Materials & AI Study Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch quizzes, bullet notes, and 5M/10M exam answers directly from any document below.
            </p>
          </div>
          <Link
            to="/student/materials"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All ({studyMaterials.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {materialsLoading ? (
          <Spinner label="Loading study materials..." />
        ) : studyMaterials.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No study materials posted for your class yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {studyMaterials.slice(0, 3).map((material) => (
              <div
                key={material.id}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:border-indigo-300 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {material.subjectName || 'Curriculum'}
                      </span>
                      <Badge tone={material.type === 'PDF' ? 'neutral' : 'success'}>
                        {material.type === 'PDF' ? 'PDF' : 'Link'}
                      </Badge>
                      <span className="text-[11px] text-slate-400">
                        {material.uploadedAt
                          ? new Date(material.uploadedAt).toLocaleDateString()
                          : 'Recent'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {material.title}
                    </h4>
                  </div>

                  {/* Front-of-PDF Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenAiTutor(material, 'MCQ')}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Quiz (MCQs)</span>
                    </button>
                    <button
                      onClick={() => handleOpenAiTutor(material, 'TOPICS')}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-amber-700" />
                      <span>Key Notes</span>
                    </button>
                    <button
                      onClick={() => handleOpenAiTutor(material, '5M')}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-1.5 text-xs font-semibold text-sky-900 transition-colors cursor-pointer"
                    >
                      <FileQuestion className="h-3.5 w-3.5 text-sky-700" />
                      <span>5M/10M</span>
                    </button>
                    {material.type === 'PDF' && (
                      <button
                        onClick={() => handleDownload(material)}
                        disabled={downloadingId === material.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-white" />
                        <span>{downloadingId === material.id ? 'Saving…' : 'PDF'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnnouncementsWidget limit={3} title="Latest Announcements" />

      {/* ======================================================== */}
      {/* 4. PROFESSIONAL STATS GRID (CLEAN EXECUTIVE METRICS)     */}
      {/* ======================================================== */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Card 1: Subject-Wise Attendance Compliance */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                Subject Attendance (≥75% Rule)
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {totalSubjectsWithAttendance > 0
                  ? `${subjectsMeetingRequirement}/${totalSubjectsWithAttendance}`
                  : 'Compliant'}
              </h3>
              <div className="mt-2">
                {hasAttendanceShortage ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    <AlertTriangle size={13} /> Shortage in 1+ subjects
                  </span>
                ) : totalSubjectsWithAttendance > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 size={13} /> All subjects ≥ 75%
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Requires ≥ 75% per subject
                  </span>
                )}
              </div>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${hasAttendanceShortage ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <ClipboardCheck size={26} />
            </div>
          </div>
        </div>

        {/* Card 2: Cumulative Average Marks */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                Cumulative Exam Average
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-900">
                {averageMarksPct !== null ? `${averageMarksPct}%` : 'N/A'}
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                {marks?.length
                  ? `Evaluated across ${marks.length} recorded exam(s)`
                  : 'No graded exams recorded yet'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <BookOpen size={26} />
            </div>
          </div>
        </div>

        {/* Card 3: AI Exam Readiness */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                Curriculum AI Readiness
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-indigo-600">
                Active
              </h3>
              <p className="mt-2 text-xs text-slate-500">
                MCQs, 5M & 10M Rubrics generated
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <Brain size={26} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. ACADEMIC PERFORMANCE & MARKS SECTION                  */}
      {/* ======================================================== */}
      <Card title="Academic Performance & Exam Results">
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

      {/* Everyday Attendance Logbook & AI Analytics */}
      <StudentAttendanceLogbook
        studentId={studentRefId}
        classId={classId}
      />

      {/* ======================================================== */}
      {/* 6. TIMETABLE & DETAILED HOMEWORK SECTION                */}
      {/* ======================================================== */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class Timetable */}
        <Card title="Class Timetable">
          {timetableLoading || profileLoading ? (
            <Spinner label="Loading timetable..." />
          ) : !classId ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-sky-50 px-6 text-center">
              <CalendarDays size={52} className="text-blue-400" />
              <p className="mt-4 text-gray-500">
                Your student profile has no class assigned yet.
              </p>
            </div>
          ) : !timetable?.entries?.length ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 px-6 text-center">
              <CalendarDays size={48} className="text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No timetable published for your class yet.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Check back soon! Once your teachers or administrator publish the schedule, it will appear right here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase tracking-wider text-slate-600 border-r border-slate-200 w-36">
                      Time / Period
                    </th>
                    {Array.from({ length: timetable.daysPerWeek || 6 }).map(
                      (_, dayIndex) => (
                        <th
                          key={dayIndex}
                          className="px-4 py-3 text-center font-bold text-xs uppercase tracking-wider text-slate-600 border-r border-slate-200 min-w-[130px]"
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
                      <td className="px-4 py-3 border-r border-slate-200 bg-slate-50/60">
                        <div className="font-bold text-xs text-slate-800">
                          {row.slotLabel}
                        </div>
                        {row.slotLabel !== row.periodName && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            {row.periodName}
                          </div>
                        )}
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
                              className={`px-3 py-2.5 text-center border-r border-slate-200 transition ${
                                cell.isBreak
                                  ? 'bg-amber-50/50'
                                  : isFree
                                  ? 'bg-white'
                                  : 'bg-indigo-50/30'
                              }`}
                            >
                              <div
                                className={`text-xs ${
                                  cell.isBreak
                                    ? 'font-semibold text-amber-800'
                                    : isFree
                                    ? 'text-slate-400 italic'
                                    : 'font-semibold text-slate-800'
                                }`}
                              >
                                {cell.subject}
                              </div>
                              {cell.teacher && (
                                <div className="text-[11px] text-slate-500 mt-0.5">
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

        {/* Detailed Homework Assignments Section */}
        <Card title={`Homework Assignments (${homeworkList?.length || 0})`}>
          {homeworkLoading ? (
            <Spinner label="Loading homework..." />
          ) : !homeworkList || homeworkList.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <FileText size={40} className="mx-auto text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-700">
                No homework due right now
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Great job! You are all caught up with your classroom assignments.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
              {homeworkList.map((hw) => (
                <div
                  key={hw.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">
                      {hw.title}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {subjectName(hw.subjectId)}
                    </span>
                  </div>

                  {hw.description && (
                    <p className="mt-2 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {hw.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700">
                      <Calendar size={13} />
                      <span>
                        Due:{' '}
                        {hw.dueDate
                          ? new Date(
                              hw.dueDate +
                                (hw.dueDate.length === 10 ? 'T00:00:00' : '')
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No deadline'}
                      </span>
                    </div>

                    {hw.attachmentUrls && hw.attachmentUrls.length > 0 && (
                      <a
                        href={hw.attachmentUrls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Download size={13} />
                        <span>Attachment</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI Performance Analysis */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Brain size={28} className="text-indigo-600" />
          <h2 className="text-xl font-bold text-slate-900">
            AI Academic Performance Analysis
          </h2>
        </div>
        {studentRefId && <AiPerformanceAnalysis studentId={studentRefId} />}
      </div>

      {/* Modals */}
      {studentRefId && (
        <ReportCardModal
          studentId={studentRefId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Interactive AI Study Tutor & Quiz Generator Modal */}
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