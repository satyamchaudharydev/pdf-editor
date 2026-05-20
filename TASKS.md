# PDF Editor Tasks

Use this file as the project checklist. Mark completed work with `[x]` and upcoming work with `[ ]`.

## Completed

- [x] Research PDF editor product landscape and implementation strategy
- [x] Choose initial tech stack: React, TypeScript, Vite, Tailwind, Framer Motion, pdf.js, pdf-lib
- [x] Create product context in `PRODUCT.md`
- [x] Set up Vite React TypeScript project
- [x] Add Tailwind CSS
- [x] Add Framer Motion
- [x] Implement local PDF import
- [x] Render PDF pages with pdf.js
- [x] Add zoom controls
- [x] Add basic editor shell: top bar, tool rail, canvas area, inspector panel
- [x] Add onboarding empty state and quick-start checklist
- [x] Add text overlay tool
- [x] Add whiteout overlay tool
- [x] Add highlight overlay tool
- [x] Add basic select tool for overlay selection
- [x] Add drag support for overlays
- [x] Add inspector controls for selected overlays
- [x] Add delete selected overlay action
- [x] Export edited PDF with overlays using pdf-lib
- [x] Refactor large `App.tsx` into focused components
- [x] Move shared editor types into `src/types/editor.ts`
- [x] Move PDF loading/export logic into `src/lib`
- [x] Initialize git repository
- [x] Push project to GitHub

## Next Priority

- [ ] Add resize handles for overlays
- [ ] Add keyboard delete/backspace for selected overlay
- [ ] Add undo/redo history
- [ ] Add page thumbnails sidebar
- [ ] Add page navigation controls
- [ ] Improve text overlay editing UX
- [ ] Add image insertion tool
- [ ] Add signature tool
- [ ] Add freehand drawing tool
- [ ] Add export progress/loading state
- [ ] Add import/export error handling
- [ ] Add toast notifications
- [ ] Add keyboard shortcuts
- [ ] Add save project/session state locally

## Rendering

- [x] Render PDF pages as canvas
- [ ] Add page virtualization for large PDFs
- [ ] Add text layer support for selection/search
- [ ] Add search inside PDF
- [ ] Add rotate page view
- [ ] Improve high-DPI rendering performance

## Editing

- [x] Overlay-based editing model
- [x] Text overlay
- [x] Whiteout overlay
- [x] Highlight overlay
- [x] Drag overlays
- [ ] Resize overlays
- [ ] Rotate overlays
- [ ] Duplicate overlays
- [ ] Multi-select overlays
- [ ] Marquee selection
- [ ] Snap to page edges/text baselines
- [ ] Alignment guides
- [ ] Copy/paste overlays
- [ ] Lock/unlock overlays

## Export

- [x] Export edited PDF locally
- [x] Flatten text, whiteout, and highlight overlays into final PDF
- [ ] Preserve custom fonts for text overlays
- [ ] Support image export
- [ ] Support drawing/signature export
- [ ] Add export quality options
- [ ] Add filename controls

## UX and Onboarding

- [x] Empty state: drag/drop or choose PDF
- [x] Local-first privacy message
- [x] Quick-start checklist
- [ ] First-time contextual hints
- [ ] Sample PDF option
- [ ] Help/shortcuts panel
- [ ] Better selected-state affordances
- [ ] Better mobile/tablet responsive layout

## Code Quality

- [x] Component-based structure
- [x] Shared types separated where reused
- [x] PDF logic separated from UI components
- [ ] Add ESLint and Prettier
- [ ] Add path aliases
- [ ] Add unit tests for lib functions
- [ ] Add component tests for editor interactions
- [ ] Add stricter PDF document typing where possible
- [ ] Code-split pdf.js/pdf-lib to reduce initial bundle size

## Future Advanced Features

- [ ] Fill PDF forms
- [ ] OCR for scanned PDFs
- [ ] Redaction mode
- [ ] Merge PDFs
- [ ] Split PDFs
- [ ] Reorder pages
- [ ] Delete pages
- [ ] Compress PDF
- [ ] Desktop packaging with Tauri
- [ ] True PDF text editing for simple cases
