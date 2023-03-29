<script setup lang="ts">
import { ref, defineAsyncComponent, onBeforeUnmount } from 'vue';

import IndentRightIcon from '@/assets/icons/indent-right.svg?component';
import IndentLeftIcon from '@/assets/icons/indent-left.svg?component';
import MoveLinesUpIcon from '@/assets/icons/move-lines-up.svg?component';
import MoveLinesDownIcon from '@/assets/icons/move-lines-down.svg?component';
import CursorUpIcon from '@/assets/icons/cursor-up.svg?component';
import CursorDownIcon from '@/assets/icons/cursor-down.svg?component';
import CursorLeftIcon from '@/assets/icons/cursor-left.svg?component';
import CursorRightIcon from '@/assets/icons/cursor-right.svg?component';
import CursorDocStartIcon from '@/assets/icons/cursor-doc-start.svg?component';
import CursorDocEndIcon from '@/assets/icons/cursor-doc-end.svg?component';
import CursorLineStartIcon from '@/assets/icons/cursor-line-start.svg?component';
import CursorLineEndIcon from '@/assets/icons/cursor-line-end.svg?component';
import UndoIcon from '@/assets/icons/undo.svg?component';
import RedoIcon from '@/assets/icons/redo.svg?component';
import SidebarIcon from '@/assets/icons/sidebar.svg?component';
import TextSelectIcon from '@/assets/icons/text-select.svg?component';
import TextSelectActiveIcon from '@/assets/icons/text-select-active.svg?component';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component';
import TrashIcon from '@/assets/icons/trash.svg?component';
import SyncIcon from '@/assets/icons/sync.svg?component';
import CheckIcon from '@/assets/icons/check.svg?component';
import ClipboardCopyIcon from '@/assets/icons/clipboard-copy.svg?component';
import ClipboardPasteIcon from '@/assets/icons/clipboard-paste.svg?component';

import EmptyPlaceholder from './EmptyPlaceholder.vue';
import MessageBox from '@/components/MessageBox.vue';
import ButtonBarMobile from '@/components/ButtonBarMobile.vue';
import ButtonBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import RibbonButton from '@/components/RibbonButton.vue';
import IconButton from '@/components/IconButton.vue';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';

import { useService } from '@/utils/injector';
import { EditorService } from '@/services/EditorService';

const CodemirrorEditor = defineAsyncComponent({
  loader: () => import('./CodemirrorEditor.vue'),
  loadingComponent: EmptyPlaceholder,
  delay: 0
});

const editorService = useService(EditorService);
const isTouchDevice = useIsTouchDevice();
const editorFocused = ref<boolean>(false);
const selectMode = ref<boolean>(false);
let editorBlurTimeout: ReturnType<typeof setTimeout> | undefined;

const codemirrorEditor = ref<InstanceType<typeof CodemirrorEditor> | null>(null);

async function onNoteInput(newValue: string) {
  // console.log('input', editorService.currentFile?.path);
  editorService.currentFileBlob.data = newValue;
}

function onEditorFocus() {
  if (editorBlurTimeout) {
    clearTimeout(editorBlurTimeout);
    editorBlurTimeout = undefined;
  }
  editorFocused.value = true;
}

function onEditorBlur() {
  editorBlurTimeout = setTimeout(() => {
    editorFocused.value = false;
    editorService.currentFileBlob.flushThrottledPut();
  }, 200);
}

onBeforeUnmount(() => {
  editorService.currentFileBlob.flushThrottledPut();
});

</script>

