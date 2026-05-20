import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Overlay, PageInfo, Tool } from '../../types/editor'
import { PdfPage } from '../pdf/PdfPage'
import { ZoomBar } from './ZoomBar'

export type DocumentCanvasProps = {
  document: PDFDocumentProxy
  pages: PageInfo[]
  zoom: number
  activeTool: Tool
  overlays: Overlay[]
  selectedId: string | null
  onZoomChange: (updater: (current: number) => number) => void
  onSelect: (id: string | null) => void
  onAddOverlay: (page: number, x: number, y: number) => void
  onUpdateOverlay: (id: string, patch: Partial<Overlay>) => void
}

export function DocumentCanvas({
  document,
  pages,
  zoom,
  activeTool,
  overlays,
  selectedId,
  onZoomChange,
  onSelect,
  onAddOverlay,
  onUpdateOverlay,
}: DocumentCanvasProps) {
  return (
    <main className="overflow-auto bg-[oklch(0.935_0.006_255)]">
      <ZoomBar zoom={zoom} activeTool={activeTool} onZoomChange={onZoomChange} />

      <div className="mx-auto flex w-fit flex-col gap-6 px-8 py-8">
        {pages.map((page) => (
          <PdfPage
            key={page.pageNumber}
            document={document}
            page={page}
            zoom={zoom}
            activeTool={activeTool}
            overlays={overlays.filter((item) => item.page === page.pageNumber)}
            selectedId={selectedId}
            onSelect={onSelect}
            onAdd={onAddOverlay}
            onUpdate={onUpdateOverlay}
          />
        ))}
      </div>
    </main>
  )
}
