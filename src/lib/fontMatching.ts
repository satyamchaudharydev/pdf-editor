import type { FontOption } from '../types/editor'
import type { DetectedTextStyle, MatchedFont, PdfTextItem } from '../types/pdfText'

const FONT_ALIASES = [
  {
    family: 'Arimo, Arial, sans-serif',
    label: 'Arimo',
    aliases: ['arial', 'helvetica', 'helveticaneue', 'univers', 'liberationsans'],
  },
  {
    family: 'Tinos, "Times New Roman", serif',
    label: 'Tinos',
    aliases: ['times', 'timesnewroman', 'georgia', 'liberationserif'],
  },
  {
    family: 'Cousine, "Courier New", monospace',
    label: 'Cousine',
    aliases: ['courier', 'couriernew', 'mono', 'consolas', 'liberationmono'],
  },
  {
    family: 'Carlito, Calibri, sans-serif',
    label: 'Carlito',
    aliases: ['calibri', 'aptos'],
  },
  {
    family: 'Caladea, Cambria, serif',
    label: 'Caladea',
    aliases: ['cambria'],
  },
  {
    family: 'Inter, system-ui, sans-serif',
    label: 'Inter',
    aliases: ['inter', 'roboto', 'sfpro', 'segoeui'],
  },
] as const

const DEFAULT_FONT_OPTIONS: FontOption[] = FONT_ALIASES.map((font) => ({
  label: font.label,
  value: font.family,
}))

export function detectNearbyTextStyle(params: {
  page: number
  x: number
  y: number
  textItems: PdfTextItem[]
}): DetectedTextStyle | null {
  const { page, x, y, textItems } = params
  const pageItems = textItems.filter((item) => item.page === page)
  if (pageItems.length === 0) return null

  const nearest = pageItems.reduce<{ item: PdfTextItem; distance: number } | null>((best, item) => {
    const centerX = item.x + item.width / 2
    const centerY = item.y + item.height / 2
    const distance = Math.hypot(centerX - x, centerY - y)

    if (!best || distance < best.distance) return { item, distance }
    return best
  }, null)

  if (!nearest) return null

  const matchedFont = matchFont(nearest.item.rawFontName || nearest.item.fontFamily)
  const pdfInternalFontFamily = nearest.item.internalFontName ? quoteFontFamily(nearest.item.internalFontName) : null

  return {
    fontSize: nearest.item.fontSize,
    matchedFont: {
      ...matchedFont,
      family: pdfInternalFontFamily ? `${pdfInternalFontFamily}, ${matchedFont.family}` : matchedFont.family,
      internalFontName: nearest.item.internalFontName,
    },
    nearestText: nearest.item.text,
    distance: nearest.distance,
  }
}

export function matchFont(rawFontName: string): MatchedFont {
  const normalizedFontName = normalizeFontName(rawFontName)
  const matched = FONT_ALIASES.find((font) => font.aliases.some((alias) => normalizedFontName.includes(alias)))
  const weight = /bold|black|heavy|semibold|demi/.test(normalizedFontName) ? 'bold' : 'normal'
  const style = /italic|oblique/.test(normalizedFontName) ? 'italic' : 'normal'

  return {
    family: matched?.family ?? 'Inter, system-ui, sans-serif',
    label: matched?.label ?? 'Inter',
    weight,
    style,
    sourceFontName: rawFontName,
    normalizedFontName,
  }
}

export function logDetectedFont(style: DetectedTextStyle) {
  console.info('[PDF font detected]', {
    rawFontName: style.matchedFont.sourceFontName,
    internalFontName: style.matchedFont.internalFontName,
    normalizedFontName: style.matchedFont.normalizedFontName,
    detectedSize: Math.round(style.fontSize * 100) / 100,
    editorFontFamily: style.matchedFont.family,
    matchedEditorFont: style.matchedFont.label,
    matchedWeight: style.matchedFont.weight,
    matchedStyle: style.matchedFont.style,
    nearestText: style.nearestText,
    distance: Math.round(style.distance * 100) / 100,
  })
}

export function getEditorFontOptions(textItems: PdfTextItem[]): FontOption[] {
  const options = new Map<string, FontOption>()

  for (const option of DEFAULT_FONT_OPTIONS) {
    options.set(option.value, option)
  }

  for (const item of textItems) {
    const matchedFont = matchFont(item.rawFontName || item.fontFamily)
    options.set(matchedFont.family, {
      label: matchedFont.label,
      value: matchedFont.family,
    })
  }

  return [...options.values()]
}

function quoteFontFamily(fontFamily: string) {
  return `"${fontFamily.replace(/"/g, '\\"')}"`
}

function normalizeFontName(fontName: string) {
  return fontName
    .replace(/^[A-Z]{6}\+/, '')
    .replace(/[-_\s]/g, '')
    .toLowerCase()
}
