export type Tool = 'select' | 'text' | 'whiteout' | 'highlight'

export type OverlayKind = 'text' | 'whiteout' | 'highlight'

export type Overlay = {
  id: string
  page: number
  kind: OverlayKind
  x: number
  y: number
  w: number
  h: number
  text?: string
  fontSize?: number
}

export type PageInfo = {
  pageNumber: number
  width: number
  height: number
}

export type OnboardingState = {
  importedPdf: boolean
  createdFirstEdit: boolean
  exportedPdf: boolean
}
