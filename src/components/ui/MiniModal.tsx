"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import ExternalLink from 'lucide-react/dist/esm/icons/external-link'
import X from 'lucide-react/dist/esm/icons/x'

export interface MiniModalLink {
  id: string
  label: string
  url?: string
  checked: boolean
}

interface MiniModalProps {
  open: boolean
  title: string
  links: MiniModalLink[]
  onClose: () => void
  onToggle: (id: string) => void
  loading?: boolean
}

const MiniModal: React.FC<MiniModalProps> = ({ open, title, links, onClose, onToggle, loading = false }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[70vh] overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate" title={title}>{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(70vh-80px)]">
          {loading ? (
            <div className="text-gray-500 text-center py-8">Cargando enlaces…</div>
          ) : links && links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 transition-colors duration-150 border border-gray-100">
                  <input id={`mini-${link.id}`} type="checkbox" checked={link.checked} onChange={() => onToggle(link.id)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`mini-${link.id}`} className="text-sm font-medium text-gray-900 cursor-pointer block truncate" title={link.label}>
                      {link.label}
                    </label>
                    {link.url && (
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 break-all inline-flex items-center gap-1 mt-1 hover:underline">
                        {link.url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No hay enlaces disponibles para esta sección.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MiniModal

