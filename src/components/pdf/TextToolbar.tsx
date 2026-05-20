import { useEffect, useRef, useState } from 'react'
import type { FontOption, Overlay } from '../../types/editor'

export type TextToolbarProps = {
  overlay: Overlay
  fontOptions: FontOption[]
  pdfColorPalette: string[]
  onUpdate: (patch: Partial<Overlay>) => void
}

export function TextToolbar({ overlay, fontOptions, pdfColorPalette, onUpdate }: TextToolbarProps) {
  const [showColorPopover, setShowColorPopover] = useState(false)
  const [showOpacityPopover, setShowOpacityPopover] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!toolbarRef.current?.contains(event.target as Node)) {
        setShowColorPopover(false)
        setShowOpacityPopover(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const fontSize = Math.max(1, Math.round(overlay.fontSize ?? 16))
  const textColor = overlay.textColor ?? '#1f2229'
  const opacity = Math.round((overlay.opacity ?? 1) * 100)
  const isBulletList = overlay.listStyle === 'bullet'

  return (
    <div
      ref={toolbarRef}
      onPointerDown={(event) => event.stopPropagation()}
      className="absolute left-0 top-[-72px] z-20 flex items-center gap-2 rounded-[22px] border border-line bg-paper px-3 py-2 shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
    >
      <select
        value={overlay.fontFamily ?? fontOptions[0]?.value ?? 'Inter, system-ui, sans-serif'}
        onChange={(event) => onUpdate({ fontFamily: event.target.value })}
        className="min-w-[180px] rounded-[18px] border border-line bg-[oklch(0.985_0.004_255)] px-4 py-2 text-sm font-semibold outline-none"
      >
        {fontOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex items-center rounded-[18px] border border-line bg-[oklch(0.985_0.004_255)]">
        <ToolbarButton label="−" title="Decrease font size" onClick={() => onUpdate({ fontSize: Math.max(1, fontSize - 1) })} />
        <input
          type="number"
          min={1}
          value={fontSize}
          onChange={(event) => onUpdate({ fontSize: Math.max(1, Number(event.target.value) || 1) })}
          className="w-14 border-x border-line bg-transparent px-2 py-2 text-center text-sm font-semibold outline-none"
        />
        <ToolbarButton label="+" title="Increase font size" onClick={() => onUpdate({ fontSize: fontSize + 1 })} />
      </div>

      <div className="relative">
        <ToolbarButton
          label="A"
          title="Text color"
          active={showColorPopover}
          onClick={() => {
            setShowColorPopover((current) => !current)
            setShowOpacityPopover(false)
          }}
          swatchColor={textColor}
        />
        {showColorPopover && (
          <div className="absolute left-0 top-[56px] w-[260px] rounded-2xl border border-line bg-paper p-3 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Browser picker</p>
            <input
              type="color"
              value={textColor}
              onChange={(event) => onUpdate({ textColor: event.target.value })}
              className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-line bg-transparent p-1"
            />

            {pdfColorPalette.length > 0 && (
              <>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Colors from PDF</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pdfColorPalette.map((color) => (
                    <button
                      key={color}
                      type="button"
                      title={color}
                      onClick={() => onUpdate({ textColor: color })}
                      className={`size-7 rounded-full border ${textColor === color ? 'border-ink ring-2 ring-[oklch(0.86_0.02_255)]' : 'border-line'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ToolbarButton
        label="B"
        title="Bold"
        active={overlay.fontWeight === 'bold'}
        onClick={() => onUpdate({ fontWeight: overlay.fontWeight === 'bold' ? 'normal' : 'bold' })}
      />
      <ToolbarButton
        label="I"
        title="Italic"
        active={overlay.fontStyle === 'italic'}
        onClick={() => onUpdate({ fontStyle: overlay.fontStyle === 'italic' ? 'normal' : 'italic' })}
        className="italic"
      />
      <ToolbarButton
        label="U"
        title="Underline"
        active={Boolean(overlay.underline)}
        onClick={() => onUpdate({ underline: !overlay.underline })}
        className="underline"
      />
      <ToolbarButton
        label="•"
        title="Bullet list"
        active={isBulletList}
        onClick={() =>
          onUpdate({
            listStyle: isBulletList ? 'none' : 'bullet',
            text: toggleBulletList(overlay.text ?? '', isBulletList),
          })
        }
      />

      <div className="relative">
        <ToolbarButton
          label={`${opacity}%`}
          title="Transparency"
          active={showOpacityPopover}
          onClick={() => {
            setShowOpacityPopover((current) => !current)
            setShowColorPopover(false)
          }}
        />
        {showOpacityPopover && (
          <div className="absolute right-0 top-[56px] w-[220px] rounded-2xl border border-line bg-paper p-3 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Transparency</p>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(event) => onUpdate({ opacity: Number(event.target.value) / 100 })}
              className="mt-3 w-full"
            />
            <p className="mt-2 text-sm text-muted">{opacity}% visible</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ToolbarButton(props: {
  label: string
  title: string
  active?: boolean
  className?: string
  swatchColor?: string
  onClick: () => void
}) {
  const { label, title, active = false, className = '', swatchColor, onClick } = props

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`relative min-w-10 rounded-[16px] px-3 py-2 text-sm font-semibold transition ${active ? 'bg-[oklch(0.9_0.008_255)] text-ink' : 'text-ink hover:bg-[oklch(0.96_0.004_255)]'} ${className}`}
    >
      {label}
      {swatchColor && (
        <span
          className="absolute bottom-[5px] left-1/2 h-1.5 w-6 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: swatchColor }}
        />
      )}
    </button>
  )
}

function toggleBulletList(text: string, currentlyBullet: boolean) {
  const lines = text.split('\n')

  if (currentlyBullet) {
    return lines.map((line) => line.replace(/^\s*[•\-]\s*/, '')).join('\n')
  }

  return lines.map((line) => (line.trim() ? `• ${line.replace(/^\s*[•\-]\s*/, '')}` : line)).join('\n')
}
