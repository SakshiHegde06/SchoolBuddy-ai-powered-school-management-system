import { useState } from 'react'
import {
  X,
  Download,
  ExternalLink,
  Brain,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import Spinner from '../common/Spinner'

export default function PdfViewerModal({
  material,
  blobUrl,
  loading = false,
  error = null,
  isOpen,
  onClose,
  onDownload,
  onOpenAiTutor,
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!isOpen || !material) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 p-2 sm:p-4 backdrop-blur-xs animate-fade-in">
      <div
        className={`flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-paper-200 transition-all ${
          isFullscreen
            ? 'h-screen w-screen rounded-none max-h-none max-w-none'
            : 'h-[92vh] w-full max-w-6xl'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-paper-200 bg-navy-900 px-5 py-3 text-white">
          <div className="flex items-center gap-3 overflow-hidden pr-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-amber-400 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate">
              <h3 className="font-display text-sm sm:text-base font-semibold text-white truncate">
                {material.title}
              </h3>
              <p className="text-[11px] text-paper-200/80 truncate">
                {material.subjectName || 'Study Material'} &bull;{' '}
                {material.className || 'Class Document'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Launch AI Tutor Button */}
            {onOpenAiTutor && (
              <button
                onClick={() => {
                  onClose()
                  onOpenAiTutor(material, 'TOPICS')
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-semibold text-navy-950 transition-colors shadow-xs"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Launch AI Tutor</span>
              </button>
            )}

            {/* Direct Download Button */}
            <button
              onClick={() => onDownload && onDownload(material)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              title="Download PDF to Computer"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Open in Tab */}
            {blobUrl && (
              <button
                onClick={() => window.open(blobUrl, '_blank', 'noopener,noreferrer')}
                className="rounded-lg p-2 text-paper-200 hover:bg-white/10 hover:text-white transition-colors"
                title="Open in Browser Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg p-2 text-paper-200 hover:bg-white/10 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-paper-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 bg-paper-100 relative overflow-hidden flex flex-col">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
              <Spinner size="lg" />
              <p className="mt-3 text-sm font-medium text-navy-900">
                Loading study document…
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-10 w-10 text-danger-600 mb-3" />
              <h4 className="font-display text-base font-semibold text-navy-900">
                Unable to display preview
              </h4>
              <p className="mt-1 text-xs text-ink-600 max-w-md">
                {error}
              </p>
              <button
                onClick={() => onDownload && onDownload(material)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white hover:bg-navy-800"
              >
                <Download className="h-4 w-4" /> Download PDF Directly
              </button>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <iframe
              src={blobUrl}
              title={material.title}
              className="h-full w-full border-none"
            />
          )}
        </div>
      </div>
    </div>
  )
}
