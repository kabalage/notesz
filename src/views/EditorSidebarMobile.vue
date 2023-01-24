<script setup lang="ts">
import ButtonBarMobile from '@/components/ButtonBarMobile.vue';
import ButtonBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import CaretLeftIcon from '@/assets/icons/caret-left.svg?component';
import CaretRightIcon from '@/assets/icons/caret-right.svg?component';
// import CheckCircleIcon32 from '@/assets/icons/check-circle-32.svg?component';
import CogIcon32 from '@/assets/icons/cog-32.svg?component';
import NotebookIcon from '@/assets/icons/notebook.svg?component';
// import NotebookNewIcon32 from '@/assets/icons/notebook-new-32.svg?component';
import NoteIcon from '@/assets/icons/note.svg?component';
import NoteNewIcon32 from '@/assets/icons/note-new-32.svg?component';
import SyncIcon32 from '@/assets/icons/sync-32.svg?component';
import PlusIcon20 from '@/assets/icons/plus-20.svg?component';
import AsteriskIcon20 from '@/assets/icons/asterisk-20.svg?component';
import XmarkIcon from '@/assets/icons/x-mark.svg?component';

import { useEditorState } from '@/stores/editorState';
import { useExplorerState } from '@/stores/explorerState';
import BaseButton from '@/components/BaseButton.vue';
import BasicButton from '@/components/BasicButton.vue';
import IconButton from '@/components/IconButton.vue';

const editorState = useEditorState()!;
const explorerState = useExplorerState()!;

function locationReload() {
  if (import.meta.env.DEV) {
    location.reload();
  }
}

</script>

<template>
  <div class="pt-1 flex flex-col">
    <div class="flex-1 py-4 overflow-y-auto pl-safe-l">
      <div
        class="flex justify-center mb-3"
        @click="locationReload()"
      >
        <img src="@/assets/logo-dark.svg" class="h-8 my-2"/>
      </div>

      <template v-if="explorerState.conflictingFiles.length > 0">
        <h2
          class="text-cyan-300 font-semibold mt-8 px-4 leading-8"
        >
          Conflicting files
        </h2>
        <ul
          class="mx-4 divide-y divide-indigo-500/30 bg-indigo-500/10
            rounded-lg overflow-hidden"
        >
          <li
            v-for="file in explorerState.conflictingFiles"
            :key="file.path"
            class="mouse:mx-1 mouse:my-0.5"
          >
            <BaseButton
              :href="`/edit/${editorState.repositoryId}/${file.path}`"
              @click.prevent="editorState.openFile(file.path)"
              class="flex items-center py-3 px-4 mouse:py-1.5 mouse:px-2
                text-indigo-100 font-medium mouse:rounded-lg"
              :class="{
                'bg-indigo-500/30': file.path === editorState.currentFilePath,
                'mouse:hover:bg-indigo-500/20': file.path !== editorState.currentFilePath
              }"
              active-class="bg-indigo-500/20"
            >
              <NoteIcon class="w-6 h-6 mr-2 text-indigo-300/50 flex-none" />
              <div class="flex-1 truncate">
                <div class="truncate leading-5">
                  {{ file.name }}
                </div>
                <div class="flex-1 truncate opacity-50 text-sm leading-4">
                  {{ file.parentPath }}
                </div>
              </div>
            </BaseButton>
          </li>
        </ul>
        <BasicButton
          v-if="!explorerState.browseAllDuringManualRebase"
          class="mt-8 mx-auto"
          ghost
          @click="explorerState.browseAllDuringManualRebase = true"
        >
          Browse all files
        </BasicButton>
        <div
          v-if="explorerState.browseAllDuringManualRebase"
          class="flex items-center mt-8 pl-4 pr-2"
        >
          <h2 class="flex-1 text-cyan-300 font-semibold leading-8">
            All files
          </h2>
          <IconButton
            @click="explorerState.browseAllDuringManualRebase = false"
          >
            <XmarkIcon class="w-6 h-6 opacity-75" />
          </IconButton>
        </div>
      </template>
      <ul
        v-if="explorerState.conflictingFiles.length === 0
          || explorerState.browseAllDuringManualRebase"
        class="divide-y divide-indigo-500/30"
        :class="{
          'bg-indigo-500/10 mx-4 rounded-lg overflow-hidden':
            explorerState.browseAllDuringManualRebase
        }"
      >
        <li
          v-for="item in explorerState.items"
          :key="item.path"
          class="mouse:mx-1 mouse:my-0.5"
        >
          <BaseButton
            v-if="item.type === 'parentTree'"
            :href="`/edit/${editorState.repositoryId}/${item.path}`"
            @click.prevent="explorerState.path = item.path"
            class="flex items-center py-3 px-4 mouse:py-1.5 mouse:px-2
              text-indigo-400 font-semibold mouse:hover:bg-indigo-500/20
              mouse:rounded-lg"
            active-class="bg-indigo-500/20"
          >
            <CaretLeftIcon class="w-6 h-6 inline-block mr-2 text-indigo-400" />
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
          </BaseButton>
          <BaseButton
            v-if="item.type === 'tree'"
            :href="`/edit/${editorState.repositoryId}/${item.path}`"
            @click.prevent="explorerState.path = item.path"
            class="flex items-center py-3 px-4 mouse:py-1.5 mouse:px-2
              text-indigo-400 font-semibold mouse:hover:bg-indigo-500/20
              mouse:rounded-lg"
            :class="{
              'text-indigo-400': item.unchanged,
              'text-green-400': item.added,
              'text-cyan-400': item.modified
            }"
            active-class="bg-indigo-500/20"
          >
            <NotebookIcon class="w-6 h-6 mr-2 text-indigo-400 flex-none"/>
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
            <CaretRightIcon class="w-6 h-6" />
          </BaseButton>
          <BaseButton
            v-if="item.type === 'file'"
            :href="`/edit/${editorState.repositoryId}/${item.path}`"
            @click.prevent="editorState.openFile(item.path)"
            class="flex items-center py-3 px-4 mouse:py-1.5 mouse:px-2
              text-indigo-100 font-medium mouse:rounded-lg"
            :class="{
              'bg-indigo-500/30': item.path === editorState.currentFilePath,
              'mouse:hover:bg-indigo-500/20': item.path !== editorState.currentFilePath,
              'text-green-400': item.added,
              'text-cyan-400': item.modified
            }"
            active-class="bg-indigo-500/20"
          >
            <NoteIcon
              class="w-6 h-6 mr-2 text-indigo-300/50 flex-none"
            />
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
            <AsteriskIcon20
              v-if="item.modified"
              class="text-cyan-300 w-5 mr-0.5 text-center"
            />
            <PlusIcon20
              v-if="item.added"
              class="text-green-400 w-5 mr-0.5 text-center"
            />
          </BaseButton>
        </li>
      </ul>
    </div>
    <ButtonBarMobile class="flex-none">
      <!-- <ButtonBarMobileButton>
        <CheckCircleIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton> -->
      <ButtonBarMobileButton @click="editorState.addFile(explorerState.path)">
        <NoteNewIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton>
      <!-- <ButtonBarMobileButton>
        <NotebookNewIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton> -->
      <ButtonBarMobileButton
        @click="editorState.startSync"
        :disabled="editorState.syncDisabled"
      >
        <SyncIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton>
      <ButtonBarMobileButton to="/settings">
        <CogIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
  </div>
</template>
