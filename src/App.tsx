import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FilePlus2, Highlighter, MousePointer2, Plus, ShieldCheck, Square, Type, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { PDFDocument, rgb } from 'pdf-lib'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

type Tool = 'select' | 'text' | 'whiteout' | 'highlight'

type Overlay = {
  id: string
  page: number
  kind: 'text' | 'whiteout' | 'highlight'
  x: number
  y: number
  w: number
  h: number
  text?: string
  fontSize?: number
}

type PageInfo = { pageNumber: number; width: number; height: number }

const sampleChecklist = [
  ['importedPdf', 'Import a PDF'],
  ['createdFirstEdit', 'Make one edit'],
  ['exportedPdf', 'Export PDF'],
] as const

function App() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [fileName, setFileName] = useState('Untitled.pdf')
  const [pages, setPages] = useState<PageInfo[]>([])
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState<Tool>('select')
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState(() => ({
    importedPdf: localStorage.getItem('onboarding.importedPdf') === 'true',
    createdFirstEdit: localStorage.getItem('onboarding.createdFirstEdit') === 'true',
    exportedPdf: localStorage.getItem('onboarding.exportedPdf') === 'true',
  }))

  const mark = (key: keyof typeof onboarding) => {
    localStorage.setItem(`onboarding.${key}`, 'true')
    setOnboarding((current) => ({ ...current, [key]: true }))
  }

  const loadPdf = useCallback(async (file: File) => {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() })
    const doc = await loadingTask.promise
    const nextPages: PageInfo[] = []

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      nextPages.push({ pageNumber: i, width: viewport.width, height: viewport.height })
    }

    setPdfBytes(bytes)
    setPdfDoc(doc)
    setFileName(file.name)
    setPages(nextPages)
    setOverlays([])
    setSelectedId(null)
    mark('importedPdf')
  }, [])

  const onFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void loadPdf(file)
  }

  const addOverlay = (page: number, x: number, y: number) => {
    if (tool === 'select') return

    const overlay: Overlay = tool === 'text'
      ? { id: crypto.randomUUID(), page, kind: 'text', x, y, w: 180, h: 40, text: 'Type here', fontSize: 16 }
      : tool === 'whiteout'
        ? { id: crypto.randomUUID(), page, kind: 'whiteout', x, y, w: 160, h: 34 }
        : { id: crypto.randomUUID(), page, kind: 'highlight', x, y, w: 160, h: 24 }

    setOverlays((current) => [...current, overlay])
    setSelectedId(overlay.id)
    setTool('select')
    mark('createdFirstEdit')
  }

  const updateOverlay = (id: string, patch: Partial<Overlay>) => {
    setOverlays((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setOverlays((current) => current.filter((item) => item.id !== selectedId))
    setSelectedId(null)
  }

  const exportPdf = async () => {
    if (!pdfBytes) return
    const doc = await PDFDocument.load(pdfBytes)
    const helvetica = await doc.embedFont('Helvetica')

    for (const overlay of overlays) {
      const page = doc.getPage(overlay.page - 1)
      const pageHeight = page.getHeight()
      if (overlay.kind === 'whiteout') {
        page.drawRectangle({
          x: overlay.x,
          y: pageHeight - overlay.y - overlay.h,
          width: overlay.w,
          height: overlay.h,
          color: rgb(0.985, 0.985, 0.98),
        })
      }
      if (overlay.kind === 'highlight') {
        page.drawRectangle({
          x: overlay.x,
          y: pageHeight - overlay.y - overlay.h,
          width: overlay.w,
          height: overlay.h,
          color: rgb(1, 0.9, 0.25),
          opacity: 0.38,
        })
      }
      if (overlay.kind === 'text') {
        const size = overlay.fontSize ?? 16
        page.drawText(overlay.text ?? '', {
          x: overlay.x,
          y: pageHeight - overlay.y - size,
          size,
          font: helvetica,
          color: rgb(0.12, 0.13, 0.16),
          maxWidth: overlay.w,
          lineHeight: size * 1.22,
        })
      }
    }

    const edited = await doc.save()
    const arrayBuffer = edited.buffer.slice(edited.byteOffset, edited.byteOffset + edited.byteLength) as ArrayBuffer
    const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = fileName.replace(/\.pdf$/i, '') + '-edited.pdf'
    link.click()
    URL.revokeObjectURL(url)
    mark('exportedPdf')
  }

  const activePage = pages[0]
  const selected = overlays.find((item) => item.id === selectedId)

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <TopBar fileName={pdfBytes ? fileName : null} onFileInput={onFileInput} onExport={exportPdf} canExport={Boolean(pdfBytes)} />

      {!pdfBytes ? (
        <EmptyState onFileInput={onFileInput} />
      ) : (
        <div className="grid h-[calc(100vh-57px)] grid-cols-[76px_minmax(0,1fr)_292px]">
          <aside className="border-r border-line bg-[oklch(0.965_0.006_255)] px-3 py-4">
            <ToolButton active={tool === 'select'} label="Select" icon={<MousePointer2 size={18} />} onClick={() => setTool('select')} />
            <ToolButton active={tool === 'text'} label="Text" icon={<Type size={18} />} onClick={() => setTool('text')} />
            <ToolButton active={tool === 'whiteout'} label="Whiteout" icon={<Square size={18} />} onClick={() => setTool('whiteout')} />
            <ToolButton active={tool === 'highlight'} label="Highlight" icon={<Highlighter size={18} />} onClick={() => setTool('highlight')} />
          </aside>

          <main className="overflow-auto bg-[oklch(0.935_0.006_255)]">
            <div className="sticky top-0 z-20 flex items-center justify-center gap-2 border-b border-line bg-paper/90 px-4 py-2 backdrop-blur">
              <button className="rounded-lg border border-line p-2 hover:bg-[oklch(0.955_0.006_255)]" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}><ZoomOut size={16} /></button>
              <span className="w-16 text-center text-sm text-muted">{Math.round(zoom * 100)}%</span>
              <button className="rounded-lg border border-line p-2 hover:bg-[oklch(0.955_0.006_255)]" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}><ZoomIn size={16} /></button>
              <AnimatePresence>
                {tool !== 'select' && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="ml-3 text-sm text-muted">Click the page to place {tool}.</motion.p>}
              </AnimatePresence>
            </div>

            <div className="mx-auto flex w-fit flex-col gap-6 px-8 py-8">
              {pages.map((page) => (
                <PdfPage
                  key={page.pageNumber}
                  doc={pdfDoc}
                  page={page}
                  zoom={zoom}
                  overlays={overlays.filter((item) => item.page === page.pageNumber)}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onAdd={addOverlay}
                  onUpdate={updateOverlay}
                />
              ))}
            </div>
          </main>

          <aside className="border-l border-line bg-paper p-4">
            <OnboardingPanel onboarding={onboarding} />
            <div className="mt-5 border-t border-line pt-5">
              <h2 className="text-sm font-semibold">Inspector</h2>
              {selected ? (
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-muted">{selected.kind} on page {selected.page}</p>
                  {selected.kind === 'text' && (
                    <label className="block">
                      <span className="text-xs font-medium text-muted">Font size</span>
                      <input className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2" type="number" value={selected.fontSize ?? 16} onChange={(e) => updateOverlay(selected.id, { fontSize: Number(e.target.value) })} />
                    </label>
                  )}
                  <button className="w-full rounded-lg border border-[oklch(0.78_0.05_25)] px-3 py-2 text-[oklch(0.48_0.14_25)] hover:bg-[oklch(0.96_0.02_25)]" onClick={deleteSelected}>Delete selection</button>
                </div>
              ) : <p className="mt-3 text-sm text-muted">Select an edit to adjust it.</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function TopBar({ fileName, onFileInput, onExport, canExport }: { fileName: string | null; onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void; onExport: () => void; canExport: boolean }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-paper px-4">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-ink text-paper"><FilePlus2 size={17} /></div>
        <div>
          <h1 className="text-sm font-semibold leading-none">PDF Editor</h1>
          <p className="mt-1 text-xs text-muted">{fileName ?? 'Local-first PDF editing'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-[oklch(0.955_0.006_255)]">
          Import
          <input type="file" accept="application/pdf" className="hidden" onChange={onFileInput} />
        </label>
        <button disabled={!canExport} onClick={onExport} className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-paper disabled:cursor-not-allowed disabled:opacity-40">
          <Download size={16} /> Export
        </button>
      </div>
    </header>
  )
}

function EmptyState({ onFileInput }: { onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <main className="grid min-h-[calc(100vh-57px)] place-items-center px-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file && file.type === 'application/pdf') { const dt = new DataTransfer(); dt.items.add(file); if (inputRef.current) { inputRef.current.files = dt.files; inputRef.current.dispatchEvent(new Event('change', { bubbles: true })) } } }}
        className={`w-full max-w-xl rounded-3xl border border-dashed p-10 text-center shadow-editor transition ${dragging ? 'border-accent bg-[oklch(0.97_0.02_255)]' : 'border-line bg-paper'}`}>
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[oklch(0.94_0.01_255)]"><Plus size={22} /></div>
        <h2 className="mt-5 text-2xl font-semibold tracking-[-0.02em]">Drop a PDF here</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">Edit text overlays, add highlights, whiteout content, and export a clean PDF.</p>
        <div className="mt-6">
          <button onClick={() => inputRef.current?.click()} className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-paper">Choose PDF</button>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onFileInput} />
        </div>
        <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted"><ShieldCheck size={14} /> Your file stays on this device.</p>
      </motion.div>
    </main>
  )
}

function ToolButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return <button title={label} onClick={onClick} className={`mb-2 grid size-11 place-items-center rounded-xl border transition ${active ? 'border-ink bg-ink text-paper' : 'border-transparent text-muted hover:border-line hover:bg-paper hover:text-ink'}`}>{icon}</button>
}

function OnboardingPanel({ onboarding }: { onboarding: Record<string, boolean> }) {
  return (
    <section>
      <h2 className="text-sm font-semibold">Quick start</h2>
      <div className="mt-3 space-y-2">
        {sampleChecklist.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className={`grid size-5 place-items-center rounded-full border text-[11px] ${onboarding[key] ? 'border-accent bg-accent text-paper' : 'border-line text-muted'}`}>{onboarding[key] ? '✓' : ''}</span>
            <span className={onboarding[key] ? 'text-ink' : 'text-muted'}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function PdfPage({ doc, page, zoom, overlays, selectedId, onSelect, onAdd, onUpdate }: { doc: any; page: PageInfo; zoom: number; overlays: Overlay[]; selectedId: string | null; onSelect: (id: string | null) => void; onAdd: (page: number, x: number, y: number) => void; onUpdate: (id: string, patch: Partial<Overlay>) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const pdfPage = await doc.getPage(page.pageNumber)
      const viewport = pdfPage.getViewport({ scale: zoom })
      const canvas = canvasRef.current
      if (!canvas || cancelled) return
      const context = canvas.getContext('2d')!
      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * pixelRatio
      canvas.height = viewport.height * pixelRatio
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      await pdfPage.render({ canvasContext: context, viewport }).promise
    })()
    return () => { cancelled = true }
  }, [doc, page.pageNumber, zoom])

  return (
    <div className="relative shadow-editor" style={{ width: page.width * zoom, height: page.height * zoom }} onMouseDown={(e) => {
      if (e.target !== e.currentTarget) return
      const rect = e.currentTarget.getBoundingClientRect()
      onAdd(page.pageNumber, (e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom)
      onSelect(null)
    }}>
      <canvas ref={canvasRef} className="absolute inset-0 bg-[oklch(0.985_0.004_255)]" />
      <div className="absolute inset-0">
        {overlays.map((overlay) => <OverlayNode key={overlay.id} overlay={overlay} zoom={zoom} selected={overlay.id === selectedId} onSelect={onSelect} onUpdate={onUpdate} />)}
      </div>
    </div>
  )
}

function OverlayNode({ overlay, zoom, selected, onSelect, onUpdate }: { overlay: Overlay; zoom: number; selected: boolean; onSelect: (id: string | null) => void; onUpdate: (id: string, patch: Partial<Overlay>) => void }) {
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    onSelect(overlay.id)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: overlay.x, oy: overlay.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return
    onUpdate(overlay.id, { x: dragStart.current.ox + (e.clientX - dragStart.current.x) / zoom, y: dragStart.current.oy + (e.clientY - dragStart.current.y) / zoom })
  }
  const onPointerUp = () => { dragStart.current = null }

  return (
    <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      className={`absolute cursor-move ${selected ? 'ring-2 ring-accent ring-offset-2' : ''}`}
      style={{ left: overlay.x * zoom, top: overlay.y * zoom, width: overlay.w * zoom, minHeight: overlay.h * zoom }}>
      {overlay.kind === 'text' && <textarea value={overlay.text} onChange={(e) => onUpdate(overlay.id, { text: e.target.value })} onPointerDown={(e) => { e.stopPropagation(); onSelect(overlay.id) }} className="h-full w-full resize-none bg-transparent p-1 leading-tight outline-none" style={{ fontSize: (overlay.fontSize ?? 16) * zoom }} />}
      {overlay.kind === 'whiteout' && <div className="h-full w-full border border-[oklch(0.84_0.01_255)] bg-[oklch(0.985_0.004_255)]" />}
      {overlay.kind === 'highlight' && <div className="h-full w-full bg-[oklch(0.88_0.16_92)]/45" />}
    </div>
  )
}

export default App