<template>
  <main class="overflow-hidden flex flex-col" aria-label="Opened file">
    <div
      v-if="!editorService.currentFile"
      class="self-center mt-16 text-main-200/60"
    >
      Select a file to edit...
    </div>
    <template v-if="editorService.currentFile">
      <header
        class="px-3 lg:px-11 py-6 flex justify-between items-center"
        aria-label="Document header"
      >
        <div class="flex-1 flex items-center">
          <IconButton
            class="hidden sm:block"
            aria-label="Toggle sidebar"
            @click="editorService.sidebarIsOpen = !editorService.sidebarIsOpen"
          >
            <SidebarIcon class="w-6 h-6" aria-hidden="true" />
          </IconButton>
        </div>
        <div
          class="flex flex-col-reverse justify-center truncate"
        >
          <h1
            class="flex-1 text-center text-lg font-semibold text-accent-300 leading-tight truncate"
          >
            {{ editorService.currentFileName }}
          </h1>
          <h2
            v-if="editorService.currentTree?.path"
            class="flex-1 text-center text-sm font-medium text-accent-300/60 leading-tight
              truncate"
            aria-hidden="true"
          >
            {{ editorService.currentTree.path }}
          </h2>
        </div>
        <div class="flex-1 flex items-center justify-end">
          <IconButton
            class="hidden sm:block"
            aria-label="Delete current file"
            @click="editorService.deleteCurrentFile()"
          >
            <TrashIcon class="w-6 h-6" aria-hidden="true" />
          </IconButton>
          <IconButton
            v-if="editorService.currentFile.conflicting"
            class="hidden sm:block"
            aria-label="Resolve conflict"
            @click="editorService.resolveConflict()"
          >
            <CheckIcon class="w-6 h-6" aria-hidden="true" />
          </IconButton>
        </div>
      </header>
      <div
        v-if="editorService.currentFile.conflictReason"
        class="px-3 lg:px-11 mb-2 lg:flex lg:justify-center"
      >
        <MessageBox
          :message="editorService.currentFile.conflictReason"
          type="warning"
        />
      </div>
      <CodemirrorEditor
        v-if="editorService.currentFileBlob.data !== undefined"
        id="codemirrorEditor"
        ref="codemirrorEditor"
        class="flex-1 overflow-hidden lg:mx-8"
        role="region"
        aria-label="Editor"
        :key="editorService.currentFile.path"
        :value="editorService.currentFileBlob.data"
        @input="onNoteInput"
        @focus="onEditorFocus"
        @blur="onEditorBlur"
      />
      <div v-else class="flex-1" />
      <Transition
        enter-active-class="duration-300 ease-out"
        enter-from-class="transform opacity-0 translate-y-full"
      >
        <ButtonBarMobile
          v-if="!editorFocused || !isTouchDevice"
          class="flex-none sm:hidden"
        >
          <ButtonBarMobileButton
            class="flex-1"
            aria-label="Back"
            @click="editorService.closeFile()"
          >
            <ArrowLeftIcon class="w-6 h-6" aria-hidden="true" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            class="flex-1"
            label="Sync"
            aria-:disabled="editorService.syncDisabled"
            @click="editorService.startSync()"
          >
            <SyncIcon class="w-6 h-6" aria-hidden="true" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            class="flex-1"
            aria-label="Delete"
            @click="editorService.deleteCurrentFile"
          >
            <TrashIcon class="w-6 h-6" aria-hidden="true" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            v-if="editorService.currentFile.conflicting"
            class="flex-1"
            aria-label="Resolve"
            @click="editorService.resolveConflict()"
          >
            <CheckIcon class="w-6 h-6" aria-hidden="true" />
          </ButtonBarMobileButton>
        </ButtonBarMobile>
      </Transition>
      <Transition
        enter-active-class="duration-300 ease-out delay-300"
        enter-from-class="transform opacity-0 translate-y-full"
      >
        <div
          v-if="editorFocused && isTouchDevice"
          class="flex flex-row pt-px sm:touch:pl-px"
        >
          <div
            class="flex-1 px-2 flex overflow-x-scroll overflow-y-hidden overscroll-x-contain
              overscroll-y-none touch-pan-x bg-main-400/20
              text-main-300 snap-x rounded-tr-lg mr-px"
            role="toolbar"
            aria-label="Editor commands"
            aria-controls="codemirrorEditor"
            @click.capture="codemirrorEditor?.focus()"
          >
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertText('#')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                #
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertText('-')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                -
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertText('*')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                *
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertBrackets('[')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                []
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertBrackets('(')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                ()
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertBrackets('`')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                ``
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertText('_')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                _
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertText('>')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                &gt;
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertBrackets('\'')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                ''
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.insertBrackets('&quot;')"
            >
              <div class="w-6 h-6 flex items-center justify-center text-lg font-mono font-medium">
                ""
              </div>
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              :toggled="selectMode"
              :aria-label="selectMode ? 'Stop selection' : 'Start selection'"
              @click="selectMode = !selectMode"
            >
              <TextSelectActiveIcon
                v-if="selectMode"
                class="w-6 h-6"
                aria-hidden="true"
              />
              <TextSelectIcon
                v-else
                class="w-6 h-6"
                aria-hidden="true"
              />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              aria-label="Copy selection to clipboard"
              @click="codemirrorEditor?.copyToClipboard()"
            >
              <ClipboardCopyIcon class="w-6 h-6" aria-hidden="true" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              aria-label="Paste selection from clipboard"
              @click="codemirrorEditor?.pasteFromClipboard()"
            >
              <ClipboardPasteIcon class="w-6 h-6" aria-hidden="true" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              aria-label="Undo"
              @click="codemirrorEditor?.undo()"
            >
              <UndoIcon class="w-6 h-6" aria-hidden="true" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              aria-label="Redo"
              @click="codemirrorEditor?.redo()"
            >
              <RedoIcon class="w-6 h-6" aria-hidden="true" />
            </RibbonButton>
          </div>
          <div
            class="w-44 flex overflow-x-scroll overflow-y-hidden overscroll-x-contain
              overscroll-y-none touch-pan-x bg-main-400/20 text-main-300 snap-x snap-mandatory
              rounded-tl-lg border-background"
            role="toolbar"
            aria-label="Editor navigation"
            aria-controls="codemirrorEditor"
            @click.capture="codemirrorEditor?.focus()"
          >
            <div class="w-44 px-2 flex-none flex flex-row snap-center">
              <RibbonButton
                :aria-label="selectMode ? 'Select upwards' : 'Move cursor up'"
                @click="selectMode
                  ? codemirrorEditor?.selectUp()
                  : codemirrorEditor?.moveCursorUp()"
              >
                <CursorUpIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                :aria-label="selectMode ? 'Select downwards' : 'Move cursor down'"
                @click="selectMode
                  ? codemirrorEditor?.selectDown()
                  : codemirrorEditor?.moveCursorDown()"
              >
                <CursorDownIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                :aria-label="selectMode ? 'Select left' : 'Move cursor left'"
                @click="selectMode
                  ? codemirrorEditor?.selectLeft()
                  : codemirrorEditor?.moveCursorLeft()"
              >
                <CursorLeftIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>

              <RibbonButton
                :aria-label="selectMode ? 'Select right' : 'Move cursor right'"
                @click="selectMode
                  ? codemirrorEditor?.selectRight()
                  : codemirrorEditor?.moveCursorRight()"
              >
                <CursorRightIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
            </div>
            <div class="w-44 px-2 flex-none flex flex-row snap-center">
              <RibbonButton
                :aria-label="selectMode
                  ? 'Select to document start'
                  : 'Move cursor to document start'"
                @click="selectMode
                  ? codemirrorEditor?.selectDocStart()
                  : codemirrorEditor?.moveCursorDocStart()"
              >
                <CursorDocStartIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                :aria-label="selectMode
                  ? 'Select to document end'
                  : 'Move cursor to document end'"
                @click="selectMode
                  ? codemirrorEditor?.selectDocEnd()
                  : codemirrorEditor?.moveCursorDocEnd()"
              >
                <CursorDocEndIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                :aria-label="selectMode
                  ? 'Select to line start'
                  : 'Move cursor to line start'"
                @click="selectMode
                  ? codemirrorEditor?.selectLineStart()
                  : codemirrorEditor?.moveCursorLineStart()"
              >
                <CursorLineStartIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                :aria-label="selectMode
                  ? 'Select to line end'
                  : 'Move cursor to line end'"
                @click="selectMode
                  ? codemirrorEditor?.selectLineEnd()
                  : codemirrorEditor?.moveCursorLineEnd()"
              >
                <CursorLineEndIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
            </div>
            <div class="w-44 px-2 flex-none flex flex-row snap-center">
              <RibbonButton
                aria-label="Move selection or current line up"
                @click="codemirrorEditor?.moveLineUp()"
              >
                <MoveLinesUpIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                aria-label="Move selection or current line down"
                @click="codemirrorEditor?.moveLineDown()"
              >
                <MoveLinesDownIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                aria-label="Indent selection or current line less"
                @click="codemirrorEditor?.indentLess()"
              >
                <IndentLeftIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
              <RibbonButton
                aria-label="Indent selection or current line more"
                @click="codemirrorEditor?.indentMore()"
              >
                <IndentRightIcon class="w-6 h-6" aria-hidden="true" />
              </RibbonButton>
            </div>
          </div>
        </div>
      </transition>
    </template>
  </main>
</template>
