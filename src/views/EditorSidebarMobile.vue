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

import { useEditorState } from '@/stores/editorState';
import { useExplorerState } from '@/stores/explorerState';
import BaseButton from '@/components/BaseButton.vue';

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
    <div class="flex-1 py-4 overflow-y-auto">
      <div
        class="flex justify-center mb-3 ml-safe-l"
        @click="locationReload()"
      >
        <img src="@/assets/logo-dark.svg" class="h-8 my-2"/>
      </div>
      <ul class="divide-y divide-indigo-500/30">
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
            <CaretLeftIcon class="w-6 h-6 inline-block mr-2 text-indigo-400 ml-safe-l" />
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
            <NotebookIcon class="w-6 h-6 mr-2 text-indigo-400 ml-safe-l flex-none"/>
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
              class="w-6 h-6 mr-2 text-indigo-300/50 ml-safe-l flex-none"
            />
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
            <AsteriskIcon20
              v-if="item.modified"
              class="text-cyan-300 bg-cyan-500/30 w-5 rounded text-center"
            />
            <PlusIcon20
              v-if="item.added"
              class="text-green-400 bg-green-500/30 w-5 rounded text-center"
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
      <ButtonBarMobileButton @click="editorState.startSync">
        <SyncIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton>
      <ButtonBarMobileButton to="/settings">
        <CogIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
  </div>
</template>
