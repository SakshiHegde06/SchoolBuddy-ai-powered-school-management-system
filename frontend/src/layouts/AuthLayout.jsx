import { Outlet } from 'react-router-dom'
import {
  GraduationCap,
  TrendingUp,
  Calendar,
  ClipboardList,
  BookOpen,
  Megaphone,
  Info,
  ShieldCheck,
} from 'lucide-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-100/90 flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden grid md:grid-cols-12">

        {/* Left Section (Branding & Features) */}
        <div className="md:col-span-6 lg:col-span-7 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-8 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                School Management System
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
              SchoolBuddy
            </h1>

            <p className="text-slate-300 text-sm sm:text-base font-normal mb-8">
              Friendly school management system
            </p>

            {/* Features List */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Features:
              </h2>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </span>
                  <span>Student Performance Analysis</span>
                </li>

                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Calendar className="h-3.5 w-3.5" />
                  </span>
                  <span>Attendance Management</span>
                </li>

                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <ClipboardList className="h-3.5 w-3.5" />
                  </span>
                  <span>Homework & Assignments</span>
                </li>

                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  <span>Study Materials</span>
                </li>

                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                    <Megaphone className="h-3.5 w-3.5" />
                  </span>
                  <span>School Announcements</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Login Instructions Box */}
          <div className="mt-8 pt-6 border-t border-slate-700/60 relative z-10">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
              <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Login Instructions</span>
              </h3>

              <ol className="list-decimal ml-5 space-y-1.5 text-xs text-slate-300">
                <li>Use the Gmail ID provided by the college.</li>
                <li>Enter the password provided by the administrator.</li>
                <li>Contact the administrator if you are unable to log in.</li>
              </ol>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Secure Authentication & Role-Based Access Control</span>
            </div>
          </div>

        </div>

        {/* Right Section (Form Container) */}
        <div className="md:col-span-6 lg:col-span-5 flex items-center justify-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3 text-blue-600 shadow-xs">
                <GraduationCap className="h-6 w-6" />
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome Back
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
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