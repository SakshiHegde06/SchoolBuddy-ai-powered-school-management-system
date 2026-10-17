import React, { useState, useEffect } from 'react'
import { reportService } from '../../services/reportService'
import QRCodeSVG from '../common/QRCodeSVG'
import {
  X,
  Printer,
  Copy,
  Check,
  Award,
  Calendar,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react'

export default function ReportCardModal({ studentId, isOpen = true, onClose }) {
  const [transcript, setTranscript] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || !studentId) return

    setIsLoading(true)
    setError(null)
    setCopied(false)

    reportService
      .getTranscript(studentId)
      .then((res) => {
        setTranscript(res.data)
      })
      .catch((err) => {
        console.error('Error fetching marks card:', err)
        setError(err.response?.data?.message || 'No marks have been assigned yet for this student. The marks card will be available once teachers submit exam results (e.g. FA1).')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [isOpen, studentId])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = () => {
    if (transcript?.verificationUrl) {
      navigator.clipboard.writeText(transcript.verificationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/70 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">
              Student Marks Card
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              disabled={isLoading || !transcript}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
              title="Copy verification link"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isLoading || !transcript}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-40 transition"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 print:p-0 print:overflow-visible">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-slate-600">
                Loading student marks card…
              </p>
            </div>
          ) : error || !transcript ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-8 text-center text-amber-800 space-y-3 m-4">
              <AlertCircle className="h-10 w-10 mx-auto text-amber-600" />
              <h3 className="text-base font-bold text-amber-900">Marks Not Yet Assigned</h3>
              <p className="text-xs text-amber-700 max-w-md mx-auto">
                {error || 'Marks have not been recorded yet for this student. The marks card will be generated once teachers submit exam results (e.g. FA1, Mid-term).'}
              </p>
            </div>
          ) : (
            /* Clean, Compact Printable Marks Card */
            <div
              id="printable-report-card"
              className="mx-auto rounded-xl border border-slate-300 bg-white p-5 sm:p-7 text-slate-900 shadow-xs print:shadow-none print:border-slate-400 print:p-6"
            >
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {transcript.schoolName || 'SchoolBuddy Academy'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {transcript.schoolAddress || 'Academic Session Report'}
                </p>

                <div className="mt-2.5 inline-block rounded-md bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                  Student Marks Card • {transcript.academicYear || '2026 - 2027'}
                </div>
              </div>

              {/* Student Details Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-slate-50 p-3.5 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Student Name</span>
                  <span className="font-bold text-sm text-slate-900">{transcript.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Class & Section</span>
                  <span className="font-semibold text-slate-800">
                    Class {transcript.className} {transcript.section ? `(${transcript.section})` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll Number</span>
                  <span className="font-semibold text-slate-800">{transcript.rollNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission No.</span>
                  <span className="font-semibold text-slate-800">{transcript.admissionNumber || '—'}</span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5 border-r border-slate-200 w-12 text-center">#</th>
                      <th className="p-2.5 border-r border-slate-200">Subject</th>
                      <th className="p-2.5 text-center border-r border-slate-200 w-24">Max Marks</th>
                      <th className="p-2.5 text-center border-r border-slate-200 w-28">Marks Obtained</th>
                      <th className="p-2.5 text-center border-r border-slate-200 w-24">Percentage</th>
                      <th className="p-2.5 text-center border-r border-slate-200 w-20">Grade</th>
                      <th className="p-2.5 text-center w-36">Attendance (≥75%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {transcript.subjects?.map((sub, idx) => (
                      <tr key={sub.subjectId || idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center text-slate-400 border-r border-slate-200 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-semibold text-slate-800 border-r border-slate-200">
                          {sub.subjectName}
                        </td>
                        <td className="p-2 text-center text-slate-600 border-r border-slate-200">
                          {sub.maxMarks}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">
                          {sub.marksObtained}
                        </td>
                        <td className="p-2 text-center font-medium text-slate-700 border-r border-slate-200">
                          {sub.percentage}%
                        </td>
                        <td className="p-2 text-center border-r border-slate-200 font-bold text-blue-700">
                          {sub.grade}
                        </td>
                        <td className="p-2 text-center text-[11px]">
                          {sub.attendancePercentage !== null && sub.attendancePercentage !== undefined ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                sub.attendancePercentage >= 75
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {sub.attendancePercentage}% ({sub.attendancePercentage >= 75 ? 'Eligible' : 'Shortage'})
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Eligible (≥75%)</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td colSpan={2} className="p-2.5 uppercase tracking-wide border-r border-slate-200 text-right pr-4">
                        Total
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200">
                        {transcript.totalMaxMarks}
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 text-slate-900 font-bold">
                        {transcript.totalMarksObtained}
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 text-blue-700 font-bold">
                        {transcript.overallPercentage}%
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 text-emerald-700 font-bold">
                        {transcript.overallGrade}
                      </td>
                      <td className="p-2.5 text-center text-emerald-700 font-bold text-[11px]">
                        ≥75% Per Subject
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Badges: Overall Result, GPA & Attendance */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {/* Result & Grade */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Overall Result
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-emerald-700">
                      Grade {transcript.overallGrade}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({transcript.overallPercentage}%)
                    </span>
                  </div>
                </div>

                {/* Total Marks */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Marks
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-blue-700">
                      {transcript.totalMarksObtained}
                    </span>
                    <span className="text-[11px] text-slate-500">/ {transcript.totalMaxMarks}</span>
                  </div>
                </div>

                {/* Attendance Rule */}
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Subject Attendance Rule
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-slate-800 text-[11px]">
                      Min 75% Per Subject
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Standard
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Teacher Remarks */}
              {transcript.teacherRemarks && transcript.teacherRemarks.length > 0 && (
                <div className="mt-3.5 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Remarks:
                  </span>
                  <p className="text-slate-700 italic">
                    &ldquo;{transcript.teacherRemarks[0]}&rdquo;
                  </p>
                </div>
              )}

              {/* Clean Footer with Small QR Code & Date (No Principal/Teacher Signatures) */}
              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <div className="p-0.5 border border-slate-200 rounded bg-white">
                    <QRCodeSVG value={transcript.verificationUrl || transcript.verificationCode} size={42} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      ID: {transcript.verificationCode}
                    </span>
                    <span className="text-[9px] text-slate-400">Scan to verify marks online</span>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <div>Issued: {new Date(transcript.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div>SchoolBuddy Academic Portal</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
