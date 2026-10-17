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
} from 'lucide-react'
import Spinner from '../common/Spinner'
import Badge from '../common/Badge'
import { studyMaterialService } from '../../services/studyMaterialService'

export default function AiStudyTutorModal({
  material,
  initialTab = 'TOPICS',
  isOpen,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cached data for each tab to avoid refetching
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

  useEffect(() => {
    if (isOpen && material) {
      // Pre-populate initial greeting if chat is empty
      if (chatMessages.length === 0) {
        setChatMessages([
          {
            role: 'tutor',
            text: `Hello! I am your **SchoolBuddy AI Study Tutor** for **${material.title}** (${material.subjectName || 'Academics'}).\n\nI can help you break down complex concepts, understand 5-mark and 10-mark exam expectations, test you with MCQs, or answer any academic doubt! What would you like to focus on today?`,
            followUps: [
              'Explain the core mechanism in simple steps',
              'Give me 3 memory mnemonics for this topic',
              'What are the most common exam traps here?',
            ],
          },
        ])
      }
      fetchTabData(activeTab)
    }
  }, [isOpen, material, activeTab])

  if (!isOpen || !material) return null

  async function fetchTabData(mode) {
    // If already loaded, skip network request
    if (mode === 'TOPICS' && topicsData) return
    if (mode === 'MCQ' && mcqData) return
    if (mode === '5M' && fiveMData) return
    if (mode === '10M' && tenMData) return
    if (mode === 'CHAT') return

    setLoading(true)
    setError(null)
    try {
      const res = await studyMaterialService.getAiTutor(material.id, {
        mode,
        topic: material.title,
        subject: material.subjectName || 'General Studies',
      })

      const data = res.data
      if (mode === 'TOPICS') setTopicsData(data)
      else if (mode === 'MCQ') setMcqData(data)
      else if (mode === '5M') setFiveMData(data)
      else if (mode === '10M') setTenMData(data)
    } catch (err) {
      console.error('Failed to load AI Tutor data:', err)
      setError('Unable to load AI analysis right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectOption(questionId, optionIndex) {
    if (selectedAnswers[questionId] !== undefined) return // prevent changing once chosen
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
    setChatLoading(true)

    try {
      const res = await studyMaterialService.getAiTutor(material.id, {
        mode: 'CHAT',
        query: textToSend,
        topic: material.title,
        subject: material.subjectName || 'General Studies',
      })

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

  // Calculate MCQ score
  const mcqs = mcqData?.mcqs || []
  const totalAnswered = Object.keys(selectedAnswers).length
  const correctCount = mcqs.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctOptionIndex ? acc + 1 : acc
  }, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-3 sm:p-6 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-paper-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-paper-200 bg-gradient-to-r from-navy-900 to-navy-800 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-semibold tracking-wide text-white">
                  SchoolBuddy AI Study Tutor
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  Academic Guardrails Active
                </span>
              </div>
              <p className="text-xs text-paper-200/80">
                {material.title} &bull;{' '}
                <span className="text-amber-300 font-medium">
                  {material.subjectName || 'Curriculum Subject'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              title="Print / Save as PDF"
              className="rounded-lg p-2 text-paper-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-paper-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-paper-200 bg-paper-50 px-6 overflow-x-auto scrollbar-none">
          {[
            { id: 'TOPICS', label: 'Important Topics', icon: BookOpen, badge: 'Bullet Points' },
            { id: 'MCQ', label: 'Practice MCQs', icon: CheckCircle2, badge: '5 Questions' },
            { id: '5M', label: '5-Mark Questions', icon: FileQuestion, badge: 'High Yield' },
            { id: '10M', label: '10-Mark Questions', icon: Award, badge: 'Comprehensive' },
            { id: 'CHAT', label: 'Ask AI Tutor', icon: Sparkles, badge: 'Study Doubt' },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-navy-900 text-navy-900 bg-white font-semibold shadow-xs'
                    : 'border-transparent text-ink-600 hover:text-navy-900 hover:border-paper-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-ink-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-navy-900 text-white'
                      : 'bg-paper-200 text-ink-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-paper-50/50">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Spinner size="lg" />
              <p className="mt-4 font-display text-base font-medium text-navy-900">
                AI analyzing study material & generating curriculum questions…
              </p>
              <p className="mt-1 text-xs text-ink-400">
                Analyzing core definitions, exam rubrics, and syllabus weightage
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-danger-100 bg-danger-100/30 p-4 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-danger-600 mb-2" />
              <p className="text-sm font-medium text-danger-600">{error}</p>
              <button
                onClick={() => fetchTabData(activeTab)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-600/90"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Retry Analysis
              </button>
            </div>
          )}

          {/* TAB 1: IMPORTANT TOPICS IN BULLET POINTS */}
          {!loading && !error && activeTab === 'TOPICS' && topicsData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-paper-200 bg-white p-4 shadow-xs">
                <div>
                  <h4 className="font-display text-base font-semibold text-navy-900">
                    Syllabus Key Topics & Revision Highlights
                  </h4>
                  <p className="text-xs text-ink-600">
                    Curated core topics extracted from {material.title} for rapid exam revision
                  </p>
                </div>
                <button
                  onClick={() => {
                    const text = [
                      `Study Guide: ${material.title} (${material.subjectName})`,
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-100 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-paper-200 transition-colors"
                >
                  {copiedSection === 'topics' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success-600" />
                      <span className="text-success-600">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-ink-600" />
                      <span>Copy Full Topic Notes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bullet Points Section */}
              <div className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    1
                  </span>
                  <h5 className="font-display text-sm font-semibold text-navy-900">
                    Important Curriculum Topics (Bullet Points)
                  </h5>
                </div>
                <ul className="space-y-2.5">
                  {(topicsData.keyTopics || []).map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-ink-900">
                      <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Core Definitions */}
              <div className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-100 text-navy-800 text-xs font-bold">
                    2
                  </span>
                  <h5 className="font-display text-sm font-semibold text-navy-900">
                    Core Definitions & Technical Terminology
                  </h5>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(topicsData.coreDefinitions || []).map((def, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-paper-200 bg-paper-50 p-3.5 text-xs text-ink-900 leading-relaxed"
                    >
                      <span className="font-bold text-navy-900 block mb-1">
                        Concept #{idx + 1}
                      </span>
                      {def}
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulas & Governing Rules */}
              <div className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    3
                  </span>
                  <h5 className="font-display text-sm font-semibold text-navy-900">
                    Key Formulas, Theorems & Governing Rules
                  </h5>
                </div>
                <div className="space-y-2">
                  {(topicsData.keyFormulasOrRules || []).map((formula, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-lg border border-paper-200 bg-paper-50 px-4 py-2.5 font-mono-data text-xs text-navy-900 font-medium"
                    >
                      <span className="rounded bg-paper-200 px-1.5 py-0.5 text-[10px] text-ink-600 font-bold">
                        RULE {idx + 1}
                      </span>
                      <span className="flex-1">{formula}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Yield Exam Focus & Pitfalls */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2 mb-2 text-amber-800">
                    <Lightbulb className="h-4 w-4" />
                    <h6 className="font-display text-xs font-bold uppercase tracking-wider">
                      High-Yield Exam Focus Points
                    </h6>
                  </div>
                  <ul className="space-y-2 text-xs text-ink-900">
                    {(topicsData.examFocusPoints || []).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-danger-100 bg-danger-100/20 p-4">
                  <div className="flex items-center gap-2 mb-2 text-danger-600">
                    <AlertTriangle className="h-4 w-4" />
                    <h6 className="font-display text-xs font-bold uppercase tracking-wider">
                      Common Traps & Mistakes to Avoid
                    </h6>
                  </div>
                  <ul className="space-y-2 text-xs text-ink-900">
                    {(topicsData.commonPitfalls || []).map((pf, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-danger-600 font-bold">•</span>
                        <span>{pf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE PRACTICE MCQS */}
          {!loading && !error && activeTab === 'MCQ' && mcqData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Score Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-paper-200 bg-white p-4 shadow-xs">
                <div>
                  <h4 className="font-display text-base font-semibold text-navy-900">
                    Interactive Multiple Choice Practice
                  </h4>
                  <p className="text-xs text-ink-600">
                    Select an option for instant answer verification and pedagogical explanation
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-ink-400 block">Progress</span>
                    <span className="font-display text-sm font-bold text-navy-900">
                      {totalAnswered} / {mcqs.length} Answered
                    </span>
                  </div>

                  {totalAnswered > 0 && (
                    <div className="rounded-lg bg-emerald-50 px-3 py-1.5 border border-emerald-200 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        Score
                      </span>
                      <span className="font-display text-base font-bold text-emerald-700">
                        {correctCount} / {mcqs.length}
                      </span>
                    </div>
                  )}

                  {totalAnswered > 0 && (
                    <button
                      onClick={handleResetQuiz}
                      className="inline-flex items-center gap-1 rounded-lg border border-paper-200 bg-paper-100 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-paper-200 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" /> Retake
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
                      className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-white text-xs font-bold shrink-0">
                            {qIndex + 1}
                          </span>
                          <p className="font-medium text-navy-900 text-sm leading-snug">
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
                            'border-paper-200 bg-paper-50 hover:bg-paper-100 text-ink-900'

                          if (hasAnswered) {
                            if (isTheCorrectOption) {
                              buttonStyle =
                                'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                            } else if (isSelected && !isCorrect) {
                              buttonStyle =
                                'border-danger-600 bg-danger-100/40 text-danger-900 font-semibold ring-1 ring-danger-600'
                            } else {
                              buttonStyle = 'border-paper-200 bg-paper-50 text-ink-400 opacity-60'
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={hasAnswered}
                              onClick={() => handleSelectOption(q.id, optIndex)}
                              className={`flex items-center gap-3 rounded-lg border p-3 text-left text-xs transition-all ${buttonStyle}`}
                            >
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs shrink-0 ${
                                  hasAnswered && isTheCorrectOption
                                    ? 'bg-emerald-600 text-white'
                                    : hasAnswered && isSelected && !isCorrect
                                    ? 'bg-danger-600 text-white'
                                    : 'bg-paper-200 text-navy-900'
                                }`}
                              >
                                {optionLetter}
                              </span>
                              <span className="flex-1">{opt}</span>

                              {hasAnswered && isTheCorrectOption && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              )}
                              {hasAnswered && isSelected && !isCorrect && (
                                <XCircle className="h-4 w-4 text-danger-600 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {hasAnswered && (
                        <div
                          className={`mt-4 rounded-lg p-3 text-xs leading-relaxed border ${
                            isCorrect
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : 'bg-paper-100 border-paper-200 text-ink-900'
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

          {/* TAB 3: 5-MARK QUESTIONS WITH MODEL ANSWERS */}
          {!loading && !error && activeTab === '5M' && fiveMData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-paper-200 bg-white p-4 shadow-xs">
                <div>
                  <h4 className="font-display text-base font-semibold text-navy-900">
                    High-Yield 5-Mark Exam Questions & Answers
                  </h4>
                  <p className="text-xs text-ink-600">
                    Targeted short/conceptual questions formatted for full marks with step-marking rubrics
                  </p>
                </div>
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-100 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-paper-200 transition-colors"
                >
                  {copiedSection === '5m' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success-600" />
                      <span className="text-success-600">Copied All 5M Questions!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-ink-600" />
                      <span>Copy All 5M Q&A</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-5">
                {(fiveMData.fiveMarkQuestions || []).map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-900 text-white text-xs font-bold shrink-0">
                          Q{idx + 1}
                        </span>
                        <h5 className="font-display text-sm font-semibold text-navy-900 leading-snug">
                          {q.question}
                        </h5>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200 shrink-0">
                        5 Marks
                      </span>
                    </div>

                    {/* Key points expected */}
                    {q.keyPoints && q.keyPoints.length > 0 && (
                      <div className="rounded-lg bg-paper-50 p-3 border border-paper-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-600 block mb-1.5">
                          Key Evaluation Points Looked by Examiners:
                        </span>
                        <ul className="space-y-1 text-xs text-ink-900">
                          {q.keyPoints.map((kp, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{kp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Model Answer */}
                    <div className="rounded-lg border border-paper-200 bg-white p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-navy-900 tracking-wider">
                          Full Model Answer (Top-Score Formatting):
                        </span>
                        <button
                          onClick={() => copyToClipboard(q.modelAnswer, `5m-${idx}`)}
                          className="text-[11px] text-ink-600 hover:text-navy-900 flex items-center gap-1"
                        >
                          {copiedSection === `5m-${idx}` ? (
                            <Check className="h-3 w-3 text-success-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy Answer</span>
                        </button>
                      </div>
                      <div className="whitespace-pre-line text-xs text-ink-900 leading-relaxed font-body">
                        {q.modelAnswer}
                      </div>
                    </div>

                    {/* Marking Scheme & Exam Tip Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-paper-200 pt-3 text-xs text-ink-600">
                      <span className="font-medium text-navy-900">
                        Rubric:{' '}
                        <span className="text-ink-600 font-normal">
                          {q.markingRubric}
                        </span>
                      </span>
                      {q.examTip && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200">
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

          {/* TAB 4: 10-MARK QUESTIONS WITH MARKING RUBRICS */}
          {!loading && !error && activeTab === '10M' && tenMData && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-paper-200 bg-white p-4 shadow-xs">
                <div>
                  <h4 className="font-display text-base font-semibold text-navy-900">
                    Comprehensive 10-Mark Essay & Analytical Questions
                  </h4>
                  <p className="text-xs text-ink-600">
                    In-depth questions with multi-section structured answers, diagrams, and section-by-section rubrics
                  </p>
                </div>
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-100 px-3 py-1.5 text-xs font-medium text-navy-900 hover:bg-paper-200 transition-colors"
                >
                  {copiedSection === '10m' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success-600" />
                      <span className="text-success-600">Copied All 10M Questions!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-ink-600" />
                      <span>Copy All 10M Q&A</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {(tenMData.tenMarkQuestions || []).map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="rounded-xl border border-paper-200 bg-white p-5 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-white text-xs font-bold shrink-0">
                          Q{idx + 1}
                        </span>
                        <h5 className="font-display text-sm font-semibold text-navy-900 leading-snug">
                          {q.question}
                        </h5>
                      </div>
                      <span className="rounded-full bg-navy-900 px-3 py-0.5 text-xs font-bold text-white shrink-0">
                        10 Marks
                      </span>
                    </div>

                    {/* Expected section marks breakdown */}
                    {q.keyPoints && q.keyPoints.length > 0 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.keyPoints.map((kp, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-paper-200 bg-paper-50 p-2.5 text-xs text-navy-900 font-medium flex items-center gap-2"
                          >
                            <span className="h-2 w-2 rounded-full bg-navy-900" />
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Model Answer */}
                    <div className="rounded-lg border border-paper-200 bg-paper-50/40 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-navy-900 tracking-wider">
                          Comprehensive 10-Mark Model Answer Structure:
                        </span>
                        <button
                          onClick={() => copyToClipboard(q.modelAnswer, `10m-${idx}`)}
                          className="text-[11px] text-ink-600 hover:text-navy-900 flex items-center gap-1"
                        >
                          {copiedSection === `10m-${idx}` ? (
                            <Check className="h-3 w-3 text-success-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>Copy Model Answer</span>
                        </button>
                      </div>
                      <div className="whitespace-pre-line text-xs text-ink-900 leading-relaxed font-body">
                        {q.modelAnswer}
                      </div>
                    </div>

                    <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-200 text-xs text-ink-900 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-navy-900">
                        Marking Scheme Breakdown:{' '}
                        <span className="font-normal text-ink-600">
                          {q.markingRubric}
                        </span>
                      </span>
                      {q.examTip && (
                        <span className="text-amber-800 font-medium">
                          Tip: {q.examTip}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ASK AI STUDY TUTOR (STRICT ACADEMIC CHAT) */}
          {activeTab === 'CHAT' && (
            <div className="flex flex-col h-full max-w-4xl mx-auto space-y-4">
              {/* Guardrail Banner */}
              <div className="flex items-center gap-2 rounded-lg bg-navy-900/5 border border-navy-900/10 px-4 py-2.5 text-xs text-navy-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Academic Guardrail Active:</strong> This tutor is strictly dedicated to syllabus concepts, homework doubts, formulas, and examination strategies.
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
                          ? 'bg-navy-900 text-white rounded-br-none'
                          : 'bg-white border border-paper-200 text-ink-900 shadow-xs rounded-bl-none'
                      }`}
                    >
                      {msg.role === 'tutor' && (
                        <div className="flex items-center gap-1.5 mb-2 text-amber-600 font-bold text-[11px] uppercase tracking-wider">
                          <Brain className="h-3.5 w-3.5" />
                          <span>SchoolBuddy AI Tutor</span>
                        </div>
                      )}

                      {/* If guardrail notice present */}
                      {msg.guardrailNotice && (
                        <div className="mb-2 rounded bg-amber-50 p-2 text-amber-800 border border-amber-200 text-[11px]">
                          {msg.guardrailNotice}
                        </div>
                      )}

                      <div className="whitespace-pre-line font-body">{msg.text}</div>

                      {/* Follow-up prompt chips */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-paper-200/80">
                          <span className="text-[10px] font-bold text-ink-400 uppercase tracking-wider block mb-1.5">
                            Suggested Study Questions:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, fIdx) => (
                              <button
                                key={fIdx}
                                onClick={() => handleSendChat(fu)}
                                className="rounded-full bg-paper-100 hover:bg-paper-200 border border-paper-200 px-2.5 py-1 text-[11px] text-navy-900 font-medium transition-colors text-left flex items-center gap-1"
                              >
                                <span>{fu}</span>
                                <ChevronRight className="h-2.5 w-2.5 text-ink-400" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2 text-xs text-ink-400 pl-2">
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
                className="flex items-center gap-2 rounded-xl border border-paper-200 bg-white p-2 shadow-xs"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask any academic question or doubt about ${material.title}…`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-40 transition-all"
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
