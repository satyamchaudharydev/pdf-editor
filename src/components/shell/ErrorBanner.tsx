import { X } from 'lucide-react'

export type ErrorBannerProps = {
  message: string
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-center justify-between border-b border-[oklch(0.78_0.05_25)] bg-[oklch(0.96_0.02_25)] px-4 py-2 text-sm text-[oklch(0.42_0.14_25)]">
      <p>{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 hover:bg-[oklch(0.92_0.03_25)]"
        aria-label="Dismiss error"
      >
        <X size={15} />
      </button>
    </div>
  )
}
