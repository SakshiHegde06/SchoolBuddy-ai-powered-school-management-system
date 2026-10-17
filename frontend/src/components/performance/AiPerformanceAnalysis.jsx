import { TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Spinner from '../common/Spinner'
import EmptyState from '../common/EmptyState'
import { useFetch } from '../../hooks/useFetch'
import { performanceService } from '../../services/performanceService'

const RISK_TONE = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  INSUFFICIENT_DATA: 'neutral',
}

const RISK_LABEL = {
  LOW: 'Low risk',
  MEDIUM: 'Medium risk',
  HIGH: 'High risk',
  INSUFFICIENT_DATA: 'Not enough data yet',
}

const TREND_ICON = {
  IMPROVING: <TrendingUp className="h-4 w-4 text-success-600" />,
  DECLINING: <TrendingDown className="h-4 w-4 text-danger-600" />,
  STABLE: <Minus className="h-4 w-4 text-ink-400" />,
  INSUFFICIENT_DATA: <HelpCircle className="h-4 w-4 text-ink-400" />,
}

export default function AiPerformanceAnalysis({ studentId, title = 'AI performance analysis' }) {
  const { data, error, isLoading } = useFetch(
    () => performanceService.getAnalysis(studentId),
    [studentId]
  )

  if (isLoading) {
    return (
      <Card title={title}>
        <Spinner label="Analyzing performance…" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card title={title}>
        <EmptyState
          title="Couldn't load analysis"
          description="Something went wrong fetching the performance analysis. Try refreshing."
        />
      </Card>
    )
  }

  if (!data || data.riskLevel === 'INSUFFICIENT_DATA' || !data.subjects?.length) {
    return (
      <Card title={title}>
        <EmptyState
          title="Not enough data yet"
          description="Once a few marks are entered across subjects, a trend-based analysis will show up here."
        />
      </Card>
    )
  }

  return (
    <Card title={title}>
      <div className="flex items-center gap-3">
        <Badge tone={RISK_TONE[data.riskLevel] ?? 'neutral'}>
          {RISK_LABEL[data.riskLevel] ?? data.riskLevel}
        </Badge>
        <p className="text-sm text-ink-600">{data.summary}</p>
      </div>

      <div className="mt-4 space-y-2">
        {data.subjects.map((subject) => (
          <div
            key={subject.subjectId}
            className="flex items-center justify-between rounded-md border border-paper-200 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2">
              {TREND_ICON[subject.trend] ?? TREND_ICON.STABLE}
              <span className="text-ink-700">{subject.subjectName}</span>
            </div>
            <div className="flex items-center gap-4 text-ink-500">
              <span>Avg {subject.averageScore}%</span>
              {subject.trend !== 'INSUFFICIENT_DATA' && (
                <span>Next ≈ {subject.predictedNextScore}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}