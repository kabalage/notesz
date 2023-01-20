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
              text-blue-100 font-medium
              mouse:rounded-lg"
            :class="{
              'bg-indigo-500/30': item.path === editorState.currentFilePath,
              'mouse:hover:bg-indigo-500/20':
                item.path !== editorState.currentFilePath
            }"
            active-class="bg-indigo-500/20"
          >
            <NoteIcon
              class="w-6 h-6 mr-2 text-indigo-400 ml-safe-l flex-none"
            />
            {{ item.name }}
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
        :disabled="editorState.isSyncing"
        @click="editorState.startSync"
      >
        <SyncIcon32
          class="w-8 h-8"
          :class="{
            'animate-spin': editorState.isSyncing
          }"
        />
      </ButtonBarMobileButton>
      <ButtonBarMobileButton to="/settings">
        <CogIcon32 class="w-8 h-8" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
  </div>
</template>
