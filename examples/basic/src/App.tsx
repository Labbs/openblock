import { useOpenBlock, OpenBlockView, useEditorContent, SlashMenu, BubbleMenu } from '@openblock/react';
import { sampleDocument } from './data';
import '@openblock/core/styles/editor.css';
import './styles.css';

export default function App() {
  const editor = useOpenBlock({
    initialContent: sampleDocument,
  });

  const blocks = useEditorContent(editor);

  return (
    <div className="app">
      <header className="header">
        <h1>OpenBlock Demo</h1>
        <p>A fully open-source editor with public ProseMirror API</p>
      </header>

      <div className="container">
        <div className="editor-section">
          <div className="toolbar">
            <button onClick={() => editor.toggleBold()} title="Bold (Cmd+B)">
              <strong>B</strong>
            </button>
            <button onClick={() => editor.toggleItalic()} title="Italic (Cmd+I)">
              <em>I</em>
            </button>
            <button onClick={() => editor.toggleUnderline()} title="Underline (Cmd+U)">
              <u>U</u>
            </button>
            <button onClick={() => editor.toggleStrikethrough()} title="Strikethrough">
              <s>S</s>
            </button>
            <button onClick={() => editor.toggleCode()} title="Code">
              {'</>'}
            </button>
            <span className="separator" />
            <button onClick={() => console.log(editor.getDocument())} title="Log document to console">
              Log JSON
            </button>
            <button onClick={() => console.log(editor.pm.state)} title="Log ProseMirror state">
              Log PM State
            </button>
          </div>

          <div className="editor-wrapper">
            <OpenBlockView editor={editor} />
            <SlashMenu editor={editor} />
            <BubbleMenu editor={editor} />
          </div>
        </div>

        <div className="json-section">
          <h3>Document JSON</h3>
          <pre>{JSON.stringify(blocks, null, 2)}</pre>
        </div>
      </div>

      <footer className="footer">
        <p>
          <code>editor.pm.view</code> → EditorView |{' '}
          <code>editor.pm.state</code> → EditorState |{' '}
          <code>editor.pm.dispatch(tr)</code> → dispatch
        </p>
      </footer>
    </div>
  );
}
