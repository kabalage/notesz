<script setup lang="ts">
import { watch, shallowRef, onUnmounted, ref, onMounted, computed } from 'vue';

import { defaultHighlightStyle, LanguageDescription, syntaxHighlighting }
  from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { drawSelection, EditorView, highlightSpecialChars, keymap,
  placeholder as placeholderExtension }
  from '@codemirror/view';
import { darkTheme, draculaTheme } from '@/utils/codemirror/themes';
import { indentedLineWrap } from '@/utils/codemirror/indent-line-wrap';
import { hyperLink } from '@/utils/codemirror/hyperlink';
import { closeBrackets, closeBracketsKeymap, insertBracket } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, search, openSearchPanel }
  from '@codemirror/search';
import { Compartment, EditorState } from '@codemirror/state';
import * as commands from '@codemirror/commands';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import { isIos } from '@/utils/iDeviceDetection';
import {
  VirtualKeyboardEvents,
  handleShowIos,
  handleShowNonIos,
  type VirtualKeyboardChangeEvent,
} from '@/utils/VirtualKeyboardEvents';

import { useService } from '@/utils/injector';
import { Settings } from '@/services/Settings';

const props = defineProps<{
  value: string
}>();
const emit = defineEmits(['changeSignal', 'focus', 'blur']);

// console.log('CodemirrorEditor setup');

const wrapper = ref<HTMLDivElement | null>(null);

const settings = useService(Settings);
const isFocused = ref(false);

const cmEditorView = shallowRef<EditorView>();
let lastGetDocumentTime = 0;
let lastGetDocumentResult: string | undefined;
const isTouchDevice = useIsTouchDevice();

const placeholder = computed(() => {
  if (isFocused.value || props.value) {
    return '';
  }
  if (isTouchDevice.value) {
    return 'Tap to start editing...';
  } else {
    return 'Click to start editing...';
  }
});

const fontSize = computed(() => {
  if (settings.data?.editorFontSize) {
    return `${settings.data.editorFontSize}rem`;
  } else {
    return '0.875rem';
  }
});

const syntaxThemes = {
  'dracula': draculaTheme,
  'notesz': darkTheme
};

const compartments = {
  placeholder: new Compartment(),
  gutter: new Compartment(),
  fontSize: new Compartment()
};

function fontSizeExtension(fontSize: string) {
  return EditorView.theme({ '&': { fontSize } });
}

const extensions = [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
  highlightSelectionMatches(),
  closeBrackets(),
  hyperLink,
  search(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    indentWithTab
  ]),
  markdown({
    codeLanguages: [
      LanguageDescription.of({
        name: 'javascript',
        alias: ['js'],
        load: async () => {
          return (await import('@codemirror/lang-javascript')).javascript();
        }
      }),
      LanguageDescription.of({
        name: 'typescript',
        alias: ['ts'],
        load: async () => {
          return (await import('@codemirror/lang-javascript')).javascript({
            typescript: true
          });
        }
      })
    ],
    base: markdownLanguage
  }),
  markdownLanguage.data.of({
    closeBrackets: {
      brackets: ['(', '[', '{', '\'', '"', '`'],
      before: ')]}:;>',
      stringPrefixes: []
    }
  }),
  syntaxThemes[settings.data?.syntaxTheme || 'notesz'],
  EditorView.lineWrapping,
  EditorView.theme({
    '&': {
      height: '100%'
    },
    '.cm-line': {
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem'
    },
    '.cm-content': {
      paddingTop: '1rem',
      paddingBottom: '4rem',
      textUnderlineOffset: '0.2rem',
      boxShadow: 'none'
    },
    '.cm-editor': {
      overflow: 'hidden'
    },
    '.cm-placeholder': {
      textAlign: 'center',
      display: 'block',
      fontSize: '1rem'
    },
    '.cm-scroller': {
      overscrollBehavior: 'contain',
      '-webkit-overflow-scrolling': 'touch'
    },
    '.cm-hyper-link-underline > *': {
      wordBreak: 'break-all' // urls should be breakable anywhere
    }
  }),
  EditorView.updateListener.of((viewUpdate) => {
    if (viewUpdate.docChanged) {
      emit('changeSignal');
    }
  }),
  EditorView.domEventHandlers({
    blur() {
      isFocused.value = false;
      emit('blur');
    },
    focus() {
      isFocused.value = true;
      emit('focus');
    }
  }),
  EditorView.contentAttributes.of({
    autocapitalize: settings.data?.autocapitalize ? 'on' : 'off',
    autocorrect: settings.data?.autocorrect ? 'on' : 'off',
    spellcheck: settings.data?.spellcheck ? 'true' : 'false'
  }),
  EditorState.tabSize.of(4),
  indentedLineWrap,
  compartments.placeholder.of(placeholderExtension(placeholder.value)),
  compartments.fontSize.of(fontSizeExtension(fontSize.value)),
  // compartments.gutter.of([
  //   lineNumbers(),
  //   highlightActiveLine(),
  //   highlightActiveLineGutter(),
  //   EditorView.theme({
  //     '.cm-scroller': {
  //       borderTop: '2px solid rgb(255 255 255 / 0.2)',
  //       backgroundColor: 'rgb(0 0 0 / 0.35)'
  //     },
  //     '.cm-line': {
  //       paddingLeft: '0.75rem !important',
  //     },
  //     '.cm-gutters': {
  //       backgroundColor: 'rgb(var(--color-background))',
  //       color: 'rgba(255 255 255 / 35%)',
  //       borderRight: '2px solid rgb(255 255 255 / 0.2)'
  //     },
  //     '.cm-lineNumbers': {
  //       backgroundColor: 'rgb(0 0 0 / 1)'
  //     },
  //     '.cm-lineNumbers .cm-gutterElement': {
  //       paddingRight: '0.75rem',
  //       paddingLeft: '0.75rem',
  //     }
  //   }),
  // ])
];

