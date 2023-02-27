<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';

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
import { useEditorService } from '@/services/editorService';

const CodemirrorEditor = defineAsyncComponent({
  loader: () => import('./CodemirrorEditor.vue'),
  loadingComponent: EmptyPlaceholder,
  delay: 0
});

const isTouchDevice = useIsTouchDevice();
const editorService = useEditorService();
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
  editorService.currentFileBlob.flushThrottledPut();
  editorBlurTimeout = setTimeout(() => {
    editorFocused.value = false;
  }, 200);
}

</script>

<template>
  <div
    class="overflow-hidden flex flex-col"
  >
    <div
      v-if="!editorService.currentFile"
      class="self-center mt-16 text-main-200/60"
    >
      Select a note to edit...
      <!-- <input class="block mt-96 z-10" /> -->
    </div>
    <template v-if="editorService.currentFile">
      <div class="px-3 lg:px-11 py-6 flex justify-between items-center">
        <div class="flex-1 flex items-center">
          <IconButton
            class="hidden sm:block"
            @click="editorService.sidebarIsOpen = !editorService.sidebarIsOpen"
          >
            <SidebarIcon class="w-6 h-6" />
          </IconButton>
        </div>
        <div class="flex-col justify-center truncate">
          <div
            v-if="editorService.currentTree?.path"
            class="flex-1 text-center text-sm font-semibold text-accent-300/60 leading-tight
              truncate"
          >
            {{ editorService.currentTree.path }}
          </div>
          <h2
            class="flex-1 text-center text-lg font-semibold text-accent-300 leading-tight truncate"
          >
            {{ editorService.currentFileName }}
          </h2>
        </div>
        <div class="flex-1 flex items-center justify-end">
          <IconButton
            class="hidden sm:block"
            @click="editorService.deleteCurrentFile()"
          >
            <TrashIcon class="w-6 h-6" />
          </IconButton>
          <IconButton
            v-if="editorService.currentFile.conflicting"
            class="hidden sm:block"
            @click="editorService.resolveConflict()"
          >
            <CheckIcon class="w-6 h-6" />
          </IconButton>
        </div>
      </div>
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
        ref="codemirrorEditor"
        :key="editorService.currentFile.path"
        class="flex-1 overflow-hidden lg:mx-8"
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
            label="Back"
            @click="editorService.closeFile()"
          >
            <ArrowLeftIcon class="w-6 h-6" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            class="flex-1"
            label="Sync"
            :disabled="editorService.syncDisabled"
            @click="editorService.startSync()"
          >
            <SyncIcon class="w-6 h-6" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            class="flex-1"
            label="Delete"
            @click="editorService.deleteCurrentFile"
          >
            <TrashIcon class="w-6 h-6" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            v-if="editorService.currentFile.conflicting"
            class="flex-1"
            label="Resolve"
            @click="editorService.resolveConflict()"
          >
            <CheckIcon class="w-6 h-6" />
          </ButtonBarMobileButton>
        </ButtonBarMobile>
      </Transition>
      <Transition
        enter-active-class="duration-300 ease-out delay-300"
        enter-from-class="transform opacity-0 translate-y-full"
      >
        <div
          v-if="editorFocused && isTouchDevice"
          class="flex flex-row pt-px"
        >
          <div
            class="flex-1 px-2 flex overflow-x-scroll overflow-y-hidden overscroll-x-contain
              overscroll-y-none touch-pan-x bg-main-400/20
              text-main-300 snap-x rounded-tr-lg mr-0.5"
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
              @click="selectMode = !selectMode"
            >
              <TextSelectActiveIcon
                v-if="selectMode"
                class="w-6 h-6"
              />
              <TextSelectIcon
                v-else
                class="w-6 h-6"
              />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.copyToClipboard()"
            >
              <ClipboardCopyIcon class="w-6 h-6" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.pasteFromClipboard()"
            >
              <ClipboardPasteIcon class="w-6 h-6" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.undo()"
            >
              <UndoIcon class="w-6 h-6" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.redo()"
            >
              <RedoIcon class="w-6 h-6" />
            </RibbonButton>
          </div>
          <div
            class="w-44 flex overflow-x-scroll overflow-y-hidden overscroll-x-contain
              overscroll-y-none touch-pan-x bg-main-400/20 text-main-300 snap-x snap-mandatory
              rounded-tl-lg border-background"
            @click.capture="codemirrorEditor?.focus()"
          >
            <div class="w-44 px-2 flex-none flex flex-row snap-center">
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectUp()
                  : codemirrorEditor?.moveCursorUp()"
              >
                <CursorUpIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectDown()
                  : codemirrorEditor?.moveCursorDown()"
              >
                <CursorDownIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectLeft()
                  : codemirrorEditor?.moveCursorLeft()"
              >
                <CursorLeftIcon class="w-6 h-6" />
              </RibbonButton>

              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectRight()
                  : codemirrorEditor?.moveCursorRight()"
              >
                <CursorRightIcon class="w-6 h-6" />
              </RibbonButton>
            </div>
            <div class="w-44 px-2 flex-none flex flex-row snap-center">
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectDocStart()
                  : codemirrorEditor?.moveCursorDocStart()"
              >
                <CursorDocStartIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectDocEnd()
                  : codemirrorEditor?.moveCursorDocEnd()"
              >
                <CursorDocEndIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectLineStart()
                  : codemirrorEditor?.moveCursorLineStart()"
              >
                <CursorLineStartIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="selectMode
                  ? codemirrorEditor?.selectLineEnd()
                  : codemirrorEditor?.moveCursorLineEnd()"
              >
                <CursorLineEndIcon class="w-6 h-6" />
              </RibbonButton>
            </div>
            <div class="w-44 px-2 flex-none flex flex-row snap-center">
              <RibbonButton
                @click="codemirrorEditor?.moveLineUp()"
              >
                <MoveLinesUpIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="codemirrorEditor?.moveLineDown()"
              >
                <MoveLinesDownIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="codemirrorEditor?.indentLess()"
              >
                <IndentLeftIcon class="w-6 h-6" />
              </RibbonButton>
              <RibbonButton
                @click="codemirrorEditor?.indentMore()"
              >
                <IndentRightIcon class="w-6 h-6" />
              </RibbonButton>
            </div>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>
