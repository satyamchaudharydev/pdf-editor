import { Highlighter, MousePointer2, Square, Type } from 'lucide-react'
import type { Tool } from '../../types/editor'
import { ToolButton } from '../tools/ToolButton'

export type ToolRailProps = {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

export function ToolRail({ activeTool, onToolChange }: ToolRailProps) {
  return (
    <aside className="border-r border-line bg-[oklch(0.965_0.006_255)] px-3 py-4">
      <ToolButton active={activeTool === 'select'} label="Select" icon={<MousePointer2 size={18} />} onClick={() => onToolChange('select')} />
      <ToolButton active={activeTool === 'text'} label="Text" icon={<Type size={18} />} onClick={() => onToolChange('text')} />
      <ToolButton active={activeTool === 'whiteout'} label="Whiteout" icon={<Square size={18} />} onClick={() => onToolChange('whiteout')} />
      <ToolButton active={activeTool === 'highlight'} label="Highlight" icon={<Highlighter size={18} />} onClick={() => onToolChange('highlight')} />
    </aside>
  )
}
