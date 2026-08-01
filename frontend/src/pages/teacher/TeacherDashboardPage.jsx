import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  MessageSquare,
  FileText
} from 'lucide-react'

import AnnouncementsWidget from '../../components/common/AnnouncementsWidget'

export default function TeacherDashboardPage() {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Mark Attendance',
      description: 'Record today’s attendance.',
      icon: ClipboardCheck,
      color: 'bg-blue-100 text-blue-600',
      path: '/teacher/attendance',
    },
    {
      title: 'Upload Marks',
      description: 'Enter examination marks.',
      icon: GraduationCap,
      color: 'bg-green-100 text-green-600',
      path: '/teacher/marks',
    },
    {
      title: 'Homework',
      description: 'Assign homework to students.',
      icon: BookOpen,
      color: 'bg-orange-100 text-orange-600',
      path: '/teacher/homework',
    },
    {
      title: 'Study Materials',
      description: 'Upload PDFs and useful links.',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      path: '/teacher/materials',
    },
    {
      title: 'Student Remarks',
      description: 'Write remarks for students.',
      icon: MessageSquare,
      color: 'bg-pink-100 text-pink-600',
      path: '/teacher/remarks',
    },
  ]

  return (
    <div className="space-y-8">

      {/* Welcome Banner */}

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 p-8 text-white shadow-xl">

       

        <p className="mt-2 text-blue-100">
          Manage your classes, assignments, attendance, study materials and student performance from one dashboard.
        </p>

      </div>

      {/* Timetable */}

      <div className="rounded-2xl bg-white shadow-md border p-6">

        <div className="flex items-center gap-3 mb-4">

          <CalendarDays size={28} className="text-blue-600" />

          <h2 className="text-2xl font-semibold text-gray-800">
            Today's Timetable
          </h2>

        </div>

        <div className="rounded-xl bg-sky-50 h-56 flex flex-col justify-center items-center">

          <CalendarDays size={60} className="text-blue-400" />

          <p className="mt-4 text-gray-500">
            Timetable will appear here after AI timetable generation.
          </p>

        </div>

      </div>

      {/* Quick Actions */}

      <div>

        <h2 className="text-2xl font-bold text-blue-700 mb-5">
          Quick Actions
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {actions.map((action) => {

            const Icon = action.icon

            return (

              <div
                key={action.title}
                className="rounded-2xl border bg-white p-6 shadow-md hover:shadow-xl transition-all"
              >

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${action.color}`}
                >
                  <Icon size={28} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-800">
                  {action.title}
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>

                <button
                  onClick={() => navigate(action.path)}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
                >
                  Open
                </button>

              </div>

            )

          })}

        </div>

      </div>

      {/* Announcements */}

      <AnnouncementsWidget />

    </div>
  )
}