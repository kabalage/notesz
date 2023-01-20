<script setup lang="ts">
import ButtonBarDesktop from '@/components/ButtonBarDesktop.vue';
import ButtonBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import CaretLeftIcon from '@/assets/icons/caret-left.svg?component';
import CaretRightIcon from '@/assets/icons/caret-right.svg?component';
import CogIcon from '@/assets/icons/cog.svg?component';
import NotebookIcon from '@/assets/icons/notebook.svg?component';
// import NotebookNewIcon from '@/assets/icons/notebook-new.svg?component';
import NoteIcon from '@/assets/icons/note.svg?component';
import NoteNewIcon from '@/assets/icons/note-new.svg?component';
import SyncIcon from '@/assets/icons/sync.svg?component';

import { useEditorState } from '@/stores/editorState';
import { useExplorerState } from '@/stores/explorerState';
import BaseButton from '@/components/BaseButton.vue';

const editorState = useEditorState()!;
const explorerState = useExplorerState()!;

</script>

<template>
  <div class="pt-1 flex flex-col">
    <div class="flex-none flex justify-center my-4 ml-safe-l">
      <img src="@/assets/logo-dark.svg" class="h-8 my-2"/>
    </div>
    <ButtonBarDesktop class="flex-none mb-4">
      <ButtonBarDesktopButton @click="editorState.addFile(explorerState.path)">
        <NoteNewIcon class="w-6 h-6"/>
      </ButtonBarDesktopButton>
      <!-- <BottomBarDesktopButton>
        <NotebookNewIcon class="w-6 h-6" />
      </BottomBarDesktopButton> -->
      <ButtonBarDesktopButton
        :disabled="editorState.isSyncing"
        @click="editorState.startSync"
      >
        <SyncIcon
          class="w-6 h-6"
          :class="{
            'animate-spin': editorState.isSyncing
          }"
        />
      </ButtonBarDesktopButton>
      <ButtonBarDesktopButton to="/settings">
        <CogIcon class="w-6 h-6" />
      </ButtonBarDesktopButton>
    </ButtonBarDesktop>
    <div class="flex-1 py-1.5 px-2 overflow-y-auto rounded-t-xl">
      <ul>
        <li
          v-for="item in explorerState.items"
          :key="item.path"
          class="my-0.5"
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
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
          </BaseButton>
        </li>
      </ul>
    </div>
  </div>
</template>
