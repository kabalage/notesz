<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';

import ButtonBarMobile from '@/components/ButtonBarMobile.vue';
import ButtonBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import EmptyPlaceholder from './EmptyPlaceholder.vue';
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
import ArrowLeftIcon32 from '@/assets/icons/arrow-left-32.svg?component';
import TrashIcon from '@/assets/icons/trash.svg?component';
import TrashIcon32 from '@/assets/icons/trash-32.svg?component';
import SyncIcon32 from '@/assets/icons/sync-32.svg?component';
import CheckIcon from '@/assets/icons/check.svg?component';

import useIsTouchDevice from '@/composables/useIsTouchDevice';
import { useEditorState } from '@/stores/editorState';
import RibbonButton from '@/components/RibbonButton.vue';
import IconButton from '@/components/IconButton.vue';

const CodemirrorEditor = defineAsyncComponent({
  loader: () => import('./CodemirrorEditor.vue'),
  loadingComponent: EmptyPlaceholder,
  delay: 0
});

const isTouchDevice = useIsTouchDevice();
const editorState = useEditorState()!;
const editorFocused = ref<boolean>(false);
const selectMode = ref<boolean>(false);
let editorBlurTimeout: ReturnType<typeof setTimeout> | undefined;

const codemirrorEditor = ref<InstanceType<typeof CodemirrorEditor> | null>(null);

async function onNoteInput(newValue: string) {
  // console.log('input', editorState.currentFile?.path);
  editorState.currentFileBlob.data = newValue;
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
  }, 200);
}

</script>

<template>
  <div
    class="overflow-hidden flex flex-col"
  >
    <div
      v-if="!editorState.currentFile"
      class="self-center mt-16 text-blue-200/40"
    >
      Select a note to edit...
      <!-- <input class="block mt-96 z-10" /> -->
    </div>
    <template v-if="editorState.currentFile">
      <div class="px-3 lg:px-11 py-6 flex justify-between items-center">
        <IconButton
          class="hidden sm:block"
          @click="editorState.sidebarIsOpen = !editorState.sidebarIsOpen"
        >
          <SidebarIcon class="w-6 h-6" />
        </IconButton>
        <div class="flex-1 flex-col justify-center">
          <div
            v-if="editorState.currentFileParentTree?.path"
            class="flex-1 text-center text-sm font-semibold text-cyan-300/60 leading-tight"
          >
            {{ editorState.currentFileParentTree.path }}
          </div>
          <h1 class="flex-1 text-center text-lg font-semibold text-cyan-300 leading-tight">
            {{ editorState.currentFileName }}
          </h1>
        </div>
        <IconButton
          class="hidden sm:block"
          @click="editorState.deleteCurrentFile()"
        >
          <TrashIcon class="w-6 h-6" />
        </IconButton>
        <IconButton
          v-if="editorState.currentFile.conflicting"
          class="hidden sm:block"
          @click="editorState.resolveConflict()"
        >
          <CheckIcon class="w-6 h-6" />
        </IconButton>
      </div>
      <CodemirrorEditor
        v-if="editorState.currentFile"
        ref="codemirrorEditor"
        :key="editorState.currentFile.path"
        class="flex-1 overflow-hidden bg-violet-950 mr-safe-r lg:ml-8"
        :note="editorState.currentFileBlob.data || ''"
        @input="onNoteInput"
        @focus="onEditorFocus"
        @blur="onEditorBlur"
      />
      <Transition
        enter-active-class="duration-300 ease-out"
        enter-from-class="transform opacity-0 translate-y-full"
      >
        <ButtonBarMobile
          v-if="!editorFocused || !isTouchDevice"
          class="flex-none sm:hidden"
        >
          <ButtonBarMobileButton
            @click="editorState.closeFile()"
          >
            <ArrowLeftIcon32 class="w-8 h-8" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            :disabled="editorState.isSyncing"
            @click="editorState.startSync()"
          >
            <SyncIcon32
              class="w-8 h-8"
              :class="{
                'animate-spin': editorState.isSyncing
              }"
            />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton @click="editorState.deleteCurrentFile">
            <TrashIcon32 class="w-8 h-8" />
          </ButtonBarMobileButton>
          <ButtonBarMobileButton
            v-if="editorState.currentFile.conflicting"
            @click="editorState.resolveConflict()"
          >
            <CheckIcon class="w-8 h-8" />
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
              overscroll-y-none touch-pan-x bg-indigo-400/20
              text-indigo-300 snap-x rounded-tr-lg mr-0.5"
            @click.capture="codemirrorEditor?.focus()"
          >
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
              @click="codemirrorEditor?.indentMore()"
            >
              <IndentRightIcon class="w-6 h-6" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.indentLess()"
            >
              <IndentLeftIcon class="w-6 h-6" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.moveLineUp()"
            >
              <MoveLinesUpIcon class="w-6 h-6" />
            </RibbonButton>
            <RibbonButton
              class="snap-center"
              @click="codemirrorEditor?.moveLineDown()"
            >
              <MoveLinesDownIcon class="w-6 h-6" />
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
              overscroll-y-none touch-pan-x bg-indigo-400/20 text-indigo-300 snap-x snap-mandatory
              rounded-tl-lg border-indigo-950"
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
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>
