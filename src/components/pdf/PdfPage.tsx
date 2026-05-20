import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { Overlay, PageInfo, Tool } from '../../types/editor'
import { OverlayNode } from './OverlayNode'

export type PdfPageProps = {
  document: PDFDocumentProxy
  page: PageInfo
  zoom: number
  activeTool: Tool
  overlays: Overlay[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (page: number, x: number, y: number) => void
  onUpdate: (id: string, patch: Partial<Overlay>) => void
}

export function PdfPage({ document, page, zoom, activeTool, overlays, selectedId, onSelect, onAdd, onUpdate }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false

    async function renderPage() {
      const pdfPage = await document.getPage(page.pageNumber)
      const viewport = pdfPage.getViewport({ scale: zoom })
      const canvas = canvasRef.current

      if (!canvas || cancelled) return

      const context = canvas.getContext('2d')
      if (!context) return

      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * pixelRatio
      canvas.height = viewport.height * pixelRatio
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      await pdfPage.render({ canvas, canvasContext: context, viewport }).promise
    }

    void renderPage()

    return () => {
      cancelled = true
    }
  }, [document, page.pageNumber, zoom])

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return

    const rect = event.currentTarget.getBoundingClientRect()

    if (activeTool === 'select') {
      onSelect(null)
      return
    }

    onAdd(page.pageNumber, (event.clientX - rect.left) / zoom, (event.clientY - rect.top) / zoom)
  }

  return (
    <div
      className="relative shadow-editor"
      style={{ width: page.width * zoom, height: page.height * zoom }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 bg-[oklch(0.985_0.004_255)]" />
      <div className="absolute inset-0" onMouseDown={handleMouseDown}>
        {overlays.map((overlay) => (
          <OverlayNode
            key={overlay.id}
            overlay={overlay}
            zoom={zoom}
            selected={overlay.id === selectedId}
            onSelect={onSelect}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  )
}