onMounted(() => {
  if (!wrapper.value) return;

  cmEditorView.value = new EditorView({
    doc: props.value,
    parent: wrapper.value,
    extensions
  });
  VirtualKeyboardEvents.onChange(onVirtualKeyboardChange);

  watch(() => props.value, setDocIfNew);
  watch(() => placeholder.value, reconfigurePlaceholder);
  watch(() => fontSize.value, reconfigureFontSize);

  doAutoFocus();
});

onUnmounted(() => {
  VirtualKeyboardEvents.off(onVirtualKeyboardChange);
});

function onVirtualKeyboardChange(event: VirtualKeyboardChangeEvent) {
  if (event.visible) {
    event.preventDefault();
    handleShowIos(event);
    handleShowNonIos(event);
    scrollIntoView();
  }
}

function doAutoFocus() {
  if (!cmEditorView.value) return;
  if (!isTouchDevice.value || (!isIos && props.value === '')) {
    cmEditorView.value.focus();
  }
}

function setDocIfNew(newDoc: string) {
  if (Date.now() - lastGetDocumentTime > 1000 && newDoc !== lastGetDocumentResult) {
    setDoc(newDoc);
  }
}

function setDoc(newDoc: string) {
  if (!cmEditorView.value) return;
  cmEditorView.value.dispatch({
    changes: {
      from: 0,
      to: cmEditorView.value.state.doc.length,
      insert: newDoc
    }
  });
}

function reconfigurePlaceholder(placeholder: string) {
  if (!cmEditorView.value) return;
  cmEditorView.value.dispatch({
    effects: compartments.placeholder.reconfigure(placeholderExtension(placeholder))
  });
}

function reconfigureFontSize(fontSize: string) {
  if (!cmEditorView.value) return;
  cmEditorView.value.dispatch({
    effects: compartments.fontSize.reconfigure(fontSizeExtension(fontSize))
  });
}

// Exposed functions

function getDocument() {
  if (!cmEditorView.value) return '';
  lastGetDocumentTime = Date.now();
  lastGetDocumentResult = cmEditorView.value.state.doc.toString();
  return lastGetDocumentResult;
}

function insertText(text: string) {
  if (!cmEditorView.value) return;
  const range = cmEditorView.value.state.selection.ranges[0];
  cmEditorView.value.dispatch({
    changes: {
      from: range.from,
      to: range.to,
      insert: text
    },
    selection: {
      anchor: range.from + text.length,
    }
  });
  scrollIntoView();
}

function scrollIntoView() {
  if (!cmEditorView.value) return;
  cmEditorView.value.dispatch({
    effects: EditorView.scrollIntoView(cmEditorView.value.state.selection.ranges[0], {
      y: 'nearest',
      yMargin: 48
    })
  });
}

function getSelectionText() {
  if (!cmEditorView.value) return '';
  const range = cmEditorView.value.state.selection.ranges[0];
  return cmEditorView.value.state.doc.sliceString(range.from, range.to);
}

