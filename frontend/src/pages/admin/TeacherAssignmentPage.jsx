import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  School,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react'
import Card from '../../components/common/Card'
import EmptyState from '../../components/common/EmptyState'
import Table from '../../components/common/Table'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import FormField, { inputClass } from '../../components/common/FormField'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import { teacherService } from '../../services/teacherService'
import { classService } from '../../services/classService'
import { subjectService } from '../../services/subjectService'
import { teacherAssignmentService } from '../../services/teacherAssignmentService'
import { useFetch } from '../../hooks/useFetch'

const todayIso = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  teacherId: '',
  classId: '',
  subjectId: '',
  effectiveFrom: todayIso(),
  effectiveTo: '',
  isClassTeacher: false,
  notes: '',
}

export default function TeacherAssignmentsPage() {
  const { data: teachers, isLoading: teachersLoading } = useFetch(() => teacherService.list(), [])
  const { data: classes, isLoading: classesLoading } = useFetch(() => classService.list(), [])
  const { data: subjects, isLoading: subjectsLoading } = useFetch(() => subjectService.list(), [])

  // View Mode: 'teacher' | 'class'
  const [viewMode, setViewMode] = useState('teacher')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')

  // 1. Assignments by Teacher
  const {
    data: teacherAssignments,
    isLoading: teacherAssignmentsLoading,
    error: teacherAssignmentsError,
    refetch: refetchTeacherAssignments,
  } = useFetch(
    () =>
      selectedTeacherId
        ? teacherAssignmentService.listByTeacher(selectedTeacherId)
        : Promise.resolve({ data: [] }),
    [selectedTeacherId]
  )

  // 2. Assignments by Class
  const {
    data: classAssignments,
    isLoading: classAssignmentsLoading,
    error: classAssignmentsError,
    refetch: refetchClassAssignments,
  } = useFetch(
    () =>
      selectedClassId
        ? teacherAssignmentService.listByClass(selectedClassId)
        : Promise.resolve({ data: [] }),
    [selectedClassId]
  )

  // Modal State
  const [isModalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal-specific class assignments lookup to show who is already assigned
  const [modalClassAssignments, setModalClassAssignments] = useState([])
  const [isLoadingModalAssignments, setIsLoadingModalAssignments] = useState(false)

  // Fetch assignments for whichever class is currently selected in the modal
  useEffect(() => {
    if (!form.classId) {
      setModalClassAssignments([])
      return
    }

    // If form.classId matches selectedClassId and we already have classAssignments, use that
    if (form.classId === selectedClassId && classAssignments) {
      setModalClassAssignments(classAssignments)
      return
    }

    setIsLoadingModalAssignments(true)
    teacherAssignmentService
      .listByClass(form.classId)
      .then((res) => setModalClassAssignments(res.data || []))
      .catch(() => setModalClassAssignments([]))
      .finally(() => setIsLoadingModalAssignments(false))
  }, [form.classId, selectedClassId, classAssignments])

  // Map of subjectId -> [assignments] for the class selected in the modal
  const assignmentsBySubject = useMemo(() => {
    const map = {}
    ;(modalClassAssignments || []).forEach((a) => {
      if (!map[a.subjectId]) map[a.subjectId] = []
      map[a.subjectId].push(a)
    })
    return map
  }, [modalClassAssignments])

  // Currently assigned teachers for the subject selected in modal
  const currentAssignedForSubject = useMemo(() => {
    if (!form.subjectId) return []
    return assignmentsBySubject[form.subjectId] || []
  }, [form.subjectId, assignmentsBySubject])

  const selectedClassObj = useMemo(
    () => (classes || []).find((c) => c.id === form.classId),
    [classes, form.classId]
  )

  const selectedSubjectObj = useMemo(
    () => (subjects || []).find((s) => s.id === form.subjectId),
    [subjects, form.subjectId]
  )

  const effectiveTeacherId = form.teacherId || selectedTeacherId
  const selectedTeacherObj = useMemo(
    () => (teachers || []).find((t) => t.id === effectiveTeacherId),
    [teachers, effectiveTeacherId]
  )

  const isSelectedTeacherAlreadyAssigned = useMemo(() => {
    if (!effectiveTeacherId || !currentAssignedForSubject.length) return false
    return currentAssignedForSubject.some((a) => a.teacherId === effectiveTeacherId)
  }, [effectiveTeacherId, currentAssignedForSubject])

  function openCreate(prefillClassId = '', prefillSubjectId = '') {
    setForm({
      ...emptyForm,
      teacherId: selectedTeacherId || '',
      classId: prefillClassId || selectedClassId || '',
      subjectId: prefillSubjectId || '',
    })
    setSubmitError('')
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const targetTeacherId = form.teacherId || selectedTeacherId
    if (!targetTeacherId) {
      setSubmitError('Please select a teacher to assign.')
      return
    }
    if (!form.classId) {
      setSubmitError('Please select a class.')
      return
    }
    if (!form.subjectId) {
      setSubmitError('Please select a subject.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await teacherAssignmentService.create({
        teacherId: targetTeacherId,
        classId: form.classId,
        subjectId: form.subjectId,
        effectiveFrom: form.effectiveFrom,
        effectiveTo: form.effectiveTo || null,
        isClassTeacher: form.isClassTeacher,
        notes: form.notes || null,
      })
      setModalOpen(false)
      refetchTeacherAssignments()
      refetchClassAssignments()
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || 'Could not create this assignment. It may already exist.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this assignment? The teacher will lose access to this class/subject.')) return
    await teacherAssignmentService.remove(id)
    refetchTeacherAssignments()
    refetchClassAssignments()
  }

  const teacherColumns = [
    {
      key: 'className',
      header: 'Class',
      render: (row) =>
        `${row.className || ''} ${row.classSection || ''}`.trim() || row.classId,
    },
    { key: 'subjectName', header: 'Subject', render: (row) => row.subjectName || row.subjectId },
    {
      key: 'isClassTeacher',
      header: 'Class Teacher?',
      render: (row) => (
        <Badge tone={row.isClassTeacher ? 'success' : 'neutral'}>
          {row.isClassTeacher ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { key: 'effectiveFrom', header: 'From' },
    { key: 'effectiveTo', header: 'To', render: (row) => row.effectiveTo || 'Ongoing' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          variant="ghost"
          className="px-2 py-1 text-danger-600 hover:text-danger-700"
          onClick={() => handleDelete(row.id)}
        >
          Remove
        </Button>
      ),
    },
  ]

  // Roster of all subjects for the selected class in "By Class" mode
  const classRoster = useMemo(() => {
    if (!selectedClassId) return []
    const assignmentsMap = {}
    ;(classAssignments || []).forEach((a) => {
      if (!assignmentsMap[a.subjectId]) assignmentsMap[a.subjectId] = []
      assignmentsMap[a.subjectId].push(a)
    })

    return (subjects || []).map((sub) => {
      const assigned = assignmentsMap[sub.id] || []
      return {
        subject: sub,
        assignments: assigned,
        isAssigned: assigned.length > 0,
      }
    })
  }, [selectedClassId, classAssignments, subjects])

  return (
    <Card
      title="Teacher Assignments & Subject Roster"
      action={
        <Button
          variant="accent"
          onClick={() => openCreate()}
          disabled={viewMode === 'teacher' ? !selectedTeacherId : !selectedClassId}
        >
          + Assign class &amp; subject
        </Button>
      }
    >
      {/* View Switcher Tabs */}
      <div className="mb-6 flex border-b border-paper-200">
        <button
          type="button"
          onClick={() => setViewMode('teacher')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            viewMode === 'teacher'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          <Users size={16} />
          View by Teacher
        </button>
        <button
          type="button"
          onClick={() => setViewMode('class')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            viewMode === 'class'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          <School size={16} />
          View by Class (Subject Roster)
        </button>
      </div>

      {/* ================= VIEW BY TEACHER ================= */}
      {viewMode === 'teacher' && (
        <div className="space-y-4">
          <FormField label="Select Teacher">
            {teachersLoading ? (
              <Spinner label="Loading teachers…" />
            ) : (
              <select
                className={inputClass}
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
              >
                <option value="">Select a teacher…</option>
                {(teachers || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.email ? `(${t.email})` : ''}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          {!selectedTeacherId && (
            <EmptyState
              title="Pick a teacher"
              description="Select a teacher above to view and manage which classes and subjects they teach."
            />
          )}

          {selectedTeacherId && teacherAssignmentsLoading && (
            <Spinner label="Loading assignments…" />
          )}

          {selectedTeacherId && teacherAssignmentsError && (
            <p className="text-sm text-danger-600">Couldn't load assignments.</p>
          )}

          {selectedTeacherId &&
            !teacherAssignmentsLoading &&
            !teacherAssignmentsError &&
            (teacherAssignments && teacherAssignments.length > 0 ? (
              <Table columns={teacherColumns} rows={teacherAssignments} />
            ) : (
              <EmptyState
                title="No assignments yet"
                description="This teacher isn't assigned to any class/subject, so they cannot take attendance or enter marks until you assign one."
              />
            ))}
        </div>
      )}

      {/* ================= VIEW BY CLASS ================= */}
      {viewMode === 'class' && (
        <div className="space-y-4">
          <FormField label="Select Class">
            {classesLoading ? (
              <Spinner label="Loading classes…" />
            ) : (
              <select
                className={inputClass}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select a class (e.g. Class 8 A)…</option>
                {(classes || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          {!selectedClassId && (
            <EmptyState
              title="Pick a class"
              description="Select a class to see all enrolled subjects and who is currently assigned to teach each subject."
            />
          )}

          {selectedClassId && classAssignmentsLoading && (
            <Spinner label="Loading class roster…" />
          )}

          {selectedClassId && classAssignmentsError && (
            <p className="text-sm text-danger-600">Couldn't load class assignments.</p>
          )}

          {selectedClassId && !classAssignmentsLoading && !classAssignmentsError && (
            <div className="overflow-x-auto rounded-xl border border-paper-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-paper-200 bg-paper-50/80 text-xs uppercase tracking-wide text-ink-500">
                    <th className="py-3 px-4 font-semibold">Subject</th>
                    <th className="py-3 px-4 font-semibold">Current Assigned Teacher(s)</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Effective Period</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-200/60">
                  {classRoster.map(({ subject, assignments: assignedList, isAssigned }) => (
                    <tr key={subject.id} className="hover:bg-paper-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-ink-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-blue-600" />
                          <span>{subject.name}</span>
                          {subject.code && (
                            <span className="font-mono text-xs text-ink-400">({subject.code})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isAssigned ? (
                          <div className="space-y-1">
                            {assignedList.map((a) => (
                              <div key={a.id} className="flex items-center gap-2">
                                <span className="font-semibold text-ink-900">
                                  👨‍🏫 {a.teacherName}
                                </span>
                                {a.teacherEmail && (
                                  <span className="text-xs text-ink-400">({a.teacherEmail})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAssigned && assignedList.some((a) => a.isClassTeacher) ? (
                          <Badge tone="success">Class Teacher</Badge>
                        ) : isAssigned ? (
                          <span className="text-xs text-ink-500">Subject Faculty</span>
                        ) : (
                          <span className="text-xs text-ink-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-ink-500 whitespace-nowrap">
                        {isAssigned ? (
                          assignedList.map((a) => (
                            <div key={a.id}>
                              {a.effectiveFrom} → {a.effectiveTo || 'Ongoing'}
                            </div>
                          ))
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="px-2.5 py-1 text-xs"
                            onClick={() => openCreate(selectedClassId, subject.id)}
                          >
                            <Plus size={13} className="mr-1 inline" />
                            {isAssigned ? 'Add / Co-assign' : 'Assign Teacher'}
                          </Button>
                          {isAssigned &&
                            assignedList.map((a) => (
                              <Button
                                key={a.id}
                                variant="ghost"
                                className="px-2 py-1 text-xs text-danger-600 hover:text-danger-700"
                                onClick={() => handleDelete(a.id)}
                                title={`Remove ${a.teacherName} from ${subject.name}`}
                              >
                                <Trash2 size={13} />
                              </Button>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= ASSIGNMENT MODAL ================= */}
      <Modal
        title="Assign Class & Subject"
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || isSelectedTeacherAlreadyAssigned}
            >
              {isSubmitting ? 'Saving…' : 'Assign Teacher'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teacher Selection */}
          <FormField label="Teacher">
            <select
              required
              className={inputClass}
              value={form.teacherId || selectedTeacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            >
              <option value="">Select a teacher to assign…</option>
              {(teachers || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.email ? `(${t.email})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          {/* Class Selection */}
          <FormField label="Class">
            <select
              required
              className={inputClass}
              value={form.classId}
              onChange={(e) => {
                setForm({ ...form, classId: e.target.value, subjectId: '' })
              }}
            >
              <option value="">Select a class (e.g. Class 8 A)…</option>
              {(classes || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.section}
                </option>
              ))}
            </select>
          </FormField>

          {/* Quick Roster Badge Preview for the selected Class */}
          {form.classId && (
            <div className="rounded-xl border border-paper-200 bg-paper-50 p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-ink-800 flex items-center gap-1.5">
                  <span>📋</span> Current Subject Assignments in {selectedClassObj?.name}{' '}
                  {selectedClassObj?.section}:
                </span>
                {isLoadingModalAssignments && (
                  <span className="text-[11px] text-ink-400">Loading…</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                {(subjects || []).map((sub) => {
                  const assigned = assignmentsBySubject[sub.id] || []
                  const hasAssigned = assigned.length > 0
                  return (
                    <span
                      key={sub.id}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] border ${
                        hasAssigned
                          ? 'border-blue-200 bg-blue-50/80 text-blue-900 font-medium'
                          : 'border-paper-200 bg-white text-ink-400'
                      }`}
                    >
                      <span>{sub.name}:</span>
                      <strong>
                        {hasAssigned ? assigned.map((a) => a.teacherName).join(', ') : 'Unassigned'}
                      </strong>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Subject Selection with Live Assignment Status */}
          <FormField label="Subject">
            <select
              required
              className={inputClass}
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              disabled={!form.classId}
            >
              <option value="">
                {!form.classId ? 'Select a class first…' : 'Select a subject…'}
              </option>
              {(subjects || []).map((s) => {
                const assigned = assignmentsBySubject[s.id] || []
                const assignedNames = assigned.map((a) => a.teacherName).filter(Boolean)
                const hasAssigned = assignedNames.length > 0
                return (
                  <option key={s.id} value={s.id}>
                    {s.name}{' '}
                    {hasAssigned
                      ? `— (Already Assigned: ${assignedNames.join(', ')})`
                      : '— (Unassigned)'}
                  </option>
                )
              })}
            </select>
          </FormField>

          {/* Highlighted Banner: Whoever has been assigned to this subject already */}
          {form.subjectId && (
            <div>
              {currentAssignedForSubject.length > 0 ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertCircle size={15} className="text-amber-600 shrink-0" />
                    <span>
                      Already Assigned to {selectedSubjectObj?.name} in {selectedClassObj?.name}{' '}
                      {selectedClassObj?.section}:
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {currentAssignedForSubject.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-white/90 px-3 py-1.5 border border-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">👨‍🏫 {item.teacherName}</span>
                          {item.teacherEmail && (
                            <span className="text-slate-500">({item.teacherEmail})</span>
                          )}
                          {item.isClassTeacher && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                              Class Teacher
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 text-[11px]">
                          {item.effectiveFrom ? `Since ${item.effectiveFrom}` : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-[11px] text-amber-800">
                    {isSelectedTeacherAlreadyAssigned ? (
                      <span className="font-bold text-danger-700">
                        ⚠️ Error: {selectedTeacherObj?.name || 'This teacher'} is ALREADY assigned to{' '}
                        {selectedSubjectObj?.name} in this class. You cannot duplicate this assignment.
                      </span>
                    ) : (
                      <span>
                        💡 <strong>Note:</strong> {currentAssignedForSubject.map((a) => a.teacherName).join(', ')}{' '}
                        is already teaching this subject. Assigning{' '}
                        <strong>{selectedTeacherObj?.name || 'this teacher'}</strong> will add them
                        alongside as a co-teacher.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>✓ Unassigned:</strong> No teacher is currently assigned to{' '}
                    <strong>{selectedSubjectObj?.name}</strong> in {selectedClassObj?.name}{' '}
                    {selectedClassObj?.section}. Safe to assign!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dates & Role */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Effective From">
              <input
                required
                type="date"
                className={inputClass}
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              />
            </FormField>

            <FormField label="Effective To (Optional)">
              <input
                type="date"
                className={inputClass}
                value={form.effectiveTo}
                onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
              />
            </FormField>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-900 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isClassTeacher}
              onChange={(e) => setForm({ ...form, isClassTeacher: e.target.checked })}
              className="rounded border-paper-300 text-blue-600 focus:ring-blue-500"
            />
            Make this teacher the primary <strong>Class Teacher</strong> for this class
          </label>

          <FormField label="Notes (Optional)">
            <input
              placeholder="e.g. Primary instructor, handles lab sessions"
              className={inputClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </FormField>

          {submitError && (
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700">
              {submitError}
            </div>
          )}
        </form>
      </Modal>
    </Card>
  )
}