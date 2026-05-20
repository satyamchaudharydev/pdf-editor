import { onboardingSteps } from '../../lib/onboarding'
import type { OnboardingState } from '../../types/editor'

export type OnboardingPanelProps = {
  onboarding: OnboardingState
}

export function OnboardingPanel({ onboarding }: OnboardingPanelProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold">Quick start</h2>
      <div className="mt-3 space-y-2">
        {onboardingSteps.map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span
              className={`grid size-5 place-items-center rounded-full border text-[11px] ${
                onboarding[key] ? 'border-accent bg-accent text-paper' : 'border-line text-muted'
              }`}
            >
              {onboarding[key] ? '✓' : ''}
            </span>
            <span className={onboarding[key] ? 'text-ink' : 'text-muted'}>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
