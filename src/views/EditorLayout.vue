<script setup lang="ts">
import { defineAsyncComponent, toRef } from 'vue';
import EditorContents from './EditorContents.vue';
import EmptyPlaceholder from './EmptyPlaceholder.vue';
import { provideEditorState } from '@/stores/editorState';
import { provideExplorerState } from '@/stores/explorerState';
import useIsTouchDevice from '@/composables/useIsTouchDevice';

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

const EditorSidebarMobile = defineAsyncComponent({
  loader: () => import('./EditorSidebarMobile.vue'),
  loadingComponent: EmptyPlaceholder,
  delay: 0
});

const EditorSidebarDesktop = defineAsyncComponent({
  loader: () => import('./EditorSidebarDesktop.vue'),
  loadingComponent: EmptyPlaceholder,
  delay: 0
});

</script>

<template>
  <div
    class="h-full overflow-hidden sm:flex sm:justify-center bg-violet-950"
    v-auto-animate="{ duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }"
  >
    <div
      class="touch:hidden flex-1 transition-colors ease-in-out duration-250 delay-[250ms]
        motion-reduce:transition-none"
      :class="{
        'bg-indigo-500/10': editorState.sidebarIsOpen
      }"
    />
    <EditorSidebarMobile
      v-if="isTouchDevice && editorState.sidebarIsOpen"
      class="flex-none h-full sm:w-64 touch:sm:w-72 sm:border-r-2 sm:border-indigo-500/20"
      :class="{
        '<sm:hidden': editorState.currentFile
      }"
    />
    <EditorSidebarDesktop
      v-else-if="editorState.sidebarIsOpen"
      class="flex-none h-full sm:w-64 touch:sm:w-72 sm:border-r-2 sm:border-indigo-500/20
        bg-indigo-500/10"
      :class="{
        '<sm:hidden': editorState.currentFile
      }"
    />
    <EditorContents
      class="h-full touch:flex-1 mouse:w-full mouse:max-w-5xl"
      :class="{
        '<sm:hidden': !editorState.currentFile
      }"
    />
    <div class="touch:hidden flex-1" />
  </div>
</template>
