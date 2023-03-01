<script setup lang="ts">
import CaretLeftIcon from '@/assets/icons/caret-left.svg?component';
import CaretRightIcon from '@/assets/icons/caret-right.svg?component';
import CogIcon from '@/assets/icons/cog.svg?component';
import FolderIcon from '@/assets/icons/folder.svg?component';
import FileIcon from '@/assets/icons/file.svg?component';
import PlusIcon from '@/assets/icons/plus.svg?component';
import SyncIcon from '@/assets/icons/sync.svg?component';
import PlusIcon20 from '@/assets/icons/plus-20.svg?component';
import AsteriskIcon20 from '@/assets/icons/asterisk-20.svg?component';
import XmarkIcon from '@/assets/icons/x-mark.svg?component';

import ButtonBarDesktop from '@/components/ButtonBarDesktop.vue';
import ButtonBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import BaseButton from '@/components/BaseButton.vue';
import BasicButton from '@/components/BasicButton.vue';
import IconButton from '@/components/IconButton.vue';
import NoteszLogo from '@/components/NoteszLogo.vue';
import { useEditorService } from '@/services/editorService';
import { useExplorerService } from '@/services/explorerService';

const editorService = useEditorService();
const explorerService = useExplorerService();

</script>

<template>
  <div class="pt-1 flex flex-col">
    <div class="flex-none flex justify-center my-4">
      <NoteszLogo
        class="h-8 my-2"
        text-class="text-white"
        icon-class="text-accent-300"
        icon-shade-class="text-main-400/40"
      />
    </div>
    <ButtonBarDesktop class="flex-none mb-4">
      <ButtonBarDesktopButton @click="editorService.addFile(explorerService.path)">
        <PlusIcon class="w-6 h-6"/>
      </ButtonBarDesktopButton>
      <ButtonBarDesktopButton
        :disabled="editorService.syncDisabled"
        @click="editorService.startSync"
      >
        <SyncIcon class="w-6 h-6"/>
      </ButtonBarDesktopButton>
      <ButtonBarDesktopButton to="/settings">
        <CogIcon class="w-6 h-6" />
      </ButtonBarDesktopButton>
    </ButtonBarDesktop>
    <div class="flex-1 py-1.5 px-2 overflow-y-auto">
      <template v-if="!explorerService.loading && explorerService.conflictingFiles.length > 0">
        <h2 class="text-accent-300 font-semibold mt-2 pl-2">
          Conflicting files
        </h2>
        <ul class="mt-2">
          <li
            v-for="file in explorerService.conflictingFiles"
            :key="file.path"
            class="my-0.5"
          >
            <BaseButton
              :href="`/edit/${editorService.repositoryId}/${file.path}`"
              @click.prevent="editorService.openFile(file.path)"
              class="flex items-center py-1.5 px-2 text-white font-medium rounded-lg"
              :class="{
                'bg-main-400/20': file.path === editorService.currentFilePath,
                'hover:bg-main-400/10': file.path !== editorService.currentFilePath
              }"
              active-class="!bg-main-400/20"
            >
              <FileIcon class="w-6 h-6 mr-2 flex-none text-main-400" />
              <div class="flex-1">
                <div class="truncate leading-tight">
                  {{ file.name }}
                </div>
                <div class="truncate opacity-50 text-sm leading-none">
                  {{ file.parentPath }}
                </div>
              </div>
            </BaseButton>
          </li>
        </ul>
        <BasicButton
          v-if="!explorerService.browseAllDuringManualRebase"
          class="mt-8 mx-auto"
          ghost
          @click="explorerService.toggleBrowseAllDuringManualRebase()"
        >
          Browse all files
        </BasicButton>
        <div
          v-if="explorerService.browseAllDuringManualRebase"
          class="flex items-center my-4 pt-4 pl-2 border-t-2 border-main-400/20"
        >
          <h2 class="flex-1 text-accent-300 font-semibold">
            All files
          </h2>
          <IconButton
            class="-my-2"
            @click="explorerService.toggleBrowseAllDuringManualRebase()"
          >
            <XmarkIcon class="w-6 h-6 opacity-50" />
          </IconButton>
        </div>
      </template>
      <ul
        v-if="!explorerService.loading && (explorerService.conflictingFiles.length === 0
          || explorerService.browseAllDuringManualRebase)"
      >
        <li
          v-if="explorerService.items.length === 0"
          class="mt-8 text-center"
        >
          The repository is empty.
          <BasicButton
            v-if="!explorerService.browseAllDuringManualRebase"
            class="mt-4 mx-auto"
            @click="editorService.addFile('')"
          >
            Create a file
          </BasicButton>
        </li>
        <li
          v-for="item in explorerService.items"
          :key="item.path"
          class="my-0.5"
        >
          <BaseButton
            v-if="item.type === 'parentTree'"
            :href="`/edit/${editorService.repositoryId}/${item.path}`"
            @click.prevent="explorerService.path = item.path"
            class="flex items-center py-1.5 px-2 font-medium hover:bg-main-400/10 rounded-lg"
            active-class="!bg-main-400/20"
          >
            <CaretLeftIcon class="w-6 h-6 inline-block mr-2 text-main-400" />
            <div class="flex-1 mr-2 truncate text-main-300">
              {{ item.name }}
            </div>
          </BaseButton>
          <BaseButton
            v-if="item.type === 'tree'"
            :href="`/edit/${editorService.repositoryId}/${item.path}`"
            @click.prevent="explorerService.path = item.path"
            class="flex items-center py-1.5 px-2 font-medium hover:bg-main-400/10 rounded-lg"
            active-class="!bg-main-400/20"
          >
            <FolderIcon class="w-6 h-6 mr-2 flex-none text-main-400"/>
            <div
              class="flex-1 mr-2 truncate"
              :class="{
                'text-main-200': item.unchanged,
                'text-green-400': item.added,
                'text-accent-300': item.modified
              }"
            >
              {{ item.name }}
            </div>
            <CaretRightIcon class="w-6 h-6 text-main-400" />
          </BaseButton>
          <BaseButton
            v-if="item.type === 'file'"
            :href="`/edit/${editorService.repositoryId}/${item.path}`"
            @click.prevent="editorService.openFile(item.path)"
            class="flex items-center py-1.5 px-2 font-medium rounded-lg"
            :class="{
              'bg-main-400/20': item.path === editorService.currentFilePath,
              'hover:bg-main-400/10': item.path !== editorService.currentFilePath,
              'text-green-400': item.added,
              'text-accent-400': item.modified,
              'text-white': item.unchanged
            }"
            active-class="!bg-main-400/20"
          >
            <FileIcon class="w-6 h-6 mr-2 flex-none text-main-400" />
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
            <AsteriskIcon20
              v-if="item.modified"
              class="text-accent-400 w-5 mr-0.5 text-center"
            />
            <PlusIcon20
              v-if="item.added"
              class="text-green-400 w-5 mr-0.5 text-center"
            />
          </BaseButton>
        </li>
      </ul>
    </div>
  </div>
</template>
