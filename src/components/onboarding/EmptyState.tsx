import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ShieldCheck } from 'lucide-react'

export type EmptyStateProps = {
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function EmptyState({ onFileInput }: EmptyStateProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)

    const file = event.dataTransfer.files[0]
    if (!file || file.type !== 'application/pdf') return

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)

    if (inputRef.current) {
      inputRef.current.files = dataTransfer.files
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-57px)] place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full max-w-xl rounded-3xl border border-dashed p-10 text-center shadow-editor transition ${
          dragging ? 'border-accent bg-[oklch(0.97_0.02_255)]' : 'border-line bg-paper'
        }`}
      >
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[oklch(0.94_0.01_255)]">
          <Plus size={22} />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">Drop a PDF here</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
          Edit text overlays, add highlights, whiteout content, and export a clean PDF.
        </p>
        <div className="mt-6">
          <button onClick={() => inputRef.current?.click()} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper">
            Choose PDF
          </button>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onFileInput} />
        </div>
        <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted">
          <ShieldCheck size={14} /> Your file stays on this device.
        </p>
      </motion.div>
    </main>
  )
}
