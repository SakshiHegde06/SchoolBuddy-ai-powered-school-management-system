import { useEffect, useState } from 'react'
import api from '../../services/api'

const CATEGORY_CONFIG = {
  Students: { path: '/students', fields: ['name', 'email', 'phone', 'classId'] },
  Teachers: { path: '/teachers', fields: ['name', 'email', 'phone'] },
  Parents: { path: '/parents', fields: ['name', 'email', 'phone'] },
  Classes: { path: '/classes', fields: ['name', 'section'] },
  Subjects: { path: '/subjects', fields: ['name'] },
}

function normalize(value) {
  return String(value || '').toLowerCase()
}

function itemMatches(item, fields, query) {
  const lowerQuery = query.toLowerCase()
  return fields.some((field) => normalize(item[field]).includes(lowerQuery))
}

export default function SearchResultsDropdown({ query, category }) {
  return (
    <div className="absolute z-10 mt-2 w-full rounded-lg border border-paper-200 bg-paper-50 p-3 text-sm shadow-lg">
      <p className="text-ink-400">
        Searching {category.toLowerCase()} for "{query}"…
      </p>
      <p className="mt-1 text-xs text-ink-400">Connect to the backend search endpoint to see live results.</p>
    </div>
  )
}