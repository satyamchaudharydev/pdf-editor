export type Tool = 'select' | 'text' | 'whiteout' | 'highlight'

export type OverlayKind = 'text' | 'whiteout' | 'highlight'

import type { FontStyle, FontWeight } from './pdfText'

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
  fontFamily?: string
  fontWeight?: FontWeight
  fontStyle?: FontStyle
  sourceFontName?: string
  textColor?: string
  opacity?: number
  underline?: boolean
  listStyle?: 'none' | 'bullet'
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
}

export type FontOption = {
  label: string
  value: string
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
