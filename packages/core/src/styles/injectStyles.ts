/**
 * CSS Style Injection
 *
 * Auto-injects OpenBlock editor styles into the document head.
 * This allows the editor to work without requiring manual CSS imports.
 *
 * @module
 */

const STYLE_ID = 'openblock-styles';
let stylesInjected = false;

/**
 * The complete OpenBlock editor CSS as a string.
 * This is embedded so the editor can work without external CSS files.
 */
const EDITOR_STYLES = `
/* OpenBlock Editor Styles - Auto-injected */

.openblock-container,
.openblock-editor {
  --ob-foreground: var(--foreground, 25 5% 22%);
  --ob-background: var(--background, 0 0% 100%);
  --ob-muted: var(--muted, 40 6% 96%);
  --ob-muted-foreground: var(--muted-foreground, 25 2% 57%);
  --ob-border: var(--border, 40 6% 90%);
  --ob-primary: var(--primary, 25 5% 22%);
  --ob-radius: var(--radius, 0.25rem);
  --ob-font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --ob-font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --ob-font-size: 16px;
  --ob-line-height: 1.6;
  --ob-block-spacing: 0.75em;
  --ob-content-padding: 1rem;
}

.openblock-container {
  position: relative;
  width: 100%;
}

.openblock-editor {
  font-family: var(--ob-font-family);
  font-size: var(--ob-font-size);
  line-height: var(--ob-line-height);
  color: hsl(var(--ob-foreground));
  background: hsl(var(--ob-background));
  padding: var(--ob-content-padding) var(--ob-content-padding) var(--ob-content-padding) calc(var(--ob-content-padding) + 48px);
  outline: none;
  min-height: 100px;
}

.openblock-editor:focus {
  outline: none;
}

/* ProseMirror Core */
.ProseMirror {
  outline: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.ProseMirror-focused {
  outline: none;
}

.ProseMirror p.is-empty::before {
  content: attr(data-placeholder);
  color: hsl(var(--ob-muted-foreground));
  pointer-events: none;
  position: absolute;
}

.ProseMirror ::selection {
  background: hsl(var(--ob-primary) / 0.2);
}

.ProseMirror-gapcursor {
  display: none;
  pointer-events: none;
  position: absolute;
}

.ProseMirror-gapcursor:after {
  content: '';
  display: block;
  position: absolute;
  top: -2px;
  width: 20px;
  border-top: 1px solid hsl(var(--ob-foreground));
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}

@keyframes ProseMirror-cursor-blink {
  to { visibility: hidden; }
}

.ProseMirror-focused .ProseMirror-gapcursor {
  display: block;
}

.ProseMirror-dropcursor {
  position: absolute;
  border-left: 2px solid hsl(var(--ob-primary));
  pointer-events: none;
}

/* Block Spacing */
.openblock-editor > * + * {
  margin-top: var(--ob-block-spacing);
}

/* Paragraph */
.openblock-editor p {
  margin: 0;
}

/* Headings */
.openblock-editor h1,
.openblock-editor h2,
.openblock-editor h3,
.openblock-editor h4,
.openblock-editor h5,
.openblock-editor h6 {
  margin: 0;
  font-weight: 600;
  line-height: 1.3;
}

.openblock-editor h1 {
  font-size: 2em;
  margin-top: 1em;
}

.openblock-editor h2 {
  font-size: 1.5em;
  margin-top: 0.875em;
}

.openblock-editor h3 {
  font-size: 1.25em;
  margin-top: 0.75em;
}

.openblock-editor h4 {
  font-size: 1.125em;
}

.openblock-editor h5 {
  font-size: 1em;
}

.openblock-editor h6 {
  font-size: 0.875em;
  color: hsl(var(--ob-muted-foreground));
}

/* Inline Formatting */
.openblock-editor strong {
  font-weight: 600;
}

.openblock-editor em {
  font-style: italic;
}

.openblock-editor u {
  text-decoration: underline;
}

.openblock-editor s {
  text-decoration: line-through;
}

.openblock-editor code {
  font-family: var(--ob-font-mono);
  font-size: 0.9em;
  background: hsl(var(--ob-muted));
  padding: 0.125em 0.25em;
  border-radius: calc(var(--ob-radius) / 2);
}

/* Links */
.openblock-editor a {
  color: hsl(var(--ob-primary));
  text-decoration: none;
}

.openblock-editor a:hover {
  text-decoration: underline;
}

/* Lists */
.openblock-editor ul,
.openblock-editor ol {
  margin: 0;
  padding-left: 1.5em;
}

.openblock-editor li {
  margin: 0.25em 0;
}

.openblock-editor li > p {
  margin: 0;
}

/* Blockquote */
.openblock-editor blockquote {
  margin: 0;
  padding-left: 1em;
  border-left: 3px solid hsl(var(--ob-border));
  color: hsl(var(--ob-muted-foreground));
}

/* Callout */
.openblock-editor .openblock-callout {
  margin: 0;
  padding: 0.75em 1em;
  border-radius: var(--ob-radius);
  border-left: 4px solid;
  background: hsl(var(--ob-muted) / 0.5);
}

.openblock-editor .openblock-callout--info {
  border-left-color: hsl(220 90% 56%);
  background: hsl(220 90% 56% / 0.1);
}

.openblock-editor .openblock-callout--warning {
  border-left-color: hsl(38 92% 50%);
  background: hsl(38 92% 50% / 0.1);
}

.openblock-editor .openblock-callout--success {
  border-left-color: hsl(142 76% 36%);
  background: hsl(142 76% 36% / 0.1);
}

.openblock-editor .openblock-callout--error {
  border-left-color: hsl(0 84% 60%);
  background: hsl(0 84% 60% / 0.1);
}

.openblock-editor .openblock-callout--note {
  border-left-color: hsl(var(--ob-muted-foreground));
  background: hsl(var(--ob-muted) / 0.5);
}

/* Code Block */
.openblock-editor pre {
  font-family: var(--ob-font-mono);
  font-size: 0.9em;
  background: hsl(var(--ob-muted));
  padding: 1em;
  border-radius: var(--ob-radius);
  overflow-x: auto;
  margin: 0;
}

.openblock-editor pre code {
  background: none;
  padding: 0;
}

/* Divider */
.openblock-editor hr {
  border: none;
  border-top: 1px solid hsl(var(--ob-border));
  margin: 1.5em 0;
}

/* Side Menu */
.ob-side-menu {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 1px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  user-select: none;
  z-index: 100;
}

.ob-side-menu--visible {
  opacity: 1;
  pointer-events: auto;
}

.ob-add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #9ca3af;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.ob-add-button svg {
  width: 14px;
  height: 14px;
}

.ob-add-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.ob-add-button:active {
  background: #e5e7eb;
}

.ob-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 24px;
  cursor: grab;
  color: #9ca3af;
  border-radius: 4px;
  transition: background 0.15s ease, color 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
}

.ob-drag-handle svg {
  width: 14px;
  height: 14px;
}

.ob-drag-handle:hover {
  background: #f3f4f6;
  color: #374151;
}

.ob-drag-handle--dragging {
  cursor: grabbing;
}

.ob-drag-handle:active {
  cursor: grabbing;
}

.ob-block-dragging {
  opacity: 0.4;
  background: hsl(var(--ob-muted));
  border-radius: var(--ob-radius);
}

.ob-drop-indicator {
  height: 3px;
  background: hsl(220 90% 56%);
  border-radius: 2px;
  margin: -2px 0;
  pointer-events: none;
  position: relative;
}

.ob-drop-indicator::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: hsl(220 90% 56%);
}

.openblock-editor > *,
.openblock-editor p,
.openblock-editor h1,
.openblock-editor h2,
.openblock-editor h3,
.openblock-editor h4,
.openblock-editor h5,
.openblock-editor h6,
.openblock-editor blockquote,
.openblock-editor .openblock-callout,
.openblock-editor pre,
.openblock-editor ul,
.openblock-editor ol,
.openblock-editor hr {
  position: relative;
}

.openblock-editor [data-block-id] {
  position: relative;
}

/* Slash Menu */
.ob-slash-menu {
  --ob-foreground: var(--foreground, 25 5% 22%);
  --ob-background: var(--background, 0 0% 100%);
  --ob-muted: var(--muted, 40 6% 96%);
  --ob-muted-foreground: var(--muted-foreground, 25 2% 57%);
  --ob-border: var(--border, 40 6% 90%);
  --ob-radius: var(--radius, 0.5rem);
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  min-width: 220px;
  max-width: 320px;
  overflow-y: auto;
  padding: 6px;
}

.ob-slash-menu-empty {
  padding: 8px 12px;
  color: hsl(var(--ob-muted-foreground));
  font-size: 0.875em;
  text-align: center;
}

.ob-slash-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: calc(var(--ob-radius) - 2px);
  cursor: pointer;
  transition: background 0.1s ease;
}

.ob-slash-menu-item:hover,
.ob-slash-menu-item--selected {
  background: hsl(var(--ob-muted));
}

.ob-slash-menu-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: hsl(var(--ob-muted-foreground));
}

.ob-slash-menu-item--selected .ob-slash-menu-item-icon {
  color: hsl(var(--ob-foreground));
}

.ob-slash-menu-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.ob-slash-menu-item-title {
  font-size: 0.875em;
  font-weight: 500;
  color: hsl(var(--ob-foreground));
}

.ob-slash-menu-item-description {
  font-size: 0.75em;
  color: hsl(var(--ob-muted-foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Bubble Menu */
.ob-bubble-menu {
  --ob-foreground: var(--foreground, 222 47% 11%);
  --ob-background: var(--background, 0 0% 100%);
  --ob-muted: var(--muted, 210 40% 96%);
  --ob-muted-foreground: var(--muted-foreground, 215 16% 47%);
  --ob-border: var(--border, 214 32% 91%);
  --ob-primary: var(--primary, 222 47% 11%);
  --ob-radius: var(--radius, 0.5rem);
  display: flex;
  align-items: center;
  gap: 1px;
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 4px 6px;
}

.ob-bubble-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: hsl(var(--ob-muted-foreground));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.ob-bubble-menu-btn svg {
  width: 15px;
  height: 15px;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-bubble-menu-btn:hover {
  background: hsl(var(--ob-muted));
  color: hsl(var(--ob-foreground));
}

.ob-bubble-menu-btn--active {
  background: hsl(215 20% 85%);
  color: hsl(var(--ob-foreground));
}

.ob-bubble-menu-btn--active:hover {
  background: hsl(215 20% 80%);
  color: hsl(var(--ob-foreground));
}

.ob-bubble-menu-divider {
  width: 1px;
  height: 16px;
  background: hsl(var(--ob-border));
  margin: 0 6px;
  flex-shrink: 0;
}

/* Text Alignment */
.ob-text-align-buttons {
  display: flex;
  align-items: center;
  gap: 1px;
}

/* Block Type Selector */
.ob-block-type-selector {
  position: relative;
}

.ob-block-type-selector-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: hsl(var(--ob-foreground));
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.ob-block-type-selector-btn:hover {
  background: hsl(var(--ob-muted));
}

.ob-block-type-selector-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: hsl(var(--ob-muted-foreground));
}

.ob-block-type-selector-icon svg {
  width: 14px;
  height: 14px;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-block-type-selector-label {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ob-block-type-selector-chevron {
  width: 14px;
  height: 14px;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  color: hsl(var(--ob-muted-foreground));
  transition: transform 0.15s ease;
}

.ob-block-type-selector-chevron--open {
  transform: rotate(180deg);
}

.ob-block-type-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 4px;
  min-width: 160px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1001;
  animation: ob-dropdown-fade-in 0.12s ease-out;
}

.ob-block-type-dropdown--upward {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 4px;
  animation: ob-dropdown-fade-in-up 0.12s ease-out;
}

@keyframes ob-dropdown-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ob-dropdown-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ob-block-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: calc(var(--ob-radius) - 2px);
  color: hsl(var(--ob-foreground));
  cursor: pointer;
  transition: background 0.1s ease;
  text-align: left;
  font-size: 13px;
}

.ob-block-type-option:hover {
  background: hsl(var(--ob-muted));
}

.ob-block-type-option--active {
  background: hsl(var(--ob-muted) / 0.7);
}

.ob-block-type-option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: hsl(var(--ob-muted-foreground));
  flex-shrink: 0;
}

.ob-block-type-option-icon svg {
  width: 16px;
  height: 16px;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-block-type-option-label {
  flex: 1;
}

.ob-block-type-option-check {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  color: hsl(var(--ob-primary));
  flex-shrink: 0;
}

/* Column Layout */
.ob-column-list {
  display: flex;
  gap: 8px;
  width: 100%;
  margin: 0.5em 0;
  position: relative;
}

.ob-column {
  position: relative;
  min-width: 80px;
  min-height: 1em;
  padding: 0 8px 0 48px;
}

.ob-column:first-child {
  padding-left: 48px;
}

.ob-column:last-child {
  padding-right: 0;
}

.ob-column:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: hsl(var(--ob-border) / 0.3);
}

.ob-column:empty::before,
.ob-column > p:only-child:empty::before {
  content: 'Type something...';
  color: hsl(var(--ob-muted-foreground));
  pointer-events: none;
}

/* Table */
.openblock-editor table,
.openblock-editor .ob-table {
  border-collapse: collapse;
  width: calc(100% - 28px);
  margin: 0.5em 0 28px 0;
  table-layout: fixed;
}

.openblock-editor th,
.openblock-editor td,
.openblock-editor .ob-table-cell,
.openblock-editor .ob-table-header {
  border: 1px solid hsl(var(--ob-border));
  padding: 0.5em 0.75em;
  text-align: left;
  vertical-align: top;
  position: relative;
  min-width: 50px;
}

.openblock-editor th,
.openblock-editor .ob-table-header {
  background: hsl(var(--ob-muted));
  font-weight: 600;
}

.openblock-editor .ob-table-cell > p,
.openblock-editor .ob-table-header > p,
.openblock-editor td > p,
.openblock-editor th > p {
  margin: 0;
}

.openblock-editor .ob-table-cell > p:first-child,
.openblock-editor .ob-table-header > p:first-child {
  margin-top: 0;
}

.openblock-editor .ob-table-cell > p:last-child,
.openblock-editor .ob-table-header > p:last-child {
  margin-bottom: 0;
}

.openblock-editor .ob-table-cell.selectedCell,
.openblock-editor .ob-table-header.selectedCell {
  background: hsl(220 90% 56% / 0.1);
}

.openblock-editor .ob-table-cell-resize-handle,
.openblock-editor .ob-table-header-resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
}

.openblock-editor .ob-table-cell-resize-handle:hover,
.openblock-editor .ob-table-header-resize-handle:hover {
  background: hsl(var(--ob-primary) / 0.3);
}

.openblock-editor .ob-table-wrapper {
  overflow-x: auto;
  margin: 0.5em 0;
}

/* Link Popover */
.ob-link-popover {
  --ob-foreground: var(--foreground, 222 47% 11%);
  --ob-background: var(--background, 0 0% 100%);
  --ob-muted: var(--muted, 210 40% 96%);
  --ob-muted-foreground: var(--muted-foreground, 215 16% 47%);
  --ob-border: var(--border, 214 32% 91%);
  --ob-primary: var(--primary, 222 47% 11%);
  --ob-destructive: var(--destructive, 0 84% 60%);
  --ob-radius: var(--radius, 0.5rem);
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 4px;
  animation: ob-link-popover-fade-in 0.12s ease-out;
}

@keyframes ob-link-popover-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ob-link-popover-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ob-link-popover-input-row {
  display: flex;
}

.ob-link-popover-input-wrapper {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px 2px 8px;
  border: 1px solid hsl(var(--ob-border));
  border-radius: calc(var(--ob-radius) - 2px);
  background: hsl(var(--ob-background));
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ob-link-popover-input-wrapper:focus-within {
  border-color: hsl(var(--ob-primary) / 0.5);
  box-shadow: 0 0 0 2px hsl(var(--ob-primary) / 0.1);
}

.ob-link-popover-input-wrapper--error {
  border-color: hsl(var(--ob-destructive));
}

.ob-link-popover-input-wrapper--error:focus-within {
  border-color: hsl(var(--ob-destructive));
  box-shadow: 0 0 0 2px hsl(var(--ob-destructive) / 0.1);
}

.ob-link-popover-input-icon {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
  color: hsl(var(--ob-muted-foreground));
}

.ob-link-popover-input {
  flex: 1;
  min-width: 180px;
  padding: 6px 8px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: hsl(var(--ob-foreground));
  outline: none;
}

.ob-link-popover-input::placeholder {
  color: hsl(var(--ob-muted-foreground));
}

.ob-link-popover-inline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: hsl(var(--ob-muted-foreground));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  flex-shrink: 0;
}

.ob-link-popover-inline-btn svg {
  width: 14px;
  height: 14px;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-link-popover-inline-btn:hover {
  background: hsl(var(--ob-muted));
  color: hsl(var(--ob-foreground));
}

.ob-link-popover-inline-btn--primary {
  background: hsl(var(--ob-primary));
  color: hsl(var(--ob-background));
}

.ob-link-popover-inline-btn--primary:hover {
  background: hsl(var(--ob-primary) / 0.85);
  color: hsl(var(--ob-background));
}

.ob-link-popover-inline-btn--danger:hover {
  background: hsl(var(--ob-destructive) / 0.1);
  color: hsl(var(--ob-destructive));
}

.ob-link-popover-error {
  margin: 0;
  padding: 0 8px;
  font-size: 11px;
  color: hsl(var(--ob-destructive));
}

/* Color Picker */
.ob-color-picker {
  position: relative;
}

.ob-color-picker > .ob-bubble-menu-btn {
  position: relative;
}

.ob-color-picker-indicator {
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 3px;
  border-radius: 2px;
}

.ob-color-picker-dropdown {
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 8px;
  min-width: 160px;
  z-index: 1002;
}

.ob-color-picker-section {
  padding: 4px 0;
}

.ob-color-picker-section:first-child {
  padding-top: 0;
}

.ob-color-picker-section:last-child {
  padding-bottom: 0;
}

.ob-color-picker-divider {
  height: 1px;
  background: hsl(var(--ob-border));
  margin: 8px 0;
}

.ob-color-picker-label {
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--ob-muted-foreground));
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ob-color-picker-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.ob-color-picker-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.1s ease;
}

.ob-color-picker-option:hover {
  border-color: hsl(var(--ob-border));
  transform: scale(1.05);
}

.ob-color-picker-option--active {
  border-color: hsl(var(--ob-primary));
  background: hsl(var(--ob-muted) / 0.5);
}

.ob-color-picker-option svg {
  width: 20px;
  height: 20px;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  color: hsl(var(--ob-muted-foreground));
}

.ob-color-picker-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.ob-color-picker-swatch--text {
  background: transparent;
  font-size: 14px;
}

/* Multi-Block Selection */
.ob-block-selected {
  background: hsl(220 90% 56% / 0.1);
  outline: 2px solid hsl(220 90% 56% / 0.5);
  outline-offset: -2px;
  border-radius: var(--ob-radius);
}

.ob-block-selected::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: hsl(220 90% 56%);
  border-radius: 50%;
}

/* Table Menu */
.ob-table-menu {
  --ob-foreground: var(--foreground, 222 47% 11%);
  --ob-background: var(--background, 0 0% 100%);
  --ob-muted: var(--muted, 210 40% 96%);
  --ob-muted-foreground: var(--muted-foreground, 215 16% 47%);
  --ob-border: var(--border, 214 32% 91%);
  --ob-primary: var(--primary, 222 47% 11%);
  --ob-destructive: var(--destructive, 0 84% 60%);
  --ob-radius: var(--radius, 0.5rem);
  display: flex;
  align-items: center;
  gap: 4px;
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  animation: ob-table-menu-fade-in 0.15s ease-out;
}

@keyframes ob-table-menu-fade-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ob-table-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: hsl(var(--ob-muted-foreground));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.ob-table-menu-btn svg {
  width: 16px;
  height: 16px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-table-menu-btn:hover {
  background: hsl(var(--ob-muted));
  color: hsl(var(--ob-foreground));
}

.ob-table-menu-btn--danger {
  color: hsl(var(--ob-destructive));
}

.ob-table-menu-btn--danger:hover {
  background: hsl(var(--ob-destructive) / 0.1);
  color: hsl(var(--ob-destructive));
}

.ob-table-menu-divider {
  width: 1px;
  height: 20px;
  background: hsl(var(--ob-border));
  margin: 0 4px;
  flex-shrink: 0;
}

.ob-table-menu-info {
  font-size: 11px;
  color: hsl(var(--ob-muted-foreground));
  padding: 0 8px;
  white-space: nowrap;
}

.ob-table-menu-dropdown {
  position: relative;
}

.ob-table-menu-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: hsl(var(--ob-foreground));
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.ob-table-menu-dropdown-btn:hover {
  background: hsl(var(--ob-muted));
}

.ob-table-menu-dropdown-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: hsl(var(--ob-muted-foreground));
}

.ob-table-menu-dropdown-icon svg {
  width: 14px;
  height: 14px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-table-menu-dropdown-label {
  min-width: 40px;
}

.ob-table-menu-dropdown-chevron {
  width: 12px;
  height: 12px;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  color: hsl(var(--ob-muted-foreground));
  transition: transform 0.15s ease;
}

.ob-table-menu-dropdown-chevron--open {
  transform: rotate(180deg);
}

.ob-table-menu-dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 4px;
  min-width: 180px;
  z-index: 1001;
  animation: ob-dropdown-fade-in 0.12s ease-out;
}

.ob-table-menu-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: calc(var(--ob-radius) - 2px);
  color: hsl(var(--ob-foreground));
  cursor: pointer;
  transition: background 0.1s ease;
  text-align: left;
  font-size: 13px;
}

.ob-table-menu-dropdown-item:hover {
  background: hsl(var(--ob-muted));
}

.ob-table-menu-dropdown-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ob-table-menu-dropdown-item:disabled:hover {
  background: transparent;
}

.ob-table-menu-dropdown-item svg {
  width: 16px;
  height: 16px;
  stroke-linecap: round;
  stroke-linejoin: round;
  color: hsl(var(--ob-muted-foreground));
  flex-shrink: 0;
}

.ob-table-menu-dropdown-item span {
  flex: 1;
}

.ob-table-menu-dropdown-item--danger {
  color: hsl(var(--ob-destructive));
}

.ob-table-menu-dropdown-item--danger svg {
  color: hsl(var(--ob-destructive));
}

.ob-table-menu-dropdown-item--danger:hover {
  background: hsl(var(--ob-destructive) / 0.1);
}

/* Table Handles */
.ob-table-handles {
  pointer-events: none;
  z-index: 100;
}

.ob-table-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: auto;
}

.ob-table-handle--visible {
  opacity: 1;
}

.ob-table-handle--row {
  width: 24px;
}

.ob-table-handle--col {
  height: 24px;
}

.ob-table-handle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: hsl(var(--ob-background, 0 0% 100%));
  border: 1px solid hsl(var(--ob-border, 214 32% 91%));
  border-radius: 4px;
  color: hsl(var(--ob-muted-foreground, 215 16% 47%));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ob-table-handle-btn:hover {
  background: hsl(var(--ob-muted, 210 40% 96%));
  color: hsl(var(--ob-foreground, 222 47% 11%));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ob-table-handle-btn svg {
  width: 12px;
  height: 12px;
}

.ob-table-handle-menu {
  position: fixed;
  background: hsl(var(--ob-background, 0 0% 100%));
  border: 1px solid hsl(var(--ob-border, 214 32% 91%));
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 4px;
  min-width: 150px;
  z-index: 1001;
  animation: ob-dropdown-fade-in 0.12s ease-out;
}

.ob-table-handle-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: hsl(var(--ob-foreground, 222 47% 11%));
  cursor: pointer;
  transition: background 0.1s ease;
  text-align: left;
  font-size: 13px;
  white-space: nowrap;
}

.ob-table-handle-menu button:hover {
  background: hsl(var(--ob-muted, 210 40% 96%));
}

.ob-table-handle-menu button svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.ob-table-handle-menu-danger {
  color: hsl(var(--ob-destructive, 0 84% 60%)) !important;
}

.ob-table-handle-menu-danger:hover {
  background: hsl(var(--ob-destructive, 0 84% 60%) / 0.1) !important;
}

.ob-table-extend-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: hsl(var(--ob-muted-foreground, 215 16% 47%) / 0.15);
  color: hsl(var(--ob-muted-foreground, 215 16% 47%));
  cursor: pointer;
  transition: all 0.15s ease;
  opacity: 0;
  pointer-events: auto;
  border-radius: 4px;
}

.ob-table-extend-btn--visible,
.ob-table-handles:hover .ob-table-extend-btn {
  opacity: 1;
}

.ob-table-extend-btn:hover {
  color: hsl(var(--ob-foreground, 222 47% 11%));
  background: hsl(var(--ob-muted-foreground, 215 16% 47%) / 0.3);
}

.ob-table-extend-btn svg {
  width: 14px;
  height: 14px;
}

.ob-table-extend-btn--col {
  width: 20px;
}

.ob-table-extend-btn--row {
  height: 20px;
}

.ob-table-cell .ob-side-menu,
.ob-table-header .ob-side-menu,
td .ob-side-menu,
th .ob-side-menu,
.openblock-editor table .ob-side-menu {
  display: none !important;
}

/* Checklist / To-do List */
.openblock-editor ul.openblock-checklist {
  padding-left: 0;
}

.openblock-checklist {
  list-style: none !important;
  list-style-type: none !important;
  margin: 0;
  padding: 0 !important;
  padding-left: 0 !important;
}

.openblock-checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
  margin: 0.25em 0;
  padding-left: 0.25em;
  position: relative;
  list-style: none !important;
  list-style-type: none !important;
}

.openblock-checklist > .openblock-checklist-item::marker {
  content: none;
}

.openblock-checklist > .openblock-checklist-item::before {
  content: none;
  display: none;
}

.openblock-checklist-label {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.2em;
}

.openblock-checklist-checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: hsl(var(--ob-primary));
}

.openblock-checklist-content {
  flex: 1;
  min-width: 0;
}

.openblock-checklist-item--checked .openblock-checklist-content {
  text-decoration: line-through;
  color: hsl(var(--ob-muted-foreground));
}

/* Image Block */
.openblock-image {
  margin: 0.5em 0;
  text-align: center;
}

.openblock-image--left {
  text-align: left;
}

.openblock-image--center {
  text-align: center;
}

.openblock-image--right {
  text-align: right;
}

.openblock-image img {
  max-width: 100%;
  height: auto;
  border-radius: var(--ob-radius);
}

.openblock-image figcaption {
  margin-top: 0.5em;
  font-size: 0.875em;
  color: hsl(var(--ob-muted-foreground));
  text-align: center;
}

/* Image Placeholder */
.openblock-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 2em;
  background: hsl(var(--ob-muted));
  border: 2px dashed hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.openblock-image-placeholder:hover {
  background: hsl(var(--ob-muted) / 0.7);
  border-color: hsl(var(--ob-muted-foreground));
}

.openblock-image-placeholder-icon {
  display: block;
  width: 48px;
  height: 48px;
  margin-bottom: 0.75em;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpath d='M21 15l-5-5L5 21'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.openblock-image-placeholder-text {
  font-size: 0.875em;
  color: hsl(var(--ob-muted-foreground));
}

/* Embed Block */
.openblock-embed {
  margin: 0.5em 0;
}

.openblock-embed-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--ob-radius);
  background: hsl(var(--ob-muted));
}

.openblock-embed-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.openblock-embed-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: hsl(var(--ob-muted-foreground));
}

.openblock-embed-caption {
  margin-top: 0.5em;
  font-size: 0.875em;
  color: hsl(var(--ob-muted-foreground));
  text-align: center;
}

/* Media Menu */
.ob-media-menu {
  --ob-foreground: var(--foreground, 222 47% 11%);
  --ob-background: var(--background, 0 0% 100%);
  --ob-muted: var(--muted, 210 40% 96%);
  --ob-muted-foreground: var(--muted-foreground, 215 16% 47%);
  --ob-border: var(--border, 214 32% 91%);
  --ob-primary: var(--primary, 222 47% 11%);
  --ob-radius: var(--radius, 0.5rem);
  display: flex;
  align-items: center;
  gap: 1px;
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 4px 6px;
  position: relative;
}

.ob-media-menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: hsl(var(--ob-muted-foreground));
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.ob-media-menu-btn svg {
  width: 15px;
  height: 15px;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ob-media-menu-btn:hover {
  background: hsl(var(--ob-muted));
  color: hsl(var(--ob-foreground));
}

.ob-media-menu-btn--active {
  background: hsl(215 20% 85%);
  color: hsl(var(--ob-foreground));
}

.ob-media-menu-btn--active:hover {
  background: hsl(215 20% 80%);
  color: hsl(var(--ob-foreground));
}

.ob-media-menu-btn--danger:hover {
  background: hsl(0 84% 60% / 0.1);
  color: hsl(0 84% 60%);
}

.ob-media-menu-divider {
  width: 1px;
  height: 16px;
  background: hsl(var(--ob-border));
  margin: 0 6px;
  flex-shrink: 0;
}

.ob-media-url-popover {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: hsl(var(--ob-background));
  border: 1px solid hsl(var(--ob-border));
  border-radius: var(--ob-radius);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
  padding: 12px;
  min-width: 280px;
  z-index: 1001;
}

.ob-media-url-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--ob-muted-foreground));
  margin-bottom: 8px;
}

.ob-media-url-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid hsl(var(--ob-border));
  border-radius: 4px;
  font-size: 13px;
  color: hsl(var(--ob-foreground));
  background: hsl(var(--ob-background));
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.ob-media-url-input:focus {
  border-color: hsl(var(--ob-primary));
  box-shadow: 0 0 0 2px hsl(var(--ob-primary) / 0.1);
}

.ob-media-url-input::placeholder {
  color: hsl(var(--ob-muted-foreground));
}

.ob-media-url-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.ob-media-url-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ob-media-url-btn--cancel {
  background: hsl(var(--ob-muted));
  color: hsl(var(--ob-foreground));
}

.ob-media-url-btn--cancel:hover {
  background: hsl(var(--ob-border));
}

.ob-media-url-btn--save {
  background: hsl(var(--ob-primary));
  color: hsl(var(--ob-background));
}

.ob-media-url-btn--save:hover {
  opacity: 0.9;
}
`;

/**
 * Inject OpenBlock styles into the document head.
 *
 * This function is idempotent - calling it multiple times will only inject styles once.
 *
 * @returns true if styles were injected, false if they were already present
 *
 * @example
 * ```typescript
 * import { injectStyles } from '@openblock/core';
 *
 * // Automatically inject styles (called by editor by default)
 * injectStyles();
 * ```
 */
export function injectStyles(): boolean {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    return false;
  }

  // Don't inject twice
  if (stylesInjected || document.getElementById(STYLE_ID)) {
    stylesInjected = true;
    return false;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = EDITOR_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;

  return true;
}

/**
 * Remove injected OpenBlock styles from the document.
 *
 * Useful for cleanup in single-page applications or when unmounting the editor.
 *
 * @example
 * ```typescript
 * import { removeStyles } from '@openblock/core';
 *
 * // Clean up when done
 * removeStyles();
 * ```
 */
export function removeStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
    stylesInjected = false;
  }
}

/**
 * Check if OpenBlock styles have been injected.
 *
 * @returns true if styles are present in the document
 */
export function areStylesInjected(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return stylesInjected || !!document.getElementById(STYLE_ID);
}
