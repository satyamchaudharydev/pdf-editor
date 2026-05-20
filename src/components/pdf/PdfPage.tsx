import { useEffect, useRef } from 'react'
import { TextLayer, type PDFDocumentProxy } from 'pdfjs-dist'
import type { FontOption, Overlay, PageInfo, Tool } from '../../types/editor'
import { OverlayNode } from './OverlayNode'

export type PdfPageProps = {
  document: PDFDocumentProxy
  page: PageInfo
  zoom: number
  activeTool: Tool
  overlays: Overlay[]
  fontOptions: FontOption[]
  pdfColorPalette: string[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (page: number, x: number, y: number) => void
  onUpdate: (id: string, patch: Partial<Overlay>) => void
}

export function PdfPage({
  document,
  page,
  zoom,
  activeTool,
  overlays,
  fontOptions,
  pdfColorPalette,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    async function renderPage() {
      const pdfPage = await document.getPage(page.pageNumber)
      const viewport = pdfPage.getViewport({ scale: zoom })
      const canvas = canvasRef.current
      const textLayerContainer = textLayerRef.current

      if (!canvas || !textLayerContainer || cancelled) return

      const context = canvas.getContext('2d')
      if (!context) return

      const pixelRatio = window.devicePixelRatio || 1
      canvas.width = viewport.width * pixelRatio
      canvas.height = viewport.height * pixelRatio
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      await pdfPage.render({ canvas, canvasContext: context, viewport }).promise

      if (cancelled) return

      textLayerContainer.innerHTML = ''
      const textContent = await pdfPage.getTextContent()
      const textLayer = new TextLayer({
        textContentSource: textContent,
        container: textLayerContainer,
        viewport,
      })
      await textLayer.render()
    }

    void renderPage()

    return () => {
      cancelled = true
    }
  }, [document, page.pageNumber, zoom])

  const handlePageMouseDownCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    const clickedOverlay = target.closest('[data-overlay-node="true"]')

    if (!clickedOverlay && activeTool === 'select') {
      onSelect(null)
    }
  }

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
      onMouseDownCapture={handlePageMouseDownCapture}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-[oklch(0.985_0.004_255)]" />
      <div
        ref={textLayerRef}
        className={`textLayer absolute inset-0 z-10 ${activeTool === 'select' ? 'pointer-events-auto' : 'pointer-events-none'}`}
      />
      <div
        className={`absolute inset-0 z-20 ${activeTool === 'select' ? 'pointer-events-none' : 'pointer-events-auto'}`}
        onMouseDown={handleMouseDown}
      >
        {overlays.map((overlay) => (
          <OverlayNode
            key={overlay.id}
            overlay={overlay}
            zoom={zoom}
            selected={overlay.id === selectedId}
            fontOptions={fontOptions}
            pdfColorPalette={pdfColorPalette}
            onSelect={onSelect}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  )
}
