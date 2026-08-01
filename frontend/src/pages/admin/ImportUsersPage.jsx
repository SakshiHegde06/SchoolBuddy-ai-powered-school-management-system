import { useState } from 'react'
import { UploadCloud } from 'lucide-react'

import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { importService } from '../../services/importService'

export default function ImportUsersPage() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) {
      setError('Please select an Excel file to import.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await importService.importParentsAndStudents(file)
      setResult(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Import failed. Please check the file and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk import parents and students</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload an Excel spreadsheet with parent and student details to onboard accounts in a single step.
        </p>
      </div>

      <Card title="Import file">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Excel file</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:text-slate-700"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              <UploadCloud size={16} />
              {isSubmitting ? 'Importing…' : 'Import parents & students'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card title="Import result">
          <div className="space-y-3 text-sm text-slate-700">
            <p>Parents created: {result.createdParents}</p>
            <p>Students created: {result.createdStudents}</p>
            <p>Rows skipped: {result.skippedRows}</p>
          </div>

          {result.details && result.details.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4">Row</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.details.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200 last:border-0">
                      <td className="py-3 pr-4 text-slate-900">{item.row}</td>
                      <td className="py-3 pr-4 text-slate-900">{item.status}</td>
                      <td className="py-3 pr-4 text-slate-700">{item.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
