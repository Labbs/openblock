# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- **prosemirror-view upgraded to 1.42.9** — fixes an XSS in paste handling (GHSA, affected `< 1.42.3`).
- **CSS injection** — style-bearing attributes (`textColor` / `backgroundColor` marks, `textAlign`, table cell
  `colwidth` / `backgroundColor`, column `width`, columnList `gap`, image `width` / `alignment`, heading `level`) are
  now validated in both `parseDOM` and `toDOM`. Values arriving through JSON, Y.js collaboration or raw `data-*`
  attributes in pasted HTML can no longer inject arbitrary CSS (e.g. tracking `background-image: url(...)` or
  full-page `position: fixed` overlays).
- **Embed sandbox** — generic embeds pointing at the host page's own origin no longer get `allow-same-origin`
  (combined with `allow-scripts` it lets a same-origin page escape the iframe sandbox).
- `editor.setLink()` ignores unsafe hrefs (`javascript:`…) instead of storing them in the document.
- React `LinkPopover`: "open link" validates the href before calling `window.open`.

### Added
- **CommonJS builds** (`require('@labbs/openblock-core')`) alongside ESM, with bundled `.d.ts` / `.d.cts` declarations.
- **Standalone browser bundles**: `openblock-core.iife.js` (`window.OpenBlock`), `openblock-core.esm.js`,
  `openblock-react.esm.js` — exported as `@labbs/openblock-core/standalone`, `@labbs/openblock-core/standalone/iife`
  and `@labbs/openblock-react/standalone`.
- Release workflow attaches the npm tarballs, standalone bundles, `openblock.css` and `SHA256SUMS.txt` to each
  GitHub Release; pre-release tags publish under the `next` dist-tag.
- Public sanitization helpers: `sanitizeLinkHref`, `sanitizeImageSrc`, `sanitizeEmbedUrl`, `sanitizeCssColor`,
  `sanitizeTextAlign`, `toNonNegativeNumber`, and `generateId`.
- `findBlockById(doc, id)` helper (early exit, never walks inline content).
- Multi-block selection API is now public: `createMultiBlockSelectionPlugin`, `MULTI_BLOCK_SELECTION_KEY`,
  `selectBlock`, `clearBlockSelection`, `getSelectedBlockPositions`, `isMultiBlockSelectionActive` (+ types).
- `textColorMark`, `backgroundColorMark` and the `HardBreakContent` type are exported from the package root.
- CI workflow (lint, dead code, build, type-check, production dependency audit) and Dependabot configuration.
- `pnpm deadcode`: [knip](https://knip.dev) (unused files, exports, dependencies) + unused CSS class check.

### Performance
- **React**: `useOpenBlock` only subscribes to `change` / `selectionChange` while `onUpdate` /
  `onSelectionChange` are provided. Previously every keystroke converted the whole document to JSON even when
  nobody listened (~0.5 ms per keystroke on a 2,000-block document).
- Drag & drop: the block position cache is rebuilt lazily on hover instead of on every transaction; the side
  menu is repositioned once per animation frame after edits (no forced synchronous layout per keystroke);
  document-level `mousemove` / `mouseup` listeners are only attached while dragging; block DOM lookup uses
  `view.nodeDOM()` instead of an attribute selector.
- Block id assignment and block lookups no longer walk inline content (x1.5 / x5 faster on large documents).
- `TableHandles`: table position resolved via `posAtDOM` (no full-document walk), mouse moves outside tables
  are ignored when no handle is shown, no state updates on edits while hidden.
- `MediaMenu`: a single passive capture listener for scroll events (was two, hiding the menu twice).
- npm tarball of `@labbs/openblock-core`: 1.2 MB → 520 kB (standalone source maps are only shipped in the
  GitHub Release assets).

### Removed
- Unused code: `styles/index.ts` and `types/index.ts` barrels, the `prosemirror-transform` dependency (never
  imported), dead CSS rules (`.ob-text-align-buttons`, `.selectedCell`, table resize handles, `.ob-table-wrapper`,
  `.ob-color-picker-indicator`), internal-only exports.

### Changed
- Removed the `uuid` runtime dependency (block IDs use the Web Crypto API).
- React peer dependency is now `^18.0.0 || ^19.0.0`; ref props accept React 19 `RefObject<T | null>`.
- `main` now points to the CommonJS build (`module` / `exports.import` still resolve to ESM).
- Tooling: Vite 8, vite-plugin-dts 5, TypeScript 6.0, ESLint 10, pnpm 10 (pinned via `packageManager`),
  Node.js 24 in CI; GitHub Actions pinned by commit SHA.

## [1.0.0] - 2026-01-25

### Added

#### Core Editor (`@labbs/openblock-core`)
- **Public ProseMirror API** - Full access to ProseMirror internals via `editor.pm.*`
- **Block-based JSON document format** - Notion-like structure with full TypeScript support
- **Schema System**
  - Block nodes: paragraph, heading (h1-h6), blockquote, callout, codeBlock, divider, bulletList, orderedList, listItem, checkList, checkListItem, columnList, column, table, tableRow, tableCell, tableHeader, image, embed
  - Mark types: bold, italic, underline, strikethrough, code, link, textColor, backgroundColor
- **Plugin System**
  - Slash menu plugin (`/` command palette)
  - Bubble menu plugin (floating toolbar)
  - Drag & drop plugin for block reordering
  - Table plugin with row/column manipulation
  - Media menu plugin for image/video controls
  - Keyboard shortcuts plugin
  - Input rules for auto-formatting (markdown shortcuts)
  - Block ID management plugin
  - Checklist plugin
  - Multi-block selection plugin
- **Table Commands** - addRowAfter, addRowBefore, deleteRow, addColumnAfter, addColumnBefore, deleteColumn, deleteTable, goToNextCell, goToPreviousCell
- **Document Operations** - getDocument, setDocument, getBlock, insertBlocks, updateBlock, removeBlocks
- **Text Formatting Commands** - toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough, toggleCode, setTextColor, setBackgroundColor
- **History Support** - Undo/redo via ProseMirror history
- **CSS Auto-injection** - Automatic style injection with opt-out support

#### React Package (`@labbs/openblock-react`)
- **Hooks**
  - `useOpenBlock` - Create and manage editor instances
  - `useEditorContent` - Subscribe to document changes
  - `useEditorSelection` - Track selection changes
  - `useEditorFocus` - Monitor focus state
  - `useCustomSlashMenuItems` - Generate menu items from custom blocks
- **Components**
  - `OpenBlockView` - Main editor view component
  - `SlashMenu` - Command palette UI
  - `BubbleMenu` - Floating formatting toolbar
  - `TableHandles` - Row/column manipulation handles
  - `TableMenu` - Table cell operations menu
  - `MediaMenu` - Image/video controls
  - `ColorPicker` - Color selection UI
  - `LinkPopover` - Link editing popover
- **Custom Blocks API** - `createReactBlockSpec` for creating React-based custom blocks
- **Custom Block Hooks** - `useBlockEditor` and `useUpdateBlock` for custom block implementations

### Documentation
- React integration guide
- Custom blocks guide
- Custom marks guide
- Plugins guide
- Styling and theming guide
- Comprehensive README with API reference

---

## [0.0.1] - 2026-01-17

### Added
- Initial project setup
- Basic editor functionality
- ProseMirror integration
- React bindings foundation
