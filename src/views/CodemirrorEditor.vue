<script setup lang="ts">
import { watch, shallowRef, inject, onUnmounted, ref, type App, type RendererElement } from 'vue';
import { Codemirror } from 'vue-codemirror';
import VueCodemirror from 'vue-codemirror';
import { defaultHighlightStyle, LanguageDescription, syntaxHighlighting }
  from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { drawSelection, EditorView, highlightSpecialChars, keymap }
  from '@codemirror/view';
import { darkTheme, draculaTheme } from '@/utils/codeMirrorTheme';
import { closeBrackets, closeBracketsKeymap, insertBracket } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, search, openSearchPanel }
  from '@codemirror/search';
import type { EditorState } from '@codemirror/state';
import * as commands from '@codemirror/commands';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import { isIos } from '@/utils/iDeviceDetection';
import {
  VirtualKeyboardEvents,
  handleShowIos,
  handleShowNonIos,
  type VirtualKeyboardChangeEvent,
} from '@/utils/VirtualKeyboardEvents';
import { useSettings } from '@/services/settingsService';

const props = defineProps<{
  value: string
}>();
const emit = defineEmits(['input', 'focus', 'blur']);
const isFocused = ref(false);

// TODO temporary solution until this gets sorted out:
// https://github.com/surmon-china/vue-codemirror/issues/167
const app = inject('app') as App<RendererElement>;
if (!app._context.components.VueCodemirror) {
  app.use(VueCodemirror, {
    // keep the global default extensions empty
    extensions: []
  });
}

const settings = useSettings();

const syntaxThemes = {
  'dracula': draculaTheme,
  'notesz': darkTheme
};

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
    ...historyKeymap
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
    }
  }),
  // EditorView.updateListener.of((v: ViewUpdate) => {
  //   console.log('Codemirror ViewUpdate', v);
  //   if (v.docChanged) {
  //     // Document changed
  //   }
  // }),
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
];

const cmEditorView = shallowRef<EditorView>();
const modelValue = ref(props.value);
let lastEmitTime = 0;
let lastEmitValue: string | undefined;
const isTouchDevice = useIsTouchDevice();

function onReady(payload: {
  view: EditorView;
  state: EditorState;
  container: HTMLDivElement;
}) {
  console.log('Codemirror ready', payload.state);
  cmEditorView.value = payload.view;

  VirtualKeyboardEvents.onChange(onVirtualKeyboardChange);
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

}

watch(() => props.value, (newContents) => {
  if (Date.now() - lastEmitTime > 1000 && newContents !== lastEmitValue) {
    modelValue.value = newContents;
  }
}, { immediate: true });

function onChange(newContents: string) {
  // Change is called on every input. We just save the value and emit change when blur occurs.
  lastEmitValue = newContents;
  lastEmitTime = Date.now();
  modelValue.value = newContents;
  emit('input', newContents);
  console.log('change', newContents.slice(0, 10));
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
  <Codemirror
    :model-value="modelValue"
    @update:model-value="onChange"
    class="!block select-auto cursor-text"
    :class="{
      '[&_.cm-placeholder]:font-sans [&_.cm-placeholder]:text-main-200/60':
        props.value === '' && !isFocused
    }"
    :style="{
      height: '100%',
      fontSize: settings.data?.editorFontSize
        ? `${settings.data.editorFontSize}rem`
        : '0.875rem'

    }"
    :autofocus="!isTouchDevice || (!isIos && props.value === '')"
    :placeholder="!isFocused
      ? isTouchDevice
        ? 'Tap to start editing...'
        : 'Click to start editing...'
      : ''"
    :indent-with-tab="true"
    :tab-size="2"
    :extensions="extensions"
    @ready="onReady"
  />
</template>
