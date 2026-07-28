import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">

        {/* Left Section */}
        <div className="bg-gradient-to-br from-blue-600 to-sky-500 text-white p-10 flex flex-col justify-center">

          <div className="text-6xl mb-4">🎓</div>

          <h1 className="text-4xl font-bold mb-2">
            SchoolBuddy
          </h1>

          <p className="text-blue-100 text-lg mb-8">
            Friendly school management system
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-3">
              Features:
            </h2>

            <ul className="space-y-3 text-blue-50">

              <li>📊 Student Performance Analysis</li>

              <li>📅 Attendance Management</li>

              <li>📝 Homework & Assignments</li>

              <li>📖 Study Materials</li>

              <li>📢 School Announcements</li>

              <li>🤖 AI Learning Insights</li>

              <li>👨‍🏫 Parent–Teacher Communication</li>

              <li>🗓️ Smart Timetable Generator</li>

            </ul>
          </div>

          <div className="mt-10 bg-white/20 rounded-xl p-5 backdrop-blur-sm">

            <h3 className="font-semibold text-lg mb-3">
              📌 Login Instructions
            </h3>

            <ol className="list-decimal ml-5 space-y-2 text-sm">

              <li>Use the Gmail ID provided by the college.</li>

              <li>Enter the password provided by the administrator.</li>

              <li>
                Contact the administrator if you are unable to log in.
              </li>

            </ol>

          </div>

        </div>

        {/* Right Section */}

        <div className="flex items-center justify-center p-10 bg-white">

          <div className="w-full max-w-md">

            <div className="text-center mb-8">

              <div className="text-5xl mb-2">
                🎓
              </div>

              <h2 className="text-3xl font-bold text-blue-700">
                Welcome Back
              </h2>

              <p className="text-gray-500 mt-2">
                Sign in to continue to SchoolBuddy
              </p>

            </div>

            <Outlet />

          </div>

        </div>

      </div>
    </div>
  )
}