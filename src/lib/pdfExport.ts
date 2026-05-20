import { PDFDocument, rgb } from 'pdf-lib'
import type { Overlay } from '../types/editor'

export async function exportPdfWithOverlays(params: {
  pdfBytes: Uint8Array
  overlays: Overlay[]
  fileName: string
}) {
  const { pdfBytes, overlays, fileName } = params
  const doc = await PDFDocument.load(pdfBytes)
  const helvetica = await doc.embedFont('Helvetica')

  for (const overlay of overlays) {
    const page = doc.getPage(overlay.page - 1)
    const pageHeight = page.getHeight()

    if (overlay.kind === 'whiteout') {
      page.drawRectangle({
        x: overlay.x,
        y: pageHeight - overlay.y - overlay.h,
        width: overlay.w,
        height: overlay.h,
        color: rgb(0.985, 0.985, 0.98),
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
      page.drawText(overlay.text ?? '', {
        x: overlay.x,
        y: pageHeight - overlay.y - size,
        size,
        font: helvetica,
        color: rgb(0.12, 0.13, 0.16),
        maxWidth: overlay.w,
        lineHeight: size * 1.22,
      })
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
