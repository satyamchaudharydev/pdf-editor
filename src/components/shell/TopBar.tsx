import { Download, FilePlus2 } from 'lucide-react'

export type TopBarProps = {
  fileName: string | null
  canExport: boolean
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
}

export function TopBar({ fileName, canExport, onFileInput, onExport }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-line bg-paper px-4">
      <div className="flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-ink text-paper">
          <FilePlus2 size={17} />
        </div>
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
        <button
          disabled={!canExport}
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={16} /> Export
        </button>
      </div>
    </header>
  )
}
