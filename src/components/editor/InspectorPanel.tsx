import { OnboardingPanel } from '../onboarding/OnboardingPanel'
import type { OnboardingState, Overlay } from '../../types/editor'

export type InspectorPanelProps = {
  selectedOverlay: Overlay | undefined
  onboarding: OnboardingState
  onUpdateOverlay: (id: string, patch: Partial<Overlay>) => void
  onDeleteSelected: () => void
}

export function InspectorPanel({ selectedOverlay, onboarding, onUpdateOverlay, onDeleteSelected }: InspectorPanelProps) {
  return (
    <aside className="border-l border-line bg-paper p-4">
      <OnboardingPanel onboarding={onboarding} />

      <div className="mt-5 border-t border-line pt-5">
        <h2 className="text-sm font-semibold">Inspector</h2>
        {selectedOverlay ? (
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-muted">
              {selectedOverlay.kind} on page {selectedOverlay.page}
            </p>

            {selectedOverlay.kind === 'text' && (
              <label className="block">
                <span className="text-xs font-medium text-muted">Font size</span>
                <input
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2"
                  type="number"
                  value={selectedOverlay.fontSize ?? 16}
                  onChange={(event) => onUpdateOverlay(selectedOverlay.id, { fontSize: Number(event.target.value) })}
                />
              </label>
            )}

            <button
              className="w-full rounded-lg border border-[oklch(0.78_0.05_25)] px-3 py-2 text-[oklch(0.48_0.14_25)] hover:bg-[oklch(0.96_0.02_25)]"
              onClick={onDeleteSelected}
            >
              Delete selection
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Select an edit to adjust it.</p>
        )}
      </div>
    </aside>
  )
}
