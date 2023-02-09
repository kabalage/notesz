<script setup lang="ts">
import { shallowRef, inject, onUnmounted, ref, type App, type RendererElement } from 'vue';
import { Codemirror } from 'vue-codemirror';
import VueCodemirror from 'vue-codemirror';
import { defaultHighlightStyle, LanguageDescription, syntaxHighlighting }
  from '@codemirror/language';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { drawSelection, EditorView, highlightSpecialChars, keymap }
  from '@codemirror/view';
import { darkTheme } from '@/utils/codeMirrorTheme';
import { closeBrackets, closeBracketsKeymap, insertBracket } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches, search, openSearchPanel }
  from '@codemirror/search';
import type { EditorState } from '@codemirror/state';
import * as commands from '@codemirror/commands';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { hyperLink } from '@uiw/codemirror-extensions-hyper-link';
import useIsTouchDevice from '@/composables/useIsTouchDevice';

const props = defineProps<{
  note: string
}>();
const emit = defineEmits(['input', 'change', 'focus', 'blur']);

// TODO temporary solution until this gets sorted out:
// https://github.com/surmon-china/vue-codemirror/issues/167
const app = inject('app') as App<RendererElement>;
if (!app._context.components.VueCodemirror) {
  app.use(VueCodemirror, {
    // keep the global default extensions empty
    extensions: []
  });
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
  darkTheme,
  EditorView.lineWrapping,
  EditorView.theme({
    '.cm-line': {
      paddingLeft: '1.5rem',
      paddingRight: '1.5rem'
    },
    '.cm-content': {
      paddingTop: '1rem',
      paddingBottom: '1rem',
      textUnderlineOffset: '0.2rem'
    },
    '.cm-editor': {
      overflow: 'hidden'
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
      // console.log('Codemirror blur');
      emit('blur');
      emitChange();
    },
    focus() {
      // console.log('Codemirror focus');
      emit('focus');
    }
  }),
  EditorView.contentAttributes.of({
    autocapitalize: 'on',
    autocorrect: 'on',
    // spellcheck: 'true'
  }),
];

const cmEditorView = shallowRef<EditorView>();
const modelValue = ref(props.note); // maybe watch prop
const emittedValue = ref(props.note);
const isTouchDevice = useIsTouchDevice();

function onReady(payload: {
  view: EditorView;
  state: EditorState;
  container: HTMLDivElement;
}) {
  cmEditorView.value = payload.view;
  setupVisualViewportHack(payload.view);
}

function emitChange() {
  if (modelValue.value !== emittedValue.value) {
    emittedValue.value = modelValue.value;
    emit('change', modelValue.value);
  }
}

function onChange(newContents: string) {
  // Change is called on every input. We just save the value and emit change when blur occurs.
  modelValue.value = newContents;
  emit('input', newContents);
  // console.log('change', newContents.slice(0, 10));
}

function setupVisualViewportHack(editorView: EditorView) {
  // Resize the documentElement on iOS when the virtual keyboard is visible
  if (window.visualViewport) {
    const isIphone = /iPhone/.test(window.navigator.userAgent);
    const isIpad = /iPad/.test(window.navigator.userAgent)
      || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      && !isIphone;
    const handler = () => {
      // console.log('resize', window.navigator.userAgent);
      if (isIphone || isIpad) {
        const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
        // console.log(window.visualViewport!.height, document.documentElement.scrollTop,
        //   editorView.hasFocus, window.visualViewport);
        if (editorView.hasFocus) {
          document.documentElement.scrollTop = 0;
          const resizeToHeight = isInstalled && isIpad
            ? window.visualViewport!.height - 1 - 24
              // 1px for a border above the keyboard
              // 24px magic offset to fix reported standalone safari viewport height on the iPad
            : window.visualViewport!.height - 1;
          document.documentElement.style.height = `${resizeToHeight}px`;

          editorView.dispatch({
            effects: EditorView.scrollIntoView(editorView.state.selection.ranges[0], {
              y: 'nearest',
              yMargin: 16
            })
          });
        } else {
          document.documentElement.style.height = '';
        }
      }
    };
    const scrollHandler = (event: Event) => {
      // console.log('visualViewport scroll', event);
      if (isIphone || isIpad) {
        requestAnimationFrame(() => {
          // At a specific position 0 does not work, but -1 does
          document.documentElement.scrollTop = -1;
        });
      }
    };
    window.visualViewport.addEventListener('resize', handler);
    window.visualViewport.addEventListener('scroll', scrollHandler);
    onUnmounted(() => {
      window.visualViewport?.removeEventListener('resize', handler);
      window.visualViewport?.removeEventListener('scroll', scrollHandler);
    });
  }
}

function insertText(text: string) {
  if (!cmEditorView.value) return;
  const range = cmEditorView.value.state.selection.ranges[0];
  // console.log(range);
  // cmEditorView.value.dispatch({
  //   selection: {
  //     anchor: range.from + 1
  //   }
  // });
  cmEditorView.value.dispatch({
    changes: {
      from: range.from,
      to: range.to,
      insert: text
    },
    selection: {
      anchor: range.from + 1,
    }
  });
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
function moveLineDown() {
  if (!cmEditorView.value) return;
  commands.moveLineDown(cmEditorView.value);
}
function moveLineUp() {
  if (!cmEditorView.value) return;
  commands.moveLineUp(cmEditorView.value);
}
function openSearch() {
  if (!cmEditorView.value) return;
  openSearchPanel(cmEditorView.value);
}

function focus() {
  if (!cmEditorView.value) return;
  cmEditorView.value.focus();
}

defineExpose({
  insertBrackets,
  insertText,
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
  focus
});

</script>

<template>
  <Codemirror
    :model-value="props.note"
    @update:model-value="onChange"
    class="!block text-sm select-auto"
    :style="{ height: '100%' }"
    :autofocus="!isTouchDevice"
    :indent-with-tab="true"
    :tab-size="2"
    :extensions="extensions"
    @ready="onReady"
  />
</template>
