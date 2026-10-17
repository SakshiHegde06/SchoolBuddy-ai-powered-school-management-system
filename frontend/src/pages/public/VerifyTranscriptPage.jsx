import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { reportService } from '../../services/reportService'
import ReportCardModal from '../../components/reports/ReportCardModal'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Award,
  Calendar,
  School,
  FileCheck,
  Loader2,
  ExternalLink,
  Printer,
} from 'lucide-react'

export default function VerifyTranscriptPage() {
  const { code } = useParams()
  const [transcript, setTranscript] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!code) return

    setIsLoading(true)
    setError(null)

    reportService
      .verifyTranscript(code)
      .then((res) => {
        setTranscript(res.data)
      })
      .catch((err) => {
        console.error('Verification error:', err)
        setError('This transcript verification code was not found or is invalid.')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [code])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <ShieldCheck size={14} />
          <span>Official Public Academic Credential Verification</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Transcript Verification Portal
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Verify authentic academic records issued by SchoolBuddy Management Systems.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="max-w-xl mx-auto w-full">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-12 text-center backdrop-blur shadow-2xl flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-slate-300">
              Validating cryptographic record with registry…
            </p>
          </div>
        ) : error || !transcript ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center backdrop-blur shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300">Verification Failed</h2>
              <p className="text-xs text-rose-200/80 mt-1">
                {error || 'Invalid credential verification code.'}
              </p>
            </div>
            <p className="text-xs text-slate-500 font-mono">Code: {code}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-800/80 p-8 text-left backdrop-blur-md shadow-2xl space-y-6">
            {/* Authenticity Badge */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Officially Verified Record
                  </div>
                  <h2 className="text-xl font-bold text-white mt-0.5">{transcript.studentName}</h2>
                </div>
              </div>

              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300">
                {transcript.verificationCode}
              </span>
            </div>

            {/* Credential Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Cohort</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {transcript.className} (Section {transcript.section})
                </span>
                <span className="text-[10px] text-slate-500">{transcript.academicYear}</span>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                <span className="font-bold text-base text-emerald-400 mt-0.5 block">
                  {transcript.totalMarksObtained} / {transcript.totalMaxMarks}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {transcript.overallPercentage}% (Grade {transcript.overallGrade})
                </span>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Academic Standing</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {transcript.academicStanding}
                </span>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-slate-700/50">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">
                  {transcript.attendancePercentage}% ({transcript.attendanceStatus})
                </span>
              </div>
            </div>

            {/* Institution Issuer */}
            <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-700/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <School size={18} className="text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-slate-200">{transcript.schoolName}</div>
                  <div className="text-[10px] text-slate-400">{transcript.schoolAffiliation}</div>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                Issued {transcript.issueDate}
              </div>
            </div>

            {/* Modal & Print Trigger */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg transition"
              >
                <FileCheck size={16} />
                <span>View Full Marks Card</span>
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-1.5 border border-slate-700 hover:bg-slate-700/50 text-slate-300 font-medium text-xs py-3 px-4 rounded-xl transition"
              >
                <span>Back to Portal</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto w-full text-center text-xs text-slate-500 mt-8">
        Secured by SchoolBuddy Verification Protocol • Cryptographic Signature Certified
      </div>

      {/* Full Report Card Modal */}
      {transcript?.studentId && (
        <ReportCardModal
          studentId={transcript.studentId}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}
