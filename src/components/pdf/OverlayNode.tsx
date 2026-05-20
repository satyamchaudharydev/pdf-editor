import { useEffect, useRef, useState } from 'react'
import { TextToolbar } from './TextToolbar'
import type { FontOption, Overlay } from '../../types/editor'

export type OverlayNodeProps = {
  overlay: Overlay
  zoom: number
  selected: boolean
  fontOptions: FontOption[]
  pdfColorPalette: string[]
  onSelect: (id: string | null) => void
  onUpdate: (id: string, patch: Partial<Overlay>) => void
}

export function OverlayNode({ overlay, zoom, selected, fontOptions, pdfColorPalette, onSelect, onUpdate }: OverlayNodeProps) {
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const resizeStart = useRef<{ x: number; y: number; ow: number; oh: number } | null>(null)
  const movedDuringPointer = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditingText, setIsEditingText] = useState(false)

  useEffect(() => {
    if (!selected) setIsEditingText(false)
  }, [selected])

  useEffect(() => {
    if (isEditingText) textareaRef.current?.focus()
  }, [isEditingText])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    onSelect(overlay.id)
    movedDuringPointer.current = false
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

    const deltaX = event.clientX - dragStart.current.x
    const deltaY = event.clientY - dragStart.current.y

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      movedDuringPointer.current = true
    }

    onUpdate(overlay.id, {
      x: dragStart.current.ox + deltaX / zoom,
      y: dragStart.current.oy + deltaY / zoom,
    })
  }

  const handleResizePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onSelect(overlay.id)
    resizeStart.current = {
      x: event.clientX,
      y: event.clientY,
      ow: overlay.w,
      oh: overlay.h,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleResizePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeStart.current) return

    onUpdate(overlay.id, {
      w: Math.max(24, resizeStart.current.ow + (event.clientX - resizeStart.current.x) / zoom),
      h: Math.max(16, resizeStart.current.oh + (event.clientY - resizeStart.current.y) / zoom),
    })
  }

  return (
    <div
      data-overlay-node="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        dragStart.current = null
      }}
      onDoubleClick={(event) => {
        if (overlay.kind !== 'text') return
        event.stopPropagation()
        onSelect(overlay.id)
        setIsEditingText(true)
      }}
      className={`absolute z-30 pointer-events-auto cursor-move ${selected ? 'ring-2 ring-accent ring-offset-2' : ''}`}
      style={{ 
        left: overlay.x * zoom,
        top: overlay.y * zoom,
        width: overlay.w * zoom,
        height: overlay.h * zoom,
      }}
    >
      {overlay.kind === 'text' && (
        <>
          {selected && (
            <TextToolbar
              overlay={overlay}
              fontOptions={fontOptions}
              pdfColorPalette={pdfColorPalette}
              onUpdate={(patch) => onUpdate(overlay.id, patch)}
            />
          )}
          <textarea
            ref={textareaRef}
            value={overlay.text}
            readOnly={!isEditingText}
            onBlur={() => setIsEditingText(false)}
            onChange={(event) => onUpdate(overlay.id, { text: event.target.value })}
            onPointerDown={(event) => {
              if (!isEditingText) return
              event.stopPropagation()
            }}
            onClick={(event) => {
              if (movedDuringPointer.current) {
                event.preventDefault()
              }
            }}
            className={`h-full w-full resize-none bg-transparent p-1 leading-tight outline-none ${isEditingText ? 'cursor-text' : 'pointer-events-none cursor-move'}`}
            style={{
              fontSize: (overlay.fontSize ?? 16) * zoom,
              fontFamily: overlay.fontFamily,
              fontWeight: overlay.fontWeight,
              fontStyle: overlay.fontStyle,
              color: overlay.textColor ?? '#1f2229',
              opacity: overlay.opacity ?? 1,
              textDecoration: overlay.underline ? 'underline' : 'none',
            }}
          />
        </>
      )}

      {overlay.kind === 'whiteout' && (
        <>
          <div
            className="h-full w-full"
            style={{
              backgroundColor: overlay.backgroundColor ?? '#fbfbfa',
              borderColor: overlay.borderColor ?? 'transparent',
              borderWidth: overlay.borderWidth ?? 0,
              borderStyle: 'solid',
              borderRadius: overlay.borderRadius ?? 0,
            }}
          />
          {selected && (
            <WhiteoutToolbar
              overlay={overlay}
              pdfColorPalette={pdfColorPalette}
              onUpdate={(patch) => onUpdate(overlay.id, patch)}
            />
          )}
        </>
      )}
      {overlay.kind === 'highlight' && <div className="h-full w-full bg-[oklch(0.88_0.16_92)]/45" />}

      {selected && (
        <button
          type="button"
          aria-label="Resize edit"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={() => {
            resizeStart.current = null
          }}
          className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-full border border-paper bg-accent shadow-sm"
        />
      )}
    </div>
  )
}

function WhiteoutToolbar({
  overlay,
  pdfColorPalette,
  onUpdate,
}: {
  overlay: Overlay
  pdfColorPalette: string[]
  onUpdate: (patch: Partial<Overlay>) => void
}) {
  const stopPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }

  const palette = pdfColorPalette.slice(0, 6)

  return (
    <div
      onPointerDown={stopPointer}
      className="absolute left-0 top-[-50px] z-10 flex items-center gap-2 rounded-xl border border-line bg-paper p-2 shadow-sm"
    >
      {palette.map((color) => (
        <StyleButton
          key={color}
          label={color}
          color={color}
          active={(overlay.backgroundColor ?? '#fbfbfa') === color}
          onClick={() => onUpdate({ backgroundColor: color })}
        />
      ))}
      <label
        title="Custom color"
        className="relative flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-line"
        style={{
          background:
            'conic-gradient(from 180deg, #ff6b6b, #f59e0b, #fde047, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ff6b6b)',
        }}
      >
        <span className="size-3 rounded-full bg-white/80" />
        <input
          type="color"
          value={overlay.backgroundColor ?? '#fbfbfa'}
          onChange={(event) => onUpdate({ backgroundColor: event.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <button
        type="button"
        onClick={() => onUpdate({ borderWidth: overlay.borderWidth ? 0 : 1, borderColor: overlay.borderWidth ? 'transparent' : '#d6d8de' })}
        className={`rounded-md px-2 py-1 text-xs ${overlay.borderWidth ? 'bg-ink text-paper' : 'text-muted hover:bg-[oklch(0.955_0.006_255)]'}`}
      >
        Border
      </button>
      <label className="flex items-center gap-2 rounded-md border border-line bg-[oklch(0.985_0.004_255)] px-2 py-1 text-xs text-muted">
        Radius
        <input
          type="number"
          min={0}
          value={Math.round(overlay.borderRadius ?? 0)}
          onChange={(event) => onUpdate({ borderRadius: Math.max(0, Number(event.target.value) || 0) })}
          className="w-12 bg-transparent text-right text-ink outline-none"
        />
      </label>
    </div>
  )
}

function StyleButton({ label, color, active, onClick }: { label: string; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={`size-6 rounded-md border ${active ? 'border-ink' : 'border-line'}`}
      style={{ backgroundColor: color }}
    />
  )
}
