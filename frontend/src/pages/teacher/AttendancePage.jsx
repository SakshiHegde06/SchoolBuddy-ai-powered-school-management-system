import { useState, useEffect } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import FormField, { inputClass } from '../../components/common/FormField'
import { classService } from '../../services/classService'
import { studentService } from '../../services/studentService'
import { attendanceService } from '../../services/attendanceService'
import { useFetch } from '../../hooks/useFetch'

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE']
const todayIso = new Date().toISOString().slice(0, 10)

export default function AttendancePage() {
  const { data: classes } = useFetch(() => classService.list(), [])
  const { data: allStudents } = useFetch(() => studentService.list(), [])

  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(todayIso)
  const [statuses, setStatuses] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const classStudents = (allStudents || []).filter((s) => s.classId === classId)

  useEffect(() => {
    const defaults = {}
    classStudents.forEach((s) => { defaults[s.id] = 'PRESENT' })
    setStatuses(defaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  async function handleSubmit() {
    setIsSubmitting(true)
    setMessage('')
    try {
      const records = classStudents.map((s) => ({ studentId: s.id, status: statuses[s.id] || 'PRESENT' }))
      await attendanceService.mark({ classId, date, records })
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
          <select className={inputClass} value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select a class…</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.section}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Date">
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
      </div>

      {!classId && <p className="text-sm text-ink-400">Choose a class to see its student roster.</p>}

      {classId && classStudents.length === 0 && (
        <p className="text-sm text-ink-400">No students found in this class yet.</p>
      )}

      {classId && classStudents.length > 0 && (
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

          <div className="mt-6 flex items-center gap-4">
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save attendance'}
            </Button>
            {message && <p className="text-sm text-ink-600">{message}</p>}
          </div>
        </>
      )}
    </Card>
  )
}