import { useCallback, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { DocumentCanvas } from './components/editor/DocumentCanvas'
import { InspectorPanel } from './components/editor/InspectorPanel'
import { ToolRail } from './components/editor/ToolRail'
import { EmptyState } from './components/onboarding/EmptyState'
import { ErrorBanner } from './components/shell/ErrorBanner'
import { TopBar } from './components/shell/TopBar'
import { exportPdfWithOverlays } from './lib/pdfExport'
import { loadPdfFile } from './lib/pdfLoader'
import { getInitialOnboardingState, persistOnboardingStep } from './lib/onboarding'
import type { OnboardingState, Overlay, PageInfo, Tool } from './types/editor'

function App() {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [fileName, setFileName] = useState('Untitled.pdf')
  const [pages, setPages] = useState<PageInfo[]>([])
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState<Tool>('select')
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [onboarding, setOnboarding] = useState(getInitialOnboardingState)

  const markOnboardingStep = useCallback((key: keyof OnboardingState) => {
    persistOnboardingStep(key)
    setOnboarding((current) => ({ ...current, [key]: true }))
  }, [])

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setErrorMessage(null)
      const loadedPdf = await loadPdfFile(file)

      setPdfBytes(loadedPdf.bytes)
      setPdfDocument(loadedPdf.document)
      setFileName(file.name)
      setPages(loadedPdf.pages)
      setOverlays([])
      setSelectedId(null)
      markOnboardingStep('importedPdf')
    } catch {
      setErrorMessage('This PDF could not be opened. Try another file or a non-password-protected PDF.')
      event.currentTarget.value = ''
    }
  }

  const addOverlay = (page: number, x: number, y: number) => {
    if (tool === 'select') return

    const overlay: Overlay = createOverlay(tool, page, x, y)

    setOverlays((current) => [...current, overlay])
    setSelectedId(overlay.id)
    setTool('select')
    markOnboardingStep('createdFirstEdit')
  }

  const updateOverlay = (id: string, patch: Partial<Overlay>) => {
    setOverlays((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const deleteSelectedOverlay = () => {
    if (!selectedId) return

    setOverlays((current) => current.filter((item) => item.id !== selectedId))
    setSelectedId(null)
  }

  const exportPdf = async () => {
    if (!pdfBytes) return

    try {
      setIsExporting(true)
      setErrorMessage(null)
      await exportPdfWithOverlays({ pdfBytes, overlays, fileName })
      markOnboardingStep('exportedPdf')
    } catch {
      setErrorMessage('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const selectedOverlay = overlays.find((item) => item.id === selectedId)

  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      <TopBar
        fileName={pdfBytes ? fileName : null}
        onFileInput={handleFileInput}
        onExport={exportPdf}
        canExport={Boolean(pdfBytes)}
        isExporting={isExporting}
      />
      {errorMessage && <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />}

      {!pdfBytes || !pdfDocument ? (
        <EmptyState onFileInput={handleFileInput} />
      ) : (
        <div className="grid h-[calc(100vh-57px)] grid-cols-[76px_minmax(0,1fr)_292px]">
          <ToolRail activeTool={tool} onToolChange={setTool} />
          <DocumentCanvas
            document={pdfDocument}
            pages={pages}
            zoom={zoom}
            activeTool={tool}
            overlays={overlays}
            selectedId={selectedId}
            onZoomChange={setZoom}
            onSelect={setSelectedId}
            onAddOverlay={addOverlay}
            onUpdateOverlay={updateOverlay}
          />
          <InspectorPanel
            selectedOverlay={selectedOverlay}
            onboarding={onboarding}
            onUpdateOverlay={updateOverlay}
            onDeleteSelected={deleteSelectedOverlay}
          />
        </div>
      )}
    </div>
  )
}

function createOverlay(tool: Exclude<Tool, 'select'>, page: number, x: number, y: number): Overlay {
  if (tool === 'text') {
    return {
      id: crypto.randomUUID(),
      page,
      kind: 'text',
      x,
      y,
      w: 180,
      h: 40,
      text: 'Type here',
      fontSize: 16,
    }
  }

  if (tool === 'whiteout') {
    return {
      id: crypto.randomUUID(),
      page,
      kind: 'whiteout',
      x,
      y,
      w: 160,
      h: 34,
    }
  }

  return {
    id: crypto.randomUUID(),
    page,
    kind: 'highlight',
    x,
    y,
    w: 160,
    h: 24,
  }
}

export default App
