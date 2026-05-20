import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { PageInfo } from '../types/editor'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export type LoadedPdf = {
  bytes: Uint8Array
  document: pdfjsLib.PDFDocumentProxy
  pages: PageInfo[]
}

export async function loadPdfFile(file: File): Promise<LoadedPdf> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() })
  const document = await loadingTask.promise
  const pages: PageInfo[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
    })
  }

  return { bytes, document, pages }
}
