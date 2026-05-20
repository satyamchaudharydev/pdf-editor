export type PdfTextItem = {
  page: number
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  rawFontName: string
  internalFontName: string
  fontFamily: string
}

export type FontWeight = 'normal' | 'bold'
export type FontStyle = 'normal' | 'italic'

export type MatchedFont = {
  family: string
  label: string
  weight: FontWeight
  style: FontStyle
  sourceFontName: string
  internalFontName?: string
  normalizedFontName: string
}

export type DetectedTextStyle = {
  fontSize: number
  matchedFont: MatchedFont
  nearestText?: string
  distance: number
}
