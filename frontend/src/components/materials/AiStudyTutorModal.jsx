import { useState, useEffect } from 'react'
import {
  Brain,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileQuestion,
  Award,
  Send,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  X,
  Printer,
  ChevronRight,
  Zap,
} from 'lucide-react'
import Spinner from '../common/Spinner'
import Badge from '../common/Badge'
import { studyMaterialService } from '../../services/studyMaterialService'

const PRESET_CHAPTERS = {
  Science: [
    'Chemical Reactions & Equations',
    'Acids, Bases & Salts',
    'Motion & Laws of Motion',
    'Photosynthesis & Life Processes',
    'Electricity, Current & Ohm\'s Law',
    'Cell Structure & Tissues',
    'Light: Reflection & Refraction',
    'Periodic Table & Metals',
    'Work, Energy & Power',
  ],
  Mathematics: [
    'Quadratic Equations & Roots',
    'Triangles & Thales Theorem',
    'Trigonometric Identities & Heights',
    'Coordinate Geometry & Distance Formula',
    'Arithmetic Progressions (AP)',
    'Statistics & Probability',
    'Polynomials & Real Numbers',
  ],
  'Social Studies': [
    'The Constitution of India & Rights',
    'The Revolt of 1857 & Freedom Movement',
    'Democratic Politics & Federalism',
    'Natural Resources, Soils & Agriculture',
    'Nationalism in Europe & India',
  ],
  English: [
    'Active and Passive Voice',
    'Direct & Indirect Speech',
    'Tenses & Subject-Verb Agreement',
    'Poetic Devices & Literary Devices',
    'Reading Comprehension & Critical Analysis',
  ],
  'Computer Science': [
    'Python Programming & Control Loops',
    'Relational Databases & SQL Queries',
    'Data Structures & Algorithms',
    'Computer Networking & Cyber Security',
  ],
}

