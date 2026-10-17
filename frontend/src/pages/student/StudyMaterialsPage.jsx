import Card from '../../components/common/Card'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { studentService } from '../../services/studentService'
import { studyMaterialService } from '../../services/studyMaterialService'

export default function StudyMaterialsPage() {
  const { user } = useAuth()
  const studentId = user?.refId

  const { data: profile } = useFetch(() => studentService.getById(studentId), [studentId])
  const classId = profile?.classId

  const { data: materials, isLoading } = useFetch(
    () => (classId ? studyMaterialService.findByClass(classId) : Promise.resolve({ data: [] })),
    [classId]
  )

  async function handleOpen(material) {
    if (material.type === 'LINK') {
      window.open(material.externalUrl, '_blank', 'noopener,noreferrer')
      return
    }
    const res = await studyMaterialService.download(material.id)
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card title="Study materials">
      {isLoading && <Spinner />}

      {!isLoading && (!materials || materials.length === 0) && (
        <EmptyState
          title="Nothing posted yet"
          description="Your teachers haven't shared any study materials for your class yet."
        />
      )}

      {!isLoading && materials && materials.length > 0 && (
        <div className="space-y-3">
          {materials.map((material) => (
            <button
              key={material.id}
              onClick={() => handleOpen(material)}
              className="flex w-full items-center justify-between rounded-md border border-paper-200 p-4 text-left transition-colors hover:bg-paper-100"
            >
              <div className="flex-1">
                <p className="font-medium text-navy-900">{material.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={material.type === 'PDF' ? 'neutral' : 'success'}>
                  {material.type === 'PDF' ? 'PDF' : 'Link'}
                </Badge>
                <p className="text-xs text-ink-400">
                  {new Date(material.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}