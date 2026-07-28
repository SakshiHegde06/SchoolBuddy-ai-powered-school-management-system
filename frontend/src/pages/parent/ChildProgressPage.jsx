import { useEffect, useState } from 'react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import EmptyState from '../../components/common/EmptyState'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'
import { useAuth } from '../../hooks/useAuth'
import { useFetch } from '../../hooks/useFetch'
import { parentService } from '../../services/parentService'
import { studentService } from '../../services/studentService'

export default function ChildProgressPage() {
  const { user } = useAuth()
  const { data: parent, isLoading: isLoadingParent } = useFetch(
    () => parentService.getById(user.refId),
    [user.refId]
  )

  const [children, setChildren] = useState([])
  const [isLoadingChildren, setIsLoadingChildren] = useState(true)
  const [selectedChildId, setSelectedChildId] = useState(null)

  useEffect(() => {
    if (!parent?.childrenIds?.length) {
      setChildren([])
      setIsLoadingChildren(false)
      return
    }

    setIsLoadingChildren(true)
    Promise.all(parent.childrenIds.map((id) => studentService.getById(id)))
      .then((responses) => {
        const loaded = responses.map((res) => res.data)
        setChildren(loaded)
        setSelectedChildId((current) => current ?? loaded[0]?.id ?? null)
      })
      .finally(() => setIsLoadingChildren(false))
  }, [parent])

  if (isLoadingParent || isLoadingChildren) {
    return (
      <Card title="Child progress">
        <Spinner label="Loading children…" />
      </Card>
    )
  }

  if (!children.length) {
    return (
      <Card title="Child progress">
        <EmptyState
          title="No linked children yet"
          description="Once a child is linked to your account, their progress will show up here."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((child) => (
            <Button
              key={child.id}
              variant={child.id === selectedChildId ? 'primary' : 'ghost'}
              onClick={() => setSelectedChildId(child.id)}
            >
              {child.name}{child.section ? ` (${child.section})` : ''}
            </Button>
          ))}
        </div>
      )}

      <Card title="Detailed progress">
        <EmptyState
          title="Full marks/attendance history per subject will render here."
          description="This section is still being built out — the AI analysis below is live."
        />
      </Card>

      {selectedChildId && (
        <AiPerformanceAnalysis studentId={selectedChildId} title="AI performance analysis" />
      )}
    </div>
  )
}