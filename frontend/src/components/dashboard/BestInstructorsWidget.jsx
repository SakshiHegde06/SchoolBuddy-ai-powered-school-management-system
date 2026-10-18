import React from 'react'
import { MessageSquare, ChevronRight, UserCheck, Star, ShieldCheck } from 'lucide-react'

const DEFAULT_INSTRUCTORS = [
  {
    id: 1,
    name: 'Ali Haider',
    role: 'UI/UX Design Master',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    color: 'border-amber-400',
    rating: '4.9',
  },
  {
    id: 2,
    name: 'Naeem Trump',
    role: 'Full Stack Web Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    color: 'border-rose-400',
    rating: '4.8',
  },
  {
    id: 3,
    name: 'Tyler Desk',
    role: 'Mathematics Specialist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    color: 'border-teal-400',
    rating: '5.0',
  },
  {
    id: 4,
    name: 'Johan Alem',
    role: 'Physics & Science Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    color: 'border-blue-500',
    rating: '4.9',
  },
]

export default function BestInstructorsWidget({
  title = 'Best Instructors',
  viewAllText = 'See All',
  onViewAll,
  instructors = DEFAULT_INSTRUCTORS,
  onChat,
}) {
  const displayInstructors = instructors && instructors.length > 0 ? instructors : DEFAULT_INSTRUCTORS

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <button
            onClick={onViewAll}
            className="group flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <span>{viewAllText}</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Instructors List */}
        <div className="divide-y divide-slate-100 mt-2">
          {displayInstructors.map((inst, idx) => (
            <div
              key={inst.id || idx}
              className="flex items-center justify-between py-3 first:pt-2 last:pb-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <img
                    src={inst.avatar}
                    alt={inst.name}
                    className={`h-10 w-10 rounded-full object-cover border-2 ${
                      inst.color || 'border-blue-500'
                    } shadow-xs`}
                    onError={(e) => {
                      // Fallback avatar if external image fails
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        inst.name
                      )}&background=0ea5e9&color=fff&bold=true`
                    }}
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-slate-800 truncate">
                      {inst.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {inst.role || inst.department || 'Faculty Instructor'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onChat?.(inst)}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-700 transition shadow-2xs active:scale-95"
              >
                Chat
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
