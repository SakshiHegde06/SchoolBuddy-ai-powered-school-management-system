import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { attendanceService } from '../../services/attendanceService'
import { subjectService } from '../../services/subjectService'
import { useFetch } from '../../hooks/useFetch'

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE']
const todayIso = new Date().toISOString().slice(0, 10)

export default function AttendancePage() {
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: allStudents } = useFetch(() => studentService.list(), [])
  const { data: subjectList } = useFetch(() => subjectService.list(), [])

  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(todayIso)
  const [statuses, setStatuses] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [existingRecords, setExistingRecords] = useState([])

  const subjects = subjectList || []
  const classStudents = (allStudents || []).filter((s) => s.classId === classId)

  useEffect(() => {
    const defaults = {}
    classStudents.forEach((s) => { defaults[s.id] = 'PRESENT' })
    setStatuses(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  useEffect(() => {
    if (!classId || !subjectId || !date) {
      setExistingRecords([])
      return
    }

    attendanceService.getByClassAndDate(classId, date, subjectId)
      .then((res) => {
        const records = res.data || []
        setExistingRecords(records)
        const mapped = {}
        records.forEach((record) => {
          mapped[record.studentId] = record.status
        })
        setStatuses((prev) => ({ ...prev, ...mapped }))
      })
      .catch(() => {
        setExistingRecords([])
      })
  }, [classId, subjectId, date])

  async function handleSubmit() {
    setIsSubmitting(true)
    setMessage('')
    try {
      const records = classStudents.map((s) => ({ studentId: s.id, status: statuses[s.id] || 'PRESENT' }))
      await attendanceService.mark({ classId, subjectId, date, records })
      setMessage(`Attendance saved for ${records.length} student(s).`)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save attendance.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card title="Mark attendance">
      <div className="mb-6 flex flex-wrap gap-4">
        <FormField label="Class">
          <select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSubjectId(''); }}>
            <option value="">Select a class…</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Subject">
          <select className={inputClass} value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Select a subject…</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
      </div>

      {(!classId || !subjectId) && <p className="text-sm text-ink-400">Choose a class and subject to see the student roster.</p>}

      {classId && classStudents.length === 0 && (
        <p className="text-sm text-ink-400">No students found in this class yet.</p>
      )}

      {classId && subjectId && classStudents.length > 0 && (
        <>
          <div className="divide-y divide-paper-200">
            {classStudents.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-ink-900">{s.name}</p>
                  <p className="text-xs text-ink-400">Roll {s.rollNumber || '—'}</p>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStatuses({ ...statuses, [s.id]: opt })}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${
                        statuses[s.id] === opt
                          ? opt === 'PRESENT'
                            ? 'bg-success-100 text-success-600'
                            : opt === 'ABSENT'
                            ? 'bg-danger-100 text-danger-600'
                            : 'bg-warning-100 text-warning-600'
                          : 'bg-paper-200 text-ink-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {existingRecords.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mt-6">
              <p className="text-sm text-blue-700">
                Loaded {existingRecords.length} saved attendance record{existingRecords.length === 1 ? '' : 's'} for this class, subject and date.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !subjectId || !classId}
            >
              {isSubmitting ? 'Saving…' : 'Save attendance'}
            </Button>
            {!subjectId && <p className="text-sm text-red-600">Select a subject before saving attendance.</p>}
            {message && <p className="text-sm text-ink-600">{message}</p>}
          </div>
        </>
      )}
    </Card>
  )
}