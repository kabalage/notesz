<script setup lang="ts">
import { watch } from 'vue';
import EditorSidebarDesktop from './EditorSidebarDesktop.vue';
import EditorSidebarMobile from './EditorSidebarMobile.vue';
import EditorContents from './EditorContents.vue';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import NoteszTransitionGroup from '@/components/NoteszTransitionGroup.vue';
import { useEditorService } from '@/services/editorService';
import { useExplorerService } from '@/services/explorerService';

const props = defineProps<{
  repo: string,
  path: string
}>();

const isTouchDevice = useIsTouchDevice();
const editorService = useEditorService();
useExplorerService();

watch(() => `${props.repo}/${props.path}`, () => {
  editorService.repositoryId = props.repo;
  editorService.currentFilePath = props.path;
}, { immediate: true });

</script>

<template>
  <div class="h-full overflow-hidden sm:flex bg-background pl-safe-l pr-safe-r">
    <NoteszTransitionGroup>
      <div class="touch:hidden flex-1" key="bg-left" />
      <EditorSidebarMobile
        v-if="isTouchDevice && editorService.sidebarIsOpen"
        class="flex-none h-full sm:w-64 touch:sm:w-72 sm:border-r sm:border-main-400/20"
        :class="{
          '<sm:hidden': editorService.currentFile
        }"
        key="sidebar-mobile"
      />
      <EditorSidebarDesktop
        v-else-if="editorService.sidebarIsOpen"
        class="flex-none h-full sm:w-64 touch:sm:w-72 sm:border-r-2 sm:border-main-400/30
          bg-main-400/10 relative before:absolute before:bg-main-400/10
          before:right-full before:w-[200%] before:h-full"
        :class="{
          '<sm:hidden': editorService.currentFile
        }"
        key="sidebar-desktop"
      />
      <EditorContents
        class="h-full touch:flex-1 mouse:w-full mouse:max-w-5xl"
        :class="{
          '<sm:hidden': !editorService.currentFile
        }"
        key="editor"
      />
      <div class="touch:hidden flex-1" key="bg-right" />
    </NoteszTransitionGroup>
  </div>
</template>
