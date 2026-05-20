import { useRef } from 'react'
import type { Overlay } from '../../types/editor'

export type OverlayNodeProps = {
  overlay: Overlay
  zoom: number
  selected: boolean
  onSelect: (id: string | null) => void
  onUpdate: (id: string, patch: Partial<Overlay>) => void
}

export function OverlayNode({ overlay, zoom, selected, onSelect, onUpdate }: OverlayNodeProps) {
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    onSelect(overlay.id)
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      ox: overlay.x,
      oy: overlay.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return

    onUpdate(overlay.id, {
      x: dragStart.current.ox + (event.clientX - dragStart.current.x) / zoom,
      y: dragStart.current.oy + (event.clientY - dragStart.current.y) / zoom,
    })
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        dragStart.current = null
      }}
      className={`absolute cursor-move ${selected ? 'ring-2 ring-accent ring-offset-2' : ''}`}
      style={{
        left: overlay.x * zoom,
        top: overlay.y * zoom,
        width: overlay.w * zoom,
        minHeight: overlay.h * zoom,
      }}
    >
      {overlay.kind === 'text' && (
        <textarea
          value={overlay.text}
          onChange={(event) => onUpdate(overlay.id, { text: event.target.value })}
          onPointerDown={(event) => {
            event.stopPropagation()
            onSelect(overlay.id)
          }}
          className="h-full w-full resize-none bg-transparent p-1 leading-tight outline-none"
          style={{ fontSize: (overlay.fontSize ?? 16) * zoom }}
        />
      )}

      {overlay.kind === 'whiteout' && <div className="h-full w-full border border-[oklch(0.84_0.01_255)] bg-[oklch(0.985_0.004_255)]" />}
      {overlay.kind === 'highlight' && <div className="h-full w-full bg-[oklch(0.88_0.16_92)]/45" />}
    </div>
  )
}
