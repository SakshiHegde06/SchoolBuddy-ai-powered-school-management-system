import { useState, useEffect, useRef } from 'react'
import {
  Brain,
  Sparkles,
  Send,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  X,
  ChevronRight,
} from 'lucide-react'
import Spinner from '../common/Spinner'
import { studyMaterialService } from '../../services/studyMaterialService'

const DEFAULT_SUGGESTIONS = [
  'Explain photosynthesis step-by-step',
  'Solve: 2x + 7 = 19 with all steps',
  'What is Newton\'s First Law of Motion?',
  'Explain how chemical reactions work',
]

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

export default function AiStudyTutorModal({
  material = null,
  initialTab = 'CHAT',
  initialQuestion = '',
  isOpen,
  onClose,
}) {
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [copiedSection, setCopiedSection] = useState(null)
  const messagesEndRef = useRef(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, chatLoading])

  function initGreeting() {
    setChatMessages([
      {
        role: 'tutor',
        text: `Hello! I am your **SchoolBuddy Academic AI Tutor**.\n\nYou can ask me any question about your school subjects, syllabus, homework, mathematics problems, science concepts, or exam doubts. I will give you clear, step-by-step answers and explanations.\n\nWhat would you like to ask?`,
        followUps: DEFAULT_SUGGESTIONS,
      },
    ])
  }

  useEffect(() => {
    if (isOpen) {
      initGreeting()
      if (initialQuestion && initialQuestion.trim()) {
        setTimeout(() => {
          handleSendChat(initialQuestion.trim())
        }, 120)
      }
    }
  }, [isOpen, initialQuestion])

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
          text: `I am your dedicated SchoolBuddy Academic Study Tutor! I only assist with academic syllabus questions, conceptual doubts, formulas, homework, and exam preparation. Please ask questions related to your school studies!`,
          academic: false,
          guardrailNotice:
            '🔒 Academic Focus Only: Questions outside of studies (games, movies, gossip, jokes, sports) are strictly avoided.',
          followUps: DEFAULT_SUGGESTIONS,
        },
      ])
      return
    }

    setChatLoading(true)
    try {
      const payload = {
        mode: 'CHAT',
        query: textToSend,
        topic: 'Academic Studies',
        subject: 'General',
      }

      const res = material?.id
        ? await studyMaterialService.getAiTutor(material.id, payload)
        : await studyMaterialService.getAiTutorGeneral(payload)

      const reply = res.data
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: reply.chatAnswer || reply.answer || 'Here is the explanation for your question.',
          academic: reply.academic,
          guardrailNotice: reply.guardrailNotice,
          followUps:
            reply.followUpQuestions && reply.followUpQuestions.length > 0
              ? reply.followUpQuestions
              : DEFAULT_SUGGESTIONS,
        },
      ])
    } catch (err) {
      console.error('Failed to query AI Tutor:', err)
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'tutor',
          text: 'I encountered an issue connecting to the AI Tutor service. Please verify your question and try again.',
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

  function handleResetChat() {
    setChatInput('')
    initGreeting()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Clean Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                  SchoolBuddy Academic AI Tutor
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" />
                  Academic Guardrails
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ask any question on any academic topic to get instant step-by-step explanations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              title="Reset conversation"
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Guardrail notice strip */}
        <div className="bg-indigo-50/80 border-b border-indigo-100 px-6 py-2.5 text-xs text-indigo-900 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Instant Academic Q&A:</strong> Ask anything about your school syllabus, formulas, concepts, or homework to receive clear explanations.
          </span>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'student' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'student'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs rounded-bl-none'
                }`}
              >
                {msg.role === 'tutor' && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs">
                      <Brain className="h-4 w-4" />
                      <span>SchoolBuddy AI Tutor</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(msg.text, `msg-${idx}`)}
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                      title="Copy explanation"
                    >
                      {copiedSection === `msg-${idx}` ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {msg.guardrailNotice && (
                  <div className="mb-2 rounded-lg bg-amber-50 p-2.5 text-amber-800 border border-amber-200 text-xs">
                    {msg.guardrailNotice}
                  </div>
                )}

                <div className="whitespace-pre-line font-sans">{msg.text}</div>

                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Suggested Academic Questions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.followUps.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendChat(fu)}
                          className="rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{fu}</span>
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500 pl-2 py-2">
              <Spinner size="sm" />
              <span>AI Tutor is formulating your answer…</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendChat()
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-slate-50/50 p-1.5 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask any academic question (e.g. Explain photosynthesis, Solve 2x + 5 = 15)..."
              className="flex-1 bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-all cursor-pointer shadow-sm shadow-indigo-600/20 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span>Ask Tutor</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
