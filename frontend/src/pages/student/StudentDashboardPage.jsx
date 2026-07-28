import {
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Brain,
  FileText,
  Clock
} from 'lucide-react'

import Card from '../../components/common/Card'
import AiPerformanceAnalysis from '../../components/performance/AiPerformanceAnalysis'
import { useAuth } from '../../hooks/useAuth'

export default function StudentDashboardPage() {

  const { user } = useAuth()

  return (

    <div className="space-y-8">

      {/* Welcome Banner */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 p-8 text-white shadow-xl">

        <h1 className="text-4xl font-bold">

          Welcome, {user?.name?.split(' ')[0]} 

        </h1>

        <p className="mt-2 text-blue-100">

          Track your attendance, homework, study materials and AI performance analysis all in one place.

        </p>

      </div>

      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-3">

        <div className="rounded-2xl border bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                Attendance
              </p>

              <h2 className="mt-2 text-4xl font-bold text-blue-600">
                --
              </h2>

            </div>

            <ClipboardCheck
              size={42}
              className="text-blue-500"
            />

          </div>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                Average Marks
              </p>

              <h2 className="mt-2 text-4xl font-bold text-green-600">
                --
              </h2>

            </div>

            <BookOpen
              size={42}
              className="text-green-500"
            />

          </div>

        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-md">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-gray-500">
                AI Status
              </p>

              <h2 className="mt-2 text-2xl font-bold text-purple-600">
                Ready
              </h2>

            </div>

            <Brain
              size={42}
              className="text-purple-500"
            />

          </div>

        </div>

      </div>

      {/* Timetable + Homework */}

      <div className="grid gap-6 lg:grid-cols-2">

        <Card title="Today's Timetable">

          <div className="flex h-56 flex-col items-center justify-center rounded-xl bg-sky-50">

            <CalendarDays
              size={60}
              className="text-blue-500"
            />

            <p className="mt-4 text-gray-500">

              Your daily timetable will appear here.

            </p>

          </div>

        </Card>

        <Card title="Homework & Study Materials">

          <div className="space-y-5">

            <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">

              <FileText className="text-blue-600" />

              <div>

                <p className="font-semibold">

                  Homework

                </p>

                <p className="text-sm text-gray-500">

                  No homework due today.

                </p>

              </div>

            </div>

            <div className="flex items-center gap-4 rounded-xl bg-green-50 p-4">

              <Clock className="text-green-600" />

              <div>

                <p className="font-semibold">

                  Study Materials

                </p>

                <p className="text-sm text-gray-500">

                  Latest PDFs and notes will appear here.

                </p>

              </div>

            </div>

          </div>

        </Card>

      </div>

      {/* AI Analysis */}

      <div>

        <div className="mb-4 flex items-center gap-3">

          <Brain
            size={30}
            className="text-blue-600"
          />

          <h2 className="text-2xl font-bold text-blue-700">

            AI Performance Analysis

          </h2>

        </div>

        <AiPerformanceAnalysis studentId={user.refId} />

      </div>

    </div>

  )

}