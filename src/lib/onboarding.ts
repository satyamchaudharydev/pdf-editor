import type { OnboardingState } from '../types/editor'

export const onboardingSteps = [
  ['importedPdf', 'Import a PDF'],
  ['createdFirstEdit', 'Make one edit'],
  ['exportedPdf', 'Export PDF'],
] as const satisfies readonly [keyof OnboardingState, string][]

export function getInitialOnboardingState(): OnboardingState {
  return {
    importedPdf: localStorage.getItem('onboarding.importedPdf') === 'true',
    createdFirstEdit: localStorage.getItem('onboarding.createdFirstEdit') === 'true',
    exportedPdf: localStorage.getItem('onboarding.exportedPdf') === 'true',
  }
}

export function persistOnboardingStep(key: keyof OnboardingState) {
  localStorage.setItem(`onboarding.${key}`, 'true')
}
