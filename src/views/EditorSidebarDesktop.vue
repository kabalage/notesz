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

import { useService } from '@/utils/injector';
import { EditorService } from '@/services/EditorService';
import { ExplorerService } from '@/services/ExplorerService';

const editorService = useService(EditorService);
const explorerService = useService(ExplorerService);

</script>

<template>
  <aside class="pt-1 flex flex-col" aria-label="Sidebar">
    <div class="flex-none flex justify-center my-4">
      <NoteszLogo
        class="h-8 my-2"
        text-class="text-white"
        icon-class="text-accent-300"
        icon-shade-class="text-main-400/40"
        role="img"
        aria-label="Notesz logo"
      />
    </div>
    <ButtonBarDesktop class="flex-none mb-4">
      <ButtonBarDesktopButton
        aria-label="Create new file"
        @click="editorService.addFile(explorerService.path)"
      >
        <PlusIcon class="w-6 h-6" aria-hidden="true"/>
      </ButtonBarDesktopButton>
      <ButtonBarDesktopButton
        aria-label="Synchronize"
        :disabled="editorService.syncDisabled"
        @click="editorService.startSync"
      >
        <SyncIcon class="w-6 h-6" aria-hidden="true"/>
      </ButtonBarDesktopButton>
      <ButtonBarDesktopButton
        aria-label="Settings"
        to="/settings"
      >
        <CogIcon class="w-6 h-6" aria-hidden="true"/>
      </ButtonBarDesktopButton>
    </ButtonBarDesktop>
    <div class="flex-1 py-1.5 px-2 overflow-y-auto">
      <template v-if="!explorerService.loading && explorerService.conflictingFiles.length > 0">
        <h2 class="text-accent-300 font-medium mt-2 pl-2">
          Conflicting files
        </h2>
        <ul class="mt-2" aria-label="List of conflicting files">
          <li
            v-for="file in explorerService.conflictingFiles"
            :key="file.path"
            class="my-0.5"
          >
            <BaseButton
              class="w-full text-left flex items-center py-1.5 px-2 text-white font-medium
                rounded-lg"
              :class="{
                'bg-main-400/20': file.path === editorService.currentFilePath,
                'hover:bg-main-400/10': file.path !== editorService.currentFilePath
              }"
              active-class="!bg-main-400/20"
              @click="editorService.openFile(file.path)"
            >
              <FileIcon class="w-6 h-6 mr-2 flex-none text-main-400" aria-hidden="true" />
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
          aria-label="Show all files"
          @click="explorerService.toggleBrowseAllDuringManualRebase()"
        >
          Browse all files
        </BasicButton>
        <div
          v-if="explorerService.browseAllDuringManualRebase"
          class="flex items-center my-4 pt-4 pl-2 border-t-2 border-main-400/20"
        >
          <h1 class="flex-1 text-accent-300 font-medium">
            All files
          </h1>
          <IconButton
            class="-my-2"
            aria-label="Hide all files"
            @click="explorerService.toggleBrowseAllDuringManualRebase()"
          >
            <XmarkIcon class="w-6 h-6 opacity-50" aria-hidden="true" />
          </IconButton>
        </div>
      </template>
      <ul
        v-if="!explorerService.loading && (explorerService.conflictingFiles.length === 0
          || explorerService.browseAllDuringManualRebase)"
        aria-label="Current folder"
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
            class="w-full text-left flex items-center py-1.5 px-2 font-medium hover:bg-main-400/10
              rounded-lg"
            active-class="!bg-main-400/20"
            aria-label="Go one folder up"
            @click="explorerService.path = item.path"
          >
            <CaretLeftIcon
              class="w-6 h-6 inline-block mr-2 text-main-400"
              aria-hidden="true"
            />
            <div
              class="flex-1 mr-2 truncate text-main-300"
              aria-hidden="true"
            >
              {{ item.name }}
            </div>
          </BaseButton>
          <BaseButton
            v-if="item.type === 'tree'"
            @click="explorerService.path = item.path"
            class="w-full text-left flex items-center py-1.5 px-2 font-medium hover:bg-main-400/10
              rounded-lg"
            active-class="!bg-main-400/20"
          >
            <FolderIcon
              class="w-6 h-6 mr-2 flex-none text-main-400"
              aria-hidden="true"
            />
            <div class="sr-only">Folder: </div>
            <div
              class="flex-1 mr-2 truncate"
              :class="{
                'text-main-200': item.unchanged,
                'text-accent-400': item.added || item.modified
              }"
            >
              {{ item.name }}
            </div>
            <CaretRightIcon class="w-6 h-6 text-main-400" />
          </BaseButton>
          <BaseButton
            v-if="item.type === 'file'"
            class="w-full text-left flex items-center py-1.5 px-2 font-medium rounded-lg"
            :class="{
              'bg-main-400/20': item.path === editorService.currentFilePath,
              'hover:bg-main-400/10': item.path !== editorService.currentFilePath,
              'text-accent-400': item.added || item.modified,
              'text-white': item.unchanged
            }"
            active-class="!bg-main-400/20"
            @click="editorService.openFile(item.path)"
          >
            <FileIcon
              class="w-6 h-6 mr-2 flex-none text-main-400"
              aria-hidden="true"
            />
            <div class="sr-only">File: </div>
            <div class="flex-1 mr-2 truncate">
              {{ item.name }}
            </div>
            <AsteriskIcon20
              v-if="item.modified"
              class="text-accent-400 w-5 mr-0.5 text-center"
              role="img"
              aria-label="(modified)"
            />
            <PlusIcon20
              v-if="item.added"
              class="text-accent-400 w-5 mr-0.5 text-center"
              role="img"
              aria-label="(added)"
            />
          </BaseButton>
        </li>
      </ul>
    </div>
  </aside>
</template>
