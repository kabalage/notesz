import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import {
  StateField,
  type EditorState,
  type Line,
  type Range,
  type Extension,
  type Transaction
} from '@codemirror/state';

const indentedLineWrapExtension = StateField.define({
  create: getAllDecorations,
  update: updateDecorations,
  provide: (field) => EditorView.decorations.from(field)
});

const theme = EditorView.theme({
  '.indented-wrapped-line': {
    borderLeft: 'transparent solid calc(var(--indented))',
  },
  '.indented-wrapped-line:before': {
    content: '""',
    marginLeft: 'calc(-1 * var(--indented))',
  },
  '.cm-gutters, .cm-activeLineGutter': {
    background: 'transparent',
  }
});

export const indentedLineWrap: Extension = [indentedLineWrapExtension, theme];

function getAllDecorations(state: EditorState) {
  const decorations: Array<Range<Decoration>> = [];

  for (let i = 0; i < state.doc.lines; i++) {
    const line = state.doc.line(i + 1);
    const decoration = getDecorationForLine(line, state.tabSize);
    if (decoration) {
      decorations.push(decoration);
    }
  }

  return Decoration.set(decorations);
}

function getDecorationForLine(
  line: Line,
  tabSize: number
): Range<Decoration> | null {
  const offset = getOffset(line.text, tabSize);

  if (offset === 0) return null;

  const lineDecoration = Decoration.line({
    attributes: {
      style: `--indented: ${offset}ch;`,
      class: 'indented-wrapped-line'
    }
  });

  return lineDecoration.range(line.from, line.from);
}

function getOffset(line: string, tabSize: number) {
  const spaces = (line.match(/^ */)?.[0] ?? '').length;
  let offset = spaces;
  if (offset === 0) {
    const tabs = (line.match(/^\t*/)?.[0] ?? '').length;
    offset = tabs * tabSize;
  }
  const listDecoration = (line.match(/^[\s]*(- *|\* *|\+ *|\d+\. *)/)?.[1] ?? '').length;
  offset += listDecoration;
  return offset;
}

function updateDecorations(decorations: DecorationSet, tr: Transaction) {
  if (!tr.docChanged) return decorations;
  // return getDecorations(tr.state);

  const mappedDecorations = decorations.map(tr.changes);

  const changedLineRanges: Array<{ from: number; to: number }> = [];
  tr.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
    changedLineRanges.push({ from: fromB, to: toB });
  });

  const newDecorations: Array<Range<Decoration>> = [];
  for (const range of changedLineRanges) {
    let pos = range.from;
    while (pos <= range.to) {
      const line = tr.state.doc.lineAt(pos);
      const decoration = getDecorationForLine(line, tr.state.tabSize);

      if (decoration) {
        newDecorations.push(decoration);
      }

      if (pos === line.to) break;
      pos = line.to + 1;
    }
  }

  return mappedDecorations.update({
    filter: (from) => {
      const line = tr.state.doc.lineAt(from);
      return !changedLineRanges.some(range =>
        line.from <= range.to && line.to >= range.from
      );
    },
    add: newDecorations
  });
}
