<script setup lang="ts">
import { toRef } from 'vue';
import EditorSidebarDesktop from './EditorSidebarDesktop.vue';
import EditorSidebarMobile from './EditorSidebarMobile.vue';
import EditorContents from './EditorContents.vue';
import { provideEditorState } from '@/stores/editorState';
import { provideExplorerState } from '@/stores/explorerState';
import useIsTouchDevice from '@/composables/useIsTouchDevice';
import NoteszTransitionGroup from '@/components/NoteszTransitionGroup.vue';

const props = defineProps<{
  repo: string,
  path: string
}>();

const isTouchDevice = useIsTouchDevice();
const editorState = provideEditorState(
  toRef(props, 'repo'),
  toRef(props, 'path')
);
provideExplorerState(editorState);

</script>

<template>
  <div class="h-full overflow-hidden sm:flex bg-background">
    <NoteszTransitionGroup>
      <div class="touch:hidden flex-1" key="bg-left" />
      <EditorSidebarMobile
        v-if="isTouchDevice && editorState.sidebarIsOpen"
        class="flex-none h-full sm:w-64 touch:sm:w-72 sm:border-r sm:border-main-400/20 ml-safe-l"
        :class="{
          '<sm:hidden': editorState.currentFile
        }"
        key="sidebar-mobile"
      />
      <EditorSidebarDesktop
        v-else-if="editorState.sidebarIsOpen"
        class="flex-none h-full sm:w-64 touch:sm:w-72 sm:border-r-2 sm:border-main-400/30
          bg-main-400/10 relative before:absolute before:bg-main-400/10
          before:right-full before:w-[200%] before:h-full"
        :class="{
          '<sm:hidden': editorState.currentFile
        }"
        key="sidebar-desktop"
      />
      <EditorContents
        class="h-full touch:flex-1 mouse:w-full mouse:max-w-5xl mr-safe-r"
        :class="{
          '<sm:hidden': !editorState.currentFile,
          'ml-safe-l': !editorState.sidebarIsOpen
        }"
        key="editor"
      />
      <div class="touch:hidden flex-1" key="bg-right" />
    </NoteszTransitionGroup>
  </div>
</template>
