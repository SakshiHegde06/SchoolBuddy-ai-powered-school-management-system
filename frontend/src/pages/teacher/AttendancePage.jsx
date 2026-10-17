import { useState, useEffect, useMemo } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { attendanceService } from '../../services/attendanceService'
import { subjectService } from '../../services/subjectService'
import { teacherService } from '../../services/teacherService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import {
  Check,
  X,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  History,
  FileCheck2,
  UserCheck
} from 'lucide-react'

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE']
const todayIso = new Date().toISOString().slice(0, 10)

export default function AttendancePage() {
  const { user } = useAuth()
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: allStudents } = useFetch(() => studentService.list(), [])
  const { data: subjectList } = useFetch(() => subjectService.list(), [])
  const { data: teacherProfile } = useFetch(
    () => user?.refId ? teacherService.getById(user.refId) : Promise.resolve({ data: null }),
    [user?.refId]
  )
  const { data: assignments } = useFetch(
    () => user?.refId ? teacherAssignmentService.listByTeacher(user.refId) : Promise.resolve({ data: [] }),
    [user?.refId]
  )

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(todayIso)
  const [statuses, setStatuses] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('mark') // 'mark' | 'history'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success') // 'success' | 'error'
  const [existingRecords, setExistingRecords] = useState([])
  const [classHistory, setClassHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const subjects = subjectList || []
  const isAdmin = user?.role === 'ADMIN'

  const assignedClassIds = (assignments?.length > 0)
    ? [...new Set(assignments.map((a) => a.classId).filter(Boolean))]
    : (teacherProfile?.classIds || [])

  const assignedSubjectIds = (assignments?.length > 0)
    ? [...new Set(assignments.map((a) => a.subjectId).filter(Boolean))]
    : (teacherProfile?.subjectIds || [])

  const visibleClasses = isAdmin
    ? (classes || [])
    : (classes || []).filter((c) => assignedClassIds.length === 0 || assignedClassIds.includes(c.id))

  const classStudents = useMemo(() => {
    return (allStudents || []).filter((s) => s.classId === classId)
  }, [allStudents, classId])

  const classAssignmentSubjectIds = (assignments || [])
    .filter((a) => a.classId === classId)
    .map((a) => a.subjectId)
    .filter(Boolean)

  const filteredSubjects = isAdmin
    ? subjects
    : (classAssignmentSubjectIds.length > 0
        ? subjects.filter((s) => classAssignmentSubjectIds.includes(s.id))
        : (assignedSubjectIds.length > 0
            ? subjects.filter((s) => assignedSubjectIds.includes(s.id))
            : subjects))

  const availableSubjects = filteredSubjects

  // Auto-select class or subject if single option
  useEffect(() => {
    if (!classId && visibleClasses.length === 1) {
      setClassId(visibleClasses[0].id)
    }
  }, [visibleClasses, classId])

  useEffect(() => {
    if (classId && !subjectId && availableSubjects.length === 1) {
      setSubjectId(availableSubjects[0].id)
    }
  }, [classId, subjectId, availableSubjects])

  // Reset statuses when class changes
  useEffect(() => {
    const defaults = {}
    classStudents.forEach((s) => {
      defaults[s.id] = 'PRESENT'
    })
    setStatuses(defaults)
    setMessage('')
  }, [classId, classStudents])

  // Load existing records for class + date + subject
  const loadDayAttendance = () => {
    if (!classId || !subjectId || !date) {
      setExistingRecords([])
      return
    }

    attendanceService
      .getByClassAndDate(classId, date, subjectId)
      .then((res) => {
        const records = res.data || []
        setExistingRecords(records)
        if (records.length > 0) {
          const mapped = {}
          records.forEach((record) => {
            mapped[record.studentId] = record.status
          })
          setStatuses((prev) => ({ ...prev, ...mapped }))
        } else {
          // Default all to PRESENT if never marked
          const defaults = {}
          classStudents.forEach((s) => {
            defaults[s.id] = 'PRESENT'
          })
          setStatuses(defaults)
        }
      })
      .catch(() => {
        setExistingRecords([])
      })
  }

  useEffect(() => {
    loadDayAttendance()
  }, [classId, subjectId, date])

  // Load everyday history for the class & subject
  const loadHistory = () => {
    if (!classId) return
    setIsLoadingHistory(true)
    attendanceService
      .getByClass(classId, subjectId ? { subjectId } : {})
      .then((res) => {
        setClassHistory(res.data || [])
      })
      .catch(() => {
        setClassHistory([])
      })
      .finally(() => {
        setIsLoadingHistory(false)
      })
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [classId, subjectId, activeTab])

  // Quick batch actions
  const handleMarkAll = (status) => {
    const updated = {}
    classStudents.forEach((s) => {
      updated[s.id] = status
    })
    setStatuses(updated)
    setMessage(`All students marked as ${status}. Click 'Save Attendance' to persist.`)
    setMessageType('success')
  }

  // Date stepper
  const shiftDate = (days) => {
    const curr = new Date(date)
    curr.setDate(curr.getDate() + days)
    setDate(curr.toISOString().slice(0, 10))
  }

  // Save attendance to MongoDB database
  async function handleSubmit() {
    if (!classId || !subjectId || !date) {
      setMessage('Please select class, subject, and date first.')
      setMessageType('error')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    try {
      const records = classStudents.map((s) => ({
        studentId: s.id,
        status: statuses[s.id] || 'PRESENT',
      }))

      await attendanceService.mark({ classId, subjectId, date, records })
      setMessage(`Successfully saved attendance for ${records.length} student(s) on ${date} to database!`)
      setMessageType('success')
      loadDayAttendance()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save attendance.')
      setMessageType('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate live counts
  const counts = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    classStudents.forEach((s) => {
      const st = statuses[s.id] || 'PRESENT'
      if (st === 'PRESENT') present++
      else if (st === 'ABSENT') absent++
      else if (st === 'LATE') late++
    })
    const total = classStudents.length
    const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0
    return { present, absent, late, total, presentPercent }
  }, [classStudents, statuses])

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents
    const q = searchQuery.toLowerCase()
    return classStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q)
    )
  }, [classStudents, searchQuery])

  // Group history by date
  const groupedHistory = useMemo(() => {
    const map = {}
    classHistory.forEach((rec) => {
      const d = rec.date
      if (!map[d]) {
        map[d] = {
          date: d,
          subjectId: rec.subjectId,
          records: [],
          present: 0,
          absent: 0,
          late: 0,
        }
      }
      map[d].records.push(rec)
      if (rec.status === 'PRESENT') map[d].present++
      else if (rec.status === 'ABSENT') map[d].absent++
      else if (rec.status === 'LATE') map[d].late++
    })

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
  }, [classHistory])

  const selectedClassName = classes?.find((c) => c.id === classId)
  const selectedSubjectName = subjects?.find((s) => s.id === subjectId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Attendance Portal
          </h1>
          <p className="text-sm text-slate-500">
            Record everyday student attendance by subject and date, save records to the database, and inspect daily history.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('mark')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'mark'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 size={16} />
            Daily Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={16} />
            Everyday Logs ({groupedHistory.length})
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Class">
            <select
              className={inputClass}
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value)
                setSubjectId('')
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

          <FormField label="Subject">
            <select
              className={inputClass}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">Select a subject…</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Attendance Date">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition"
                title="Previous day"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                className={inputClass}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 transition"
                title="Next day"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setDate(todayIso)}
                className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                title="Today"
              >
                Today
              </button>
            </div>
          </FormField>
        </div>
      </Card>

      {/* Main Content Area */}
      {(!classId || !subjectId) ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users size={48} className="text-slate-300 mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Select Class & Subject</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm">
              Please choose a class and subject above to load student rosters and start collecting everyday attendance.
            </p>
          </div>
        </Card>
      ) : activeTab === 'mark' ? (
        /* ================= TAB 1: MARK ATTENDANCE ================= */
        <div className="space-y-6">
          {/* Real-time Summary Card */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <Users size={16} className="text-blue-600" /> Total Students
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-800">{counts.total}</div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 size={16} className="text-emerald-600" /> Present
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">{counts.present}</div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold uppercase tracking-wider">
                <XCircle size={16} className="text-rose-600" /> Absent
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-700">{counts.absent}</div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase tracking-wider">
                <Clock size={16} className="text-amber-600" /> Late
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-700">{counts.late}</div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-semibold uppercase tracking-wider">
                <UserCheck size={16} className="text-blue-600" /> Turnout Rate
              </div>
              <div className="mt-2 text-2xl font-bold text-blue-700">{counts.presentPercent}%</div>
            </div>
          </div>

          {/* Database Status Notice */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {existingRecords.length > 0 ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Database status: Attendance for <strong>{date}</strong> ({selectedSubjectName?.name}) is <strong>already recorded</strong> ({existingRecords.length} records saved).
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Database status: No records yet in database for <strong>{date}</strong>. Review and click <strong>Save Attendance</strong> below.
                  </span>
                </>
              )}
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('PRESENT')}
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('ABSENT')}
                className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Roster Card */}
          <Card
            title={
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
                <span>
                  Students List — {selectedClassName?.name} {selectedClassName?.section} ({classStudents.length})
                </span>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name or roll no…"
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>
            }
          >
            {classStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No students enrolled in this class yet.
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">
                No students match your search &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const currentStatus = statuses[student.id] || 'PRESENT'
                  return (
                    <div
                      key={student.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/60 px-2 rounded-lg"
                    >
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-xs text-slate-400 font-mono text-center">
                          {idx + 1}
                        </span>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
                          {student.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Roll No: <span className="font-mono text-slate-700">{student.rollNumber || '—'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Status Selector Pills */}
                      <div className="flex items-center gap-2 pl-9 sm:pl-0">
                        <button
                          type="button"
                          onClick={() => setStatuses({ ...statuses, [student.id]: 'PRESENT' })}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          <Check size={14} />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatuses({ ...statuses, [student.id]: 'ABSENT' })}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          <X size={14} />
                          Absent
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatuses({ ...statuses, [student.id]: 'LATE' })}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            currentStatus === 'LATE'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-300'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          <Clock size={14} />
                          Late
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Bottom Submit Toolbar */}
            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || classStudents.length === 0}
                  className="px-6 py-2.5 text-sm font-semibold shadow-md"
                >
                  {isSubmitting ? 'Saving to Database…' : 'Save Attendance to Database'}
                </Button>

                {existingRecords.length > 0 && (
                  <span className="text-xs text-slate-500">
                    (Saving will overwrite existing records for {date})
                  </span>
                )}
              </div>

              {message && (
                <div
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                    messageType === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {messageType === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message}
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : (
        /* ================= TAB 2: EVERYDAY ATTENDANCE LOGS ================= */
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span>
                Everyday Attendance History — {selectedClassName?.name} {selectedClassName?.section}
              </span>
              <button
                type="button"
                onClick={loadHistory}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Refresh
              </button>
            </div>
          }
        >
          {isLoadingHistory ? (
            <div className="py-12">
              <Spinner label="Loading daily attendance logs from database…" />
            </div>
          ) : groupedHistory.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No attendance records found yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Mark attendance in the &ldquo;Daily Attendance&rdquo; tab and save it to the database to populate everyday history.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Present</th>
                    <th className="px-4 py-3">Absent</th>
                    <th className="px-4 py-3">Late</th>
                    <th className="px-4 py-3">Absent Students List</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedHistory.map((group) => {
                    const subj = subjects?.find((s) => s.id === group.subjectId)
                    const total = group.records.length
                    const presentRate = total > 0 ? Math.round((group.present / total) * 100) : 0

                    // Find who was absent
                    const absentIds = group.records
                      .filter((r) => r.status === 'ABSENT')
                      .map((r) => r.studentId)

                    const absentStudentNames = allStudents
                      ? allStudents
                          .filter((s) => absentIds.includes(s.id))
                          .map((s) => s.name)
                      : []

                    return (
                      <tr key={group.date + group.subjectId} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {group.date}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {subj?.name || 'Subject'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            {group.present} ({presentRate}%)
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                            {group.absent}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                            {group.late}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">
                          {absentStudentNames.length > 0 ? (
                            <span className="text-rose-600 font-medium">
                              {absentStudentNames.join(', ')}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Full attendance (None)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setDate(group.date)
                              if (group.subjectId) setSubjectId(group.subjectId)
                              setActiveTab('mark')
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            View / Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}