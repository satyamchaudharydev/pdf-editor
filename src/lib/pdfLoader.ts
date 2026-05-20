import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { PageInfo } from '../types/editor'
import type { PdfTextItem } from '../types/pdfText'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export type LoadedPdf = {
  bytes: Uint8Array
  document: pdfjsLib.PDFDocumentProxy
  pages: PageInfo[]
  textItems: PdfTextItem[]
  colorPalette: string[]
}

export async function loadPdfFile(file: File): Promise<LoadedPdf> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() })
  const document = await loadingTask.promise
  const pages: PageInfo[] = []
  const textItems: PdfTextItem[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
    })

    const textContent = await page.getTextContent()

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue

      const transform = item.transform
      const internalFontName = item.fontName
      const style = textContent.styles[internalFontName]
      const rawFontName = style?.fontFamily || internalFontName
      const fontSize = Math.hypot(transform[2], transform[3]) || Math.abs(transform[3]) || item.height

      textItems.push({
        page: pageNumber,
        text: item.str,
        x: transform[4],
        y: viewport.height - transform[5],
        width: item.width,
        height: item.height,
        fontSize,
        rawFontName,
        internalFontName,
        fontFamily: style?.fontFamily ?? rawFontName,
      })
    }
  }

  const colorPalette = await extractPdfColorPalette(document)

  return { bytes, document, pages, textItems, colorPalette }
}

async function extractPdfColorPalette(document: pdfjsLib.PDFDocumentProxy) {
  const colorCounts = new Map<string, number>()
  const sampledPages = Math.min(document.numPages, 8)

  for (let pageNumber = 1; pageNumber <= sampledPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 0.35 })
    const canvas = globalThis.document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!context) continue

    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))

    await page.render({ canvas, canvasContext: context, viewport }).promise

    const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
    const stride = Math.max(12, Math.floor((canvas.width * canvas.height) / 6000))

    for (let index = 0; index < data.length; index += stride * 4) {
      const alpha = data[index + 3]
      if (alpha < 220) continue

      const red = data[index]
      const green = data[index + 1]
      const blue = data[index + 2]

      if (red > 248 && green > 248 && blue > 248) continue

      const quantized = toHex(
        Math.round(red / 16) * 16,
        Math.round(green / 16) * 16,
        Math.round(blue / 16) * 16,
      )

      colorCounts.set(quantized, (colorCounts.get(quantized) ?? 0) + 1)
    }
  }

  const sorted = [...colorCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([hex]) => hex)

  const palette: string[] = []

  for (const color of sorted) {
    if (palette.some((existing) => colorDistance(existing, color) < 26)) continue
    palette.push(color)
    if (palette.length === 18) break
  }

  return palette
}

function toHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0'))
    .join('')}`
}

function colorDistance(left: string, right: string) {
  const leftRgb = hexToRgb(left)
  const rightRgb = hexToRgb(right)

  return Math.hypot(leftRgb.r - rightRgb.r, leftRgb.g - rightRgb.g, leftRgb.b - rightRgb.b)
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}
