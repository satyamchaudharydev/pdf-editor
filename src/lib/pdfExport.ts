import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Overlay } from '../types/editor'

export async function exportPdfWithOverlays(params: {
  pdfBytes: Uint8Array
  overlays: Overlay[]
  fileName: string
}) {
  const { pdfBytes, overlays, fileName } = params
  const doc = await PDFDocument.load(pdfBytes)
  const fonts = await createFontMap(doc)

  for (const overlay of overlays) {
    const page = doc.getPage(overlay.page - 1)
    const pageHeight = page.getHeight()

    if (overlay.kind === 'whiteout') {
      const background = hexToRgb(overlay.backgroundColor ?? '#fbfbfa')
      const border = overlay.borderWidth ? hexToRgb(overlay.borderColor ?? '#d6d8de') : undefined
      const radius = Math.max(0, Math.min(overlay.borderRadius ?? 0, Math.min(overlay.w, overlay.h) / 2))

      drawWhiteoutShape({
        page,
        x: overlay.x,
        y: pageHeight - overlay.y - overlay.h,
        width: overlay.w,
        height: overlay.h,
        radius,
        background,
        border,
        borderWidth: overlay.borderWidth ?? 0,
      })
    }

    if (overlay.kind === 'highlight') {
      page.drawRectangle({
        x: overlay.x,
        y: pageHeight - overlay.y - overlay.h,
        width: overlay.w,
        height: overlay.h,
        color: rgb(1, 0.9, 0.25),
        opacity: 0.38,
      })
    }

    if (overlay.kind === 'text') {
      const size = overlay.fontSize ?? 16
      const font = selectExportFont(overlay, fonts)
      const color = hexToRgb(overlay.textColor ?? '#1f2229')
      const text = overlay.text ?? ''

      page.drawText(text, {
        x: overlay.x,
        y: pageHeight - overlay.y - size,
        size,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: overlay.opacity ?? 1,
        maxWidth: overlay.w,
        lineHeight: size * 1.22,
      })

      if (overlay.underline) {
        const lines = text.split('\n')
        const lineHeight = size * 1.22

        for (const [index, line] of lines.entries()) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          const baselineY = pageHeight - overlay.y - size - index * lineHeight
          const underlineWidth = Math.min(font.widthOfTextAtSize(line, size), overlay.w)

          page.drawLine({
            start: { x: overlay.x, y: baselineY - size * 0.12 },
            end: { x: overlay.x + underlineWidth, y: baselineY - size * 0.12 },
            thickness: Math.max(0.75, size * 0.06),
            color: rgb(color.r, color.g, color.b),
            opacity: overlay.opacity ?? 1,
          })
        }
      }
    }
  }

  const edited = await doc.save()
  const arrayBuffer = edited.buffer.slice(edited.byteOffset, edited.byteOffset + edited.byteLength) as ArrayBuffer
  const url = URL.createObjectURL(new Blob([arrayBuffer], { type: 'application/pdf' }))
  const link = document.createElement('a')

  link.href = url
  link.download = fileName.replace(/\.pdf$/i, '') + '-edited.pdf'
  link.click()

  URL.revokeObjectURL(url)
}

function drawWhiteoutShape(params: {
  page: ReturnType<PDFDocument['getPage']>
  x: number
  y: number
  width: number
  height: number
  radius: number
  background: { r: number; g: number; b: number }
  border?: { r: number; g: number; b: number }
  borderWidth: number
}) {
  const { page, x, y, width, height, radius, background, border, borderWidth } = params

  if (radius <= 0) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(background.r, background.g, background.b),
      borderColor: border ? rgb(border.r, border.g, border.b) : undefined,
      borderWidth,
    })
    return
  }

  if (border && borderWidth > 0) {
    drawRoundedFill({
      page,
      x,
      y,
      width,
      height,
      radius,
      color: border,
    })
  }

  const inset = border && borderWidth > 0 ? borderWidth : 0
  const innerWidth = Math.max(0, width - inset * 2)
  const innerHeight = Math.max(0, height - inset * 2)
  const innerRadius = Math.max(0, Math.min(radius - inset, Math.min(innerWidth, innerHeight) / 2))

  drawRoundedFill({
    page,
    x: x + inset,
    y: y + inset,
    width: innerWidth,
    height: innerHeight,
    radius: innerRadius,
    color: background,
  })
}

type EmbeddedFonts = Awaited<ReturnType<typeof createFontMap>>

async function createFontMap(doc: PDFDocument) {
  return {
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
    sansItalic: await doc.embedFont(StandardFonts.HelveticaOblique),
    sansBoldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    serifItalic: await doc.embedFont(StandardFonts.TimesRomanItalic),
    serifBoldItalic: await doc.embedFont(StandardFonts.TimesRomanBoldItalic),
    mono: await doc.embedFont(StandardFonts.Courier),
    monoBold: await doc.embedFont(StandardFonts.CourierBold),
    monoItalic: await doc.embedFont(StandardFonts.CourierOblique),
    monoBoldItalic: await doc.embedFont(StandardFonts.CourierBoldOblique),
  }
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  }
}

function selectExportFont(overlay: Overlay, fonts: EmbeddedFonts) {
  const family = overlay.fontFamily?.toLowerCase() ?? ''
  const isBold = overlay.fontWeight === 'bold'
  const isItalic = overlay.fontStyle === 'italic'

  if (family.includes('tinos') || family.includes('serif') || family.includes('caladea')) {
    if (isBold && isItalic) return fonts.serifBoldItalic
    if (isBold) return fonts.serifBold
    if (isItalic) return fonts.serifItalic
    return fonts.serif
  }

  if (family.includes('cousine') || family.includes('courier') || family.includes('mono')) {
    if (isBold && isItalic) return fonts.monoBoldItalic
    if (isBold) return fonts.monoBold
    if (isItalic) return fonts.monoItalic
    return fonts.mono
  }

  if (isBold && isItalic) return fonts.sansBoldItalic
  if (isBold) return fonts.sansBold
  if (isItalic) return fonts.sansItalic
  return fonts.sans
}

function drawRoundedFill(params: {
  page: ReturnType<PDFDocument['getPage']>
  x: number
  y: number
  width: number
  height: number
  radius: number
  color: { r: number; g: number; b: number }
}) {
  const { page, x, y, width, height, radius, color } = params

  if (width <= 0 || height <= 0) return

  if (radius <= 0) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(color.r, color.g, color.b),
    })
    return
  }

  page.drawRectangle({
    x: x + radius,
    y,
    width: Math.max(0, width - radius * 2),
    height,
    color: rgb(color.r, color.g, color.b),
  })

  page.drawRectangle({
    x,
    y: y + radius,
    width,
    height: Math.max(0, height - radius * 2),
    color: rgb(color.r, color.g, color.b),
  })

  for (const [cx, cy] of [
    [x + radius, y + radius],
    [x + width - radius, y + radius],
    [x + radius, y + height - radius],
    [x + width - radius, y + height - radius],
  ]) {
    page.drawCircle({
      x: cx,
      y: cy,
      size: radius,
      color: rgb(color.r, color.g, color.b),
    })
  }
}