function insertBrackets(bracket: string, pair?: string) {
  if (!cmEditorView.value) return;
  const range = cmEditorView.value.state.selection.ranges[0];
  if (range.from !== range.to) {
    const tr = insertBracket(cmEditorView.value.state, bracket);
    if (!tr) {
      console.error('insertBracket did not return a transaction');
      return;
    }
    cmEditorView.value.dispatch(tr);
  } else {
    if (!pair) {
      const pairs = { '(': ')', '[': ']', '{': '}', '<': '>' } as Record<string, string>;
      pair = pairs[bracket] || bracket;
    }
    cmEditorView.value.dispatch({
      changes: {
        from: range.from,
        to: range.to,
        insert: `${bracket}${pair}`
      },
      selection: {
        anchor: range.from + bracket.length
      }
    });
  }
}

function moveCursorLeft() {
  if (!cmEditorView.value) return;
  commands.cursorCharLeft(cmEditorView.value);
}
function moveCursorRight() {
  if (!cmEditorView.value) return;
  commands.cursorCharRight(cmEditorView.value);
}
function moveCursorUp() {
  if (!cmEditorView.value) return;
  commands.cursorLineUp(cmEditorView.value);
}
function moveCursorDown() {
  if (!cmEditorView.value) return;
  commands.cursorLineDown(cmEditorView.value);
}
function moveCursorLineStart() {
  if (!cmEditorView.value) return;
  commands.cursorLineBoundaryBackward(cmEditorView.value);
}
function moveCursorLineEnd() {
  if (!cmEditorView.value) return;
  commands.cursorLineBoundaryForward(cmEditorView.value);
}
function moveCursorDocStart() {
  if (!cmEditorView.value) return;
  commands.cursorDocStart(cmEditorView.value);
}
function moveCursorDocEnd() {
  if (!cmEditorView.value) return;
  commands.cursorDocEnd(cmEditorView.value);
}

function selectLeft() {
  if (!cmEditorView.value) return;
  commands.selectCharLeft(cmEditorView.value);
}
function selectRight() {
  if (!cmEditorView.value) return;
  commands.selectCharRight(cmEditorView.value);
}
function selectUp() {
  if (!cmEditorView.value) return;
  commands.selectLineUp(cmEditorView.value);
}
function selectDown() {
  if (!cmEditorView.value) return;
  commands.selectLineDown(cmEditorView.value);
}

function selectLineStart() {
  if (!cmEditorView.value) return;
  commands.selectLineBoundaryLeft(cmEditorView.value);
}
function selectLineEnd() {
  if (!cmEditorView.value) return;
  commands.selectLineBoundaryRight(cmEditorView.value);
}
function selectDocStart() {
  if (!cmEditorView.value) return;
  commands.selectDocStart(cmEditorView.value);
}
function selectDocEnd() {
  if (!cmEditorView.value) return;
  commands.selectDocEnd(cmEditorView.value);
}

function indentMore() {
  if (!cmEditorView.value) return;
  commands.indentMore(cmEditorView.value);
}
function indentLess() {
  if (!cmEditorView.value) return;
  commands.indentLess(cmEditorView.value);
}
function undo() {
  if (!cmEditorView.value) return;
  commands.undo(cmEditorView.value);
}
function redo() {
  if (!cmEditorView.value) return;
  commands.redo(cmEditorView.value);
}
async function moveLineDown() {
  if (!cmEditorView.value) return;
  commands.moveLineDown(cmEditorView.value);
  scrollIntoView();
}
function moveLineUp() {
  if (!cmEditorView.value) return;
  commands.moveLineUp(cmEditorView.value);
  scrollIntoView();
}
function openSearch() {
  if (!cmEditorView.value) return;
  openSearchPanel(cmEditorView.value);
}

function focus() {
  if (!cmEditorView.value) return;
  cmEditorView.value.focus();
}

async function copyToClipboard() {
  const text = getSelectionText();
  if (text) {
    await navigator.clipboard.writeText(text);
  }
}

async function pasteFromClipboard() {
  const text = await navigator.clipboard.readText();
  insertText(text);
}

defineExpose({
  getDocument,
  insertBrackets,
  insertText,
  getSelectionText,
  moveCursorLeft,
  moveCursorRight,
  moveCursorUp,
  moveCursorDown,
  moveCursorLineStart,
  moveCursorLineEnd,
  moveCursorDocStart,
  moveCursorDocEnd,
  selectLeft,
  selectRight,
  selectUp,
  selectDown,
  selectLineStart,
  selectLineEnd,
  selectDocStart,
  selectDocEnd,
  indentMore,
  indentLess,
  undo,
  redo,
  moveLineDown,
  moveLineUp,
  openSearch,
  focus,
  copyToClipboard,
  pasteFromClipboard
});

</script>

<template>
  <div
    ref="wrapper"
    class="!block select-auto cursor-text [&_.cm-placeholder]:font-sans
      [&_.cm-placeholder]:text-main-200/60"
  />
</template>
