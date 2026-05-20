export type ToolButtonProps = {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}

export function ToolButton({ active, label, icon, onClick }: ToolButtonProps) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`mb-2 grid size-11 place-items-center rounded-xl border transition ${
        active ? 'border-ink bg-ink text-paper' : 'border-transparent text-muted hover:border-line hover:bg-paper hover:text-ink'
      }`}
    >
      {icon}
    </button>
  )
}