export default function AiStudyTutorModal({
  material,
  initialTab = 'MCQ',
  isOpen,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Subject and Topic Studio state (100% student controlled)
  const [selectedSubject, setSelectedSubject] = useState(
    material?.subjectName || 'Science'
  )
  const [selectedTopic, setSelectedTopic] = useState(
    material?.title && !material.title.toLowerCase().endsWith('.pdf')
      ? material.title
      : PRESET_CHAPTERS[material?.subjectName || 'Science']?.[0] || 'Motion & Laws of Motion'
  )
  const [topicInput, setTopicInput] = useState(selectedTopic)

  // Cached data for each tab to avoid unrequested calls
  const [topicsData, setTopicsData] = useState(null)
  const [mcqData, setMcqData] = useState(null)
  const [fiveMData, setFiveMData] = useState(null)
  const [tenMData, setTenMData] = useState(null)

  // MCQ interactive state: { [questionId]: selectedOptionIndex }
  const [selectedAnswers, setSelectedAnswers] = useState({})

  // Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Copy feedback state
  const [copiedSection, setCopiedSection] = useState(null)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Sync initial subject & topic when modal opens
  useEffect(() => {
    if (isOpen) {
      const initSub = material?.subjectName || 'Science'
      let initTop = material?.title || ''
      if (!initTop || initTop.toLowerCase().endsWith('.pdf') || initTop.toLowerCase().startsWith('unit')) {
        initTop = PRESET_CHAPTERS[initSub]?.[0] || 'Motion & Laws of Motion'
      }
      setSelectedSubject(initSub)
      setSelectedTopic(initTop)
      setTopicInput(initTop)
      resetTutorData()
      initChatGreeting(initSub, initTop)
    }
  }, [isOpen, material])

  function resetTutorData() {
    setTopicsData(null)
    setMcqData(null)
    setFiveMData(null)
    setTenMData(null)
    setSelectedAnswers({})
    setError(null)
  }

  function initChatGreeting(sub, top) {
    setChatMessages([
      {
        role: 'tutor',
        text: `Hello! I am your **SchoolBuddy AI Study Tutor** for **${top}** (${sub}).\n\nI can generate comprehensive practice MCQs, 5-mark and 10-mark exam questions with rubrics, bullet revision notes, or answer any conceptual doubt whenever you ask. What would you like to prepare?`,
        followUps: [
          `Explain the core mechanism of ${top}`,
          'Give me 3 memory mnemonics for this topic',
          'What are the most common exam traps here?',
        ],
      },
    ])
  }

  function handleSwitchSubject(sub) {
    setSelectedSubject(sub)
    const defaultTopic = PRESET_CHAPTERS[sub]?.[0] || 'Core Concepts'
    setSelectedTopic(defaultTopic)
    setTopicInput(defaultTopic)
    resetTutorData()
    initChatGreeting(sub, defaultTopic)
  }

  const NON_ACADEMIC_PATTERNS = [
    'game', 'gaming', 'fortnite', 'pubg', 'roblox', 'minecraft', 'gta',
    'movie', 'celebrity', 'gossip', 'dating', 'flirt', 'boyfriend', 'girlfriend',
    'joke', 'funny', 'meme', 'song', 'music video', 'pop song', 'rap',
    'crypto', 'bitcoin', 'horoscope', 'zodiac', 'betting', 'gambling',
    'instagram', 'tiktok', 'snapchat', 'youtube shorts', 'influencer'
  ]

  function isNonAcademic(text) {
    if (!text) return false
    const lower = text.toLowerCase()
    return NON_ACADEMIC_PATTERNS.some((pat) => lower.includes(pat))
  }

  function handleSelectPresetChapter(chap) {
    setError(null)
    setSelectedTopic(chap)
    setTopicInput(chap)
    resetTutorData()
    initChatGreeting(selectedSubject, chap)
  }

  function handleApplyCustomTopic() {
    const trimmed = topicInput.trim()
    if (!trimmed) return
    if (isNonAcademic(trimmed)) {
      setError(
        '🔒 Academic Guardrail Active: SchoolBuddy AI Study Tutor is strictly restricted to educational curriculum, syllabus concepts, and exam preparations. Requests outside of academic studies (e.g. video games, entertainment, celebrities, jokes, social media) are not permitted. Please enter a school syllabus topic.'
      )
      return
    }
    setError(null)
    setSelectedTopic(trimmed)
    resetTutorData()
    initChatGreeting(selectedSubject, trimmed)
  }

  if (!isOpen) return null

  // Fetch only on explicit student request
  async function fetchTabData(mode, force = false) {
    if (!force) {
      if (mode === 'TOPICS' && topicsData) return
      if (mode === 'MCQ' && mcqData) return
      if (mode === '5M' && fiveMData) return
      if (mode === '10M' && tenMData) return
    }
    if (mode === 'CHAT') return

    if (mode === 'MCQ') {
      setSelectedAnswers({})
    }

    if (isNonAcademic(selectedTopic)) {
      setError(
        '🔒 Academic Guardrail Active: SchoolBuddy AI Study Tutor is strictly restricted to educational curriculum, syllabus concepts, and exam preparations. Requests outside of academic studies are not permitted.'
      )
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        mode,
        topic: selectedTopic,
        subject: selectedSubject,
      }

      const res = material?.id
        ? await studyMaterialService.getAiTutor(material.id, payload)
        : await studyMaterialService.getAiTutorGeneral(payload)

      const data = res.data
      if (data.academic === false) {
        setError(data.guardrailNotice || 'Academic Guardrail Active: Please enter a curriculum study topic.')
        return
      }

      if (mode === 'TOPICS') setTopicsData(data)
      else if (mode === 'MCQ') setMcqData(data)
      else if (mode === '5M') setFiveMData(data)
      else if (mode === '10M') setTenMData(data)
    } catch (err) {
      console.error('Failed to load AI Tutor data:', err)
      setError('Unable to generate AI questions right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectOption(questionId, optionIndex) {
    if (selectedAnswers[questionId] !== undefined) return
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }))
  }

  function handleResetQuiz() {
    setSelectedAnswers({})
  }

  async function handleSendChat(customText) {
    const textToSend = customText || chatInput
    if (!textToSend || !textToSend.trim() || chatLoading) return

    const studentMsg = { role: 'student', text: textToSend }
    setChatMessages((prev) => [...prev, studentMsg])
    if (!customText) setChatInput('')

    if (isNonAcademic(textToSend)) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: `I am your dedicated SchoolBuddy Academic Study Tutor! I only assist with academic syllabus questions, conceptual doubts, formulas, homework, and exam preparation. Please ask questions related to your syllabus or study subjects!`,
          academic: false,
          guardrailNotice:
            '🔒 Academic Focus Only: Questions outside of studies (games, movies, gossip, jokes, sports) are strictly avoided.',
          followUps: [
            `Explain the core mechanism of ${selectedTopic}`,
            `Give me 3 memory mnemonics for ${selectedTopic}`,
            'What are the most common exam traps here?',
          ],
        },
      ])
      return
    }

    setChatLoading(true)
    try {
      const payload = {
        mode: 'CHAT',
        query: textToSend,
        topic: selectedTopic,
        subject: selectedSubject,
      }

      const res = material?.id
        ? await studyMaterialService.getAiTutor(material.id, payload)
        : await studyMaterialService.getAiTutorGeneral(payload)

      const reply = res.data
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: reply.chatAnswer,
          academic: reply.academic,
          guardrailNotice: reply.guardrailNotice,
          followUps: reply.followUpQuestions || [],
        },
      ])
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: 'I encountered an issue connecting to the AI Tutor service. Please verify your query and try again.',
          academic: true,
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  function copyToClipboard(text, sectionKey) {
    navigator.clipboard.writeText(text)
    setCopiedSection(sectionKey)
    setTimeout(() => setCopiedSection(null), 2500)
  }

  const mcqs = mcqData?.mcqs || []
  const totalAnswered = Object.keys(selectedAnswers).length
  const correctCount = mcqs.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctOptionIndex ? acc + 1 : acc
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full max-h-[94vh] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-3.5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold tracking-tight text-white">
                  SchoolBuddy Curriculum AI Tutor
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  Academic Guardrails
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Active Topic:{' '}
                <span className="text-amber-300 font-bold">{selectedTopic}</span>{' '}
                ({selectedSubject})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print / Save Notes"
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TOPIC & SUBJECT SELECTION STUDIO (STUDENT IN FULL CONTROL) */}
        {/* ======================================================== */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Subject Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Subject:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {[
                  'Science',
                  'Mathematics',
                  'Social Studies',
                  'English',
                  'Computer Science',
                ].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleSwitchSubject(sub)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      selectedSubject === sub
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Topic Input */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Topic / Chapter:
              </span>
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApplyCustomTopic()
                    }
                  }}
                  placeholder="Type any custom chapter…"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleApplyCustomTopic}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer shrink-0"
              >
                Set
              </button>
            </div>
          </div>

          {/* Quick Syllabus Chapter Chips */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Syllabus Chapters:
            </span>
            {(PRESET_CHAPTERS[selectedSubject] || PRESET_CHAPTERS['Science']).map(
              (chap) => (
                <button
                  key={chap}
                  onClick={() => handleSelectPresetChapter(chap)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedTopic === chap
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {chap}
                </button>
              )
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto scrollbar-none">
          {[
            {
              id: 'MCQ',
              label: 'Practice MCQs',
              icon: CheckCircle2,
              badge: mcqData ? `${mcqs.length} Qs` : 'On-Demand',
            },
            {
              id: '5M',
              label: '5-Mark Questions',
              icon: FileQuestion,
              badge: fiveMData ? 'Generated' : 'On-Demand',
            },
            {
              id: '10M',
              label: '10-Mark Questions',
              icon: Award,
              badge: tenMData ? 'Generated' : 'On-Demand',
            },
            {
              id: 'TOPICS',
              label: 'Important Topics',
              icon: BookOpen,
              badge: topicsData ? 'Generated' : 'On-Demand',
            },
            {
              id: 'CHAT',
              label: 'Ask AI Tutor',
              icon: Sparkles,
              badge: 'Live Tutor',
            },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Spinner size="lg" />
              <p className="mt-4 font-display text-base font-bold text-slate-900">
                Generating curriculum questions on "{selectedTopic}" ({selectedSubject})…
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Formulating board-aligned questions, verified answers, and pedagogical scoring rubrics
              </p>
            </div>
          )}

          {error && !loading && (
            <div className={`rounded-2xl border p-6 text-center max-w-lg mx-auto ${
              error.includes('Academic Guardrail') || error.includes('Academic')
                ? 'border-amber-300 bg-amber-50/90 shadow-sm'
                : 'border-rose-200 bg-rose-50'
            }`}>
              {error.includes('Academic Guardrail') || error.includes('Academic') ? (
                <ShieldCheck className="mx-auto h-10 w-10 text-amber-600 mb-2" />
              ) : (
                <AlertTriangle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
              )}
              <h4 className={`text-sm font-bold mb-1 ${
                error.includes('Academic Guardrail') || error.includes('Academic')
                  ? 'text-amber-950 font-display'
                  : 'text-rose-900'
              }`}>
                {error.includes('Academic Guardrail') || error.includes('Academic')
                  ? 'Educational Studies Only'
                  : 'Question Generation Failed'}
              </h4>
              <p className={`text-xs leading-relaxed ${
                error.includes('Academic Guardrail') || error.includes('Academic')
                  ? 'text-amber-800'
                  : 'text-rose-800'
              }`}>{error}</p>
              {!(error.includes('Academic Guardrail') || error.includes('Academic')) && (
                <button
                  onClick={() => fetchTabData(activeTab, true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Try Again
                </button>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: INTERACTIVE PRACTICE MCQS                         */}
          {/* ======================================================== */}
          {!loading && !error && activeTab === 'MCQ' && (
            <>
              {!mcqData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 shadow-sm border border-emerald-200">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 mb-2">
                    {selectedSubject} • {selectedTopic}
                  </span>
                  <h4 className="font-display text-xl font-bold text-slate-900">
                    Practice Multiple Choice Quiz (MCQs)
                  </h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Test your understanding with curriculum-aligned questions on <strong>{selectedTopic}</strong>. Features instant answer verification, score tracking, and detailed pedagogical explanations.
                  </p>
                  <button
                    onClick={() => fetchTabData('MCQ', true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-emerald-600/25 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Practice MCQs on {selectedTopic}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Score Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-slate-900">
                          {selectedTopic}
                        </h4>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {selectedSubject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select an option for instant answer verification and pedagogical explanation
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Progress</span>
                        <span className="font-display text-sm font-bold text-slate-900">
                          {totalAnswered} / {mcqs.length} Answered
                        </span>
                      </div>

                      {totalAnswered > 0 && (
                        <div className="rounded-xl bg-emerald-50 px-3.5 py-1.5 border border-emerald-200 text-center">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                            Score
                          </span>
                          <span className="font-display text-base font-extrabold text-emerald-700">
                            {correctCount} / {mcqs.length}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => fetchTabData('MCQ', true)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Generate a new set of questions"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Regenerate</span>
                      </button>

                      {totalAnswered > 0 && (
                        <button
                          onClick={handleResetQuiz}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <span>Retake</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-5">
                    {mcqs.map((q, qIndex) => {
                      const userAnswer = selectedAnswers[q.id]
                      const hasAnswered = userAnswer !== undefined
                      const isCorrect = userAnswer === q.correctOptionIndex

                      return (
                        <div
                          key={q.id}
                          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-bold shrink-0">
                                {qIndex + 1}
                              </span>
                              <p className="font-semibold text-slate-900 text-sm leading-snug">
                                {q.question}
                              </p>
                            </div>
                            <Badge
                              tone={
                                q.difficulty === 'Hard'
                                  ? 'danger'
                                  : q.difficulty === 'Medium'
                                  ? 'warning'
                                  : 'success'
                              }
                            >
                              {q.difficulty || 'Medium'}
                            </Badge>
                          </div>

                          {/* 4 Options Grid */}
                          <div className="grid gap-2.5 sm:grid-cols-2 mt-4">
                            {q.options.map((opt, optIndex) => {
                              const optionLetter = String.fromCharCode(65 + optIndex)
                              const isSelected = userAnswer === optIndex
                              const isTheCorrectOption = q.correctOptionIndex === optIndex

                              let buttonStyle =
                                'border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-800'

                              if (hasAnswered) {
                                if (isTheCorrectOption) {
                                  buttonStyle =
                                    'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                                } else if (isSelected && !isCorrect) {
                                  buttonStyle =
                                    'border-rose-500 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-500'
                                } else {
                                  buttonStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                                }
                              }

                              return (
                                <button
                                  key={optIndex}
                                  disabled={hasAnswered}
                                  onClick={() => handleSelectOption(q.id, optIndex)}
                                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-xs transition-all cursor-pointer ${buttonStyle}`}
                                >
                                  <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold text-xs shrink-0 ${
                                      hasAnswered && isTheCorrectOption
                                        ? 'bg-emerald-600 text-white'
                                        : hasAnswered && isSelected && !isCorrect
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-200 text-slate-800'
                                    }`}
                                  >
                                    {optionLetter}
                                  </span>
                                  <span className="flex-1">{opt}</span>

                                  {hasAnswered && isTheCorrectOption && (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                  )}
                                  {hasAnswered && isSelected && !isCorrect && (
                                    <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {/* Explanation Reveal */}
                          {hasAnswered && (
                            <div
                              className={`mt-4 rounded-xl p-3.5 text-xs leading-relaxed border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                  : 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                                <span>
                                  {isCorrect ? 'Correct! Detailed Rationale:' : 'Concept Explanation:'}
                                </span>
                              </div>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 2: 5-MARK QUESTIONS WITH MODEL ANSWERS               */}
          {/* ======================================================== */}
          {!loading && !error && activeTab === '5M' && (
            <>
              {!fiveMData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 mb-4 shadow-sm border border-sky-200">
                    <FileQuestion className="h-8 w-8" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-900 mb-2">
                    {selectedSubject} • {selectedTopic}
                  </span>
                  <h4 className="font-display text-xl font-bold text-slate-900">
                    High-Yield 5-Mark Exam Questions
                  </h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Generate standard 5-mark examination questions on <strong>{selectedTopic}</strong>, including step-by-step scoring rubrics, expected examiner evaluation points, and full top-score model answers.
                  </p>
                  <button
                    onClick={() => fetchTabData('5M', true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-sky-600/25 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate 5M Questions on {selectedTopic}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-slate-900">
                          {selectedTopic} (5 Marks)
                        </h4>
                        <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                          {selectedSubject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Targeted short/conceptual questions formatted for full marks with step-marking rubrics
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchTabData('5M', true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Regenerate</span>
                      </button>
                      <button
                        onClick={() => {
                          const text = (fiveMData.fiveMarkQuestions || [])
                            .map(
                              (q, i) =>
                                `Q${i + 1} [5 Marks]: ${q.question}\n\nModel Answer:\n${
                                  q.modelAnswer
                                }\n\nMarking Rubric: ${q.markingRubric}\nExam Tip: ${q.examTip}\n---`
                            )
                            .join('\n\n')
                          copyToClipboard(text, '5m')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedSection === '5m' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied All 5M!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy All Q&A</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {(fiveMData.fiveMarkQuestions || []).map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0">
                              Q{idx + 1}
                            </span>
                            <h5 className="font-display text-sm font-bold text-slate-900 leading-snug">
                              {q.question}
                            </h5>
                          </div>
                          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 border border-sky-200 shrink-0">
                            5 Marks
                          </span>
                        </div>

                        {q.keyPoints && q.keyPoints.length > 0 && (
                          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                              Examiner Step-Marking Breakdown:
                            </span>
                            <ul className="space-y-1 text-xs text-slate-800">
                              {q.keyPoints.map((kp, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-sky-600 font-bold">•</span>
                                  <span>{kp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                              Full Model Answer (Top-Score Formatting):
                            </span>
                            <button
                              onClick={() => copyToClipboard(q.modelAnswer, `5m-${idx}`)}
                              className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedSection === `5m-${idx}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>Copy Answer</span>
                            </button>
                          </div>
                          <div className="whitespace-pre-line text-xs text-slate-800 leading-relaxed font-sans">
                            {q.modelAnswer}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                          <span className="font-medium text-slate-900">
                            Rubric:{' '}
                            <span className="text-slate-600 font-normal">
                              {q.markingRubric}
                            </span>
                          </span>
                          {q.examTip && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200">
                              <Lightbulb className="h-3 w-3 text-amber-600" />
                              {q.examTip}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 3: 10-MARK QUESTIONS WITH DETAILED ESSAYS            */}
          {/* ======================================================== */}
          {!loading && !error && activeTab === '10M' && (
            <>
              {!tenMData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mb-4 shadow-sm border border-indigo-200">
                    <Award className="h-8 w-8" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-900 mb-2">
                    {selectedSubject} • {selectedTopic}
                  </span>
                  <h4 className="font-display text-xl font-bold text-slate-900">
                    Comprehensive 10-Mark Essay & Analytical Questions
                  </h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Generate multi-section 10-mark questions on <strong>{selectedTopic}</strong> featuring complete mathematical derivations, laboratory experimental procedures, and sectional rubric breakdowns.
                  </p>
                  <button
                    onClick={() => fetchTabData('10M', true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-indigo-600/25 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate 10M Questions on {selectedTopic}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-slate-900">
                          {selectedTopic} (10 Marks)
                        </h4>
                        <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          {selectedSubject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        In-depth questions with multi-section structured answers, diagrams, and section-by-section rubrics
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchTabData('10M', true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Regenerate</span>
                      </button>
                      <button
                        onClick={() => {
                          const text = (tenMData.tenMarkQuestions || [])
                            .map(
                              (q, i) =>
                                `Q${i + 1} [10 Marks]: ${q.question}\n\nModel Answer:\n${
                                  q.modelAnswer
                                }\n\nMarking Rubric: ${q.markingRubric}\nExam Tip: ${q.examTip}\n===`
                            )
                            .join('\n\n')
                          copyToClipboard(text, '10m')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedSection === '10m' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied All 10M!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy All Q&A</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {(tenMData.tenMarkQuestions || []).map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold shrink-0">
                              Q{idx + 1}
                            </span>
                            <h5 className="font-display text-sm font-bold text-slate-900 leading-snug">
                              {q.question}
                            </h5>
                          </div>
                          <span className="rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold text-white shrink-0">
                            10 Marks
                          </span>
                        </div>

                        {q.keyPoints && q.keyPoints.length > 0 && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {q.keyPoints.map((kp, i) => (
                              <div
                                key={i}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-medium flex items-center gap-2"
                              >
                                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                                <span>{kp}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase text-slate-900 tracking-wider">
                              Comprehensive 10-Mark Model Answer Structure:
                            </span>
                            <button
                              onClick={() => copyToClipboard(q.modelAnswer, `10m-${idx}`)}
                              className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedSection === `10m-${idx}` ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>Copy Answer</span>
                            </button>
                          </div>
                          <div className="whitespace-pre-line text-xs text-slate-800 leading-relaxed font-sans">
                            {q.modelAnswer}
                          </div>
                        </div>

                        <div className="rounded-xl bg-amber-50/80 p-3.5 border border-amber-200 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            Marking Scheme Breakdown:{' '}
                            <span className="font-normal text-slate-700">
                              {q.markingRubric}
                            </span>
                          </span>
                          {q.examTip && (
                            <span className="text-amber-900 font-semibold">
                              Tip: {q.examTip}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 4: IMPORTANT TOPICS (BULLET POINTS)                  */}
          {/* ======================================================== */}
          {!loading && !error && activeTab === 'TOPICS' && (
            <>
              {!topicsData ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-xl mx-auto">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mb-4 shadow-sm border border-amber-200">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 mb-2">
                    {selectedSubject} • {selectedTopic}
                  </span>
                  <h4 className="font-display text-xl font-bold text-slate-900">
                    Important Curriculum Topics & Bullet Notes
                  </h4>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Generate structured bullet points, core definitions, governing rules/formulas, and examination traps strictly based on <strong>{selectedTopic}</strong>.
                  </p>
                  <button
                    onClick={() => fetchTabData('TOPICS', true)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3 text-sm shadow-md shadow-amber-600/25 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Notes on {selectedTopic}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold text-slate-900">
                          {selectedTopic}
                        </h4>
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                          {selectedSubject}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Curated core topics and formulas for rapid exam revision
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchTabData('TOPICS', true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Regenerate</span>
                      </button>
                      <button
                        onClick={() => {
                          const text = [
                            `Study Guide: ${selectedTopic} (${selectedSubject})`,
                            '\n--- KEY TOPICS ---',
                            ...(topicsData.keyTopics || []).map((t) => `• ${t}`),
                            '\n--- CORE DEFINITIONS ---',
                            ...(topicsData.coreDefinitions || []).map((d) => `• ${d}`),
                            '\n--- FORMULAS & RULES ---',
                            ...(topicsData.keyFormulasOrRules || []).map((f) => `• ${f}`),
                            '\n--- EXAM FOCUS ---',
                            ...(topicsData.examFocusPoints || []).map((e) => `• ${e}`),
                          ].join('\n')
                          copyToClipboard(text, 'topics')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        {copiedSection === 'topics' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Full Notes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                        1
                      </span>
                      <h5 className="font-display text-sm font-bold text-slate-900">
                        Important Curriculum Topics (Bullet Points)
                      </h5>
                    </div>
                    <ul className="space-y-2.5">
                      {(topicsData.keyTopics || []).map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-800">
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
                        2
                      </span>
                      <h5 className="font-display text-sm font-bold text-slate-900">
                        Core Definitions & Technical Terminology
                      </h5>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(topicsData.coreDefinitions || []).map((def, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 leading-relaxed"
                        >
                          <span className="font-bold text-indigo-900 block mb-1">
                            Concept #{idx + 1}
                          </span>
                          {def}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        3
                      </span>
                      <h5 className="font-display text-sm font-bold text-slate-900">
                        Key Formulas, Theorems & Governing Rules
                      </h5>
                    </div>
                    <div className="space-y-2">
                      {(topicsData.keyFormulasOrRules || []).map((formula, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-xs text-slate-900 font-medium"
                        >
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-bold">
                            RULE {idx + 1}
                          </span>
                          <span className="flex-1">{formula}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                      <div className="flex items-center gap-2 mb-2 text-amber-900">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                        <h6 className="font-display text-xs font-bold uppercase tracking-wider">
                          High-Yield Exam Focus Points
                        </h6>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {(topicsData.examFocusPoints || []).map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                      <div className="flex items-center gap-2 mb-2 text-rose-900">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        <h6 className="font-display text-xs font-bold uppercase tracking-wider">
                          Common Traps & Mistakes to Avoid
                        </h6>
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {(topicsData.commonPitfalls || []).map((pf, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold">•</span>
                            <span>{pf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ASK AI STUDY TUTOR (STRICT ACADEMIC CHAT)         */}
          {/* ======================================================== */}
          {activeTab === 'CHAT' && (
            <div className="flex flex-col h-full max-w-4xl mx-auto space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs text-indigo-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Academic Guardrail Active:</strong> Studying <strong>{selectedTopic}</strong> ({selectedSubject}). Ask any syllabus question, formula doubt, or exam query!
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto pr-2 max-h-[50vh]">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.role === 'student' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.role === 'student'
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none'
                      }`}
                    >
                      {msg.role === 'tutor' && (
                        <div className="flex items-center gap-1.5 mb-2 text-indigo-700 font-bold text-[11px] uppercase tracking-wider">
                          <Brain className="h-3.5 w-3.5" />
                          <span>SchoolBuddy AI Tutor</span>
                        </div>
                      )}

                      {msg.guardrailNotice && (
                        <div className="mb-2 rounded-lg bg-amber-50 p-2 text-amber-800 border border-amber-200 text-[11px]">
                          {msg.guardrailNotice}
                        </div>
                      )}

                      <div className="whitespace-pre-line font-sans">{msg.text}</div>

                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Suggested Study Questions:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, fIdx) => (
                              <button
                                key={fIdx}
                                onClick={() => handleSendChat(fu)}
                                className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 text-[11px] text-slate-800 font-medium transition-colors text-left flex items-center gap-1 cursor-pointer"
                              >
                                <span>{fu}</span>
                                <ChevronRight className="h-2.5 w-2.5 text-slate-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 pl-2">
                    <Spinner size="sm" />
                    <span>AI Tutor is analyzing your question...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendChat()
                }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask any question about ${selectedTopic}…`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Ask Tutor</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
