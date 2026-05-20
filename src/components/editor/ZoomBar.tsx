import { AnimatePresence, motion } from 'framer-motion'
import { ZoomIn, ZoomOut } from 'lucide-react'
import type { Tool } from '../../types/editor'

export type ZoomBarProps = {
  zoom: number
  activeTool: Tool
  onZoomChange: (updater: (current: number) => number) => void
}

export function ZoomBar({ zoom, activeTool, onZoomChange }: ZoomBarProps) {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur">
      <button
        className="rounded-lg border border-line p-2 hover:bg-[oklch(0.955_0.006_255)]"
        onClick={() => onZoomChange((current) => Math.max(0.5, current - 0.1))}
      >
        <ZoomOut size={16} />
      </button>
      <span className="w-16 text-center text-sm text-muted">{Math.round(zoom * 100)}%</span>
      <button
        className="rounded-lg border border-line p-2 hover:bg-[oklch(0.955_0.006_255)]"
        onClick={() => onZoomChange((current) => Math.min(2, current + 0.1))}
      >
        <ZoomIn size={16} />
      </button>

      <AnimatePresence>
        {activeTool !== 'select' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="ml-3 text-sm text-muted"
          >
            Click the page to place {activeTool}.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
