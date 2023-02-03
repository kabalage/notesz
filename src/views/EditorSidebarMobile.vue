<script setup lang="ts">
import CaretLeftIcon from '@/assets/icons/caret-left.svg?component';
import CaretRightIcon from '@/assets/icons/caret-right.svg?component';
import CogIcon from '@/assets/icons/cog.svg?component';
import FolderIcon from '@/assets/icons/folder.svg?component';
import FileIcon from '@/assets/icons/file.svg?component';
import FileNewIcon from '@/assets/icons/file-new.svg?component';
import SyncIcon from '@/assets/icons/sync.svg?component';
import PlusIcon20 from '@/assets/icons/plus-20.svg?component';
import AsteriskIcon20 from '@/assets/icons/asterisk-20.svg?component';
import XmarkIcon from '@/assets/icons/x-mark.svg?component';

import ButtonBarMobile from '@/components/ButtonBarMobile.vue';
import ButtonBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BaseButton from '@/components/BaseButton.vue';
import BasicButton from '@/components/BasicButton.vue';
import IconButton from '@/components/IconButton.vue';
import NoteszLogo from '@/components/NoteszLogo.vue';
import { useEditorState } from '@/stores/editorState';
import { useExplorerState } from '@/stores/explorerState';

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
      <div class="flex justify-center mb-3">
        <NoteszLogo
          class="h-8 my-2"
          text-class="text-white"
          icon-class="text-accent-300"
          icon-shade-class="text-main-400/40"
          @click="locationReload()"
        />
      </div>
      <!-- <div class="flex">
        <div class="p-8 bg-gray-200">
          <NoteszLogo
            class="h-8 my-2"
            text-class="text-gray-900"
            icon-class="text-gray-800"
            icon-shade-class="text-white"
          />
        </div>
        <div class="p-8 bg-white">
          <NoteszLogo
            class="h-8 my-2"
            text-class="text-gray-900"
            icon-class="text-gray-800"
            icon-shade-class="text-gray-200"
          />
        </div>
      </div> -->
      <template v-if="explorerState.conflictingFiles.length > 0">
        <h2 class="text-accent-300 font-semibold mt-8 px-4 leading-loose" >
          Conflicting files
        </h2>
        <ul
          class="mx-4 divide-y divide-main-400/20 bg-main-400/10
            rounded-lg overflow-hidden"
        >
          <li
            v-for="file in explorerState.conflictingFiles"
            :key="file.path"
          >
            <BaseButton
              :href="`/edit/${editorState.repositoryId}/${file.path}`"
              @click.prevent="editorState.openFile(file.path)"
              class="flex items-center py-3 px-4 text-white font-medium"
              :class="{
                'bg-main-400/20': file.path === editorState.currentFilePath
              }"
              active-class="bg-main-400/20"
            >
              <FileIcon class="w-6 h-6 mr-2 text-main-400/60 flex-none" />
              <div class="flex-1 truncate">
                <div class="truncate leading-tight">
                  {{ file.name }}
                </div>
                <div class="flex-1 truncate opacity-50 text-sm leading-none">
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
          <h2 class="flex-1 text-accent-300 font-semibold leading-loose">
            All files
          </h2>
          <IconButton
            @click="explorerState.browseAllDuringManualRebase = false"
          >
            <XmarkIcon class="w-6 h-6 opacity-50" />
          </IconButton>
        </div>
      </template>
      <ul
        v-if="explorerState.conflictingFiles.length === 0
          || explorerState.browseAllDuringManualRebase"
        class="divide-y divide-main-400/20"
        :class="{
          'bg-main-400/10 mx-4 rounded-lg overflow-hidden border-0':
            explorerState.browseAllDuringManualRebase,
          'border-y border-main-400/20': !explorerState.browseAllDuringManualRebase,
          'border-b-0': !explorerState.browseAllDuringManualRebase
            && explorerState.items.length === 0
        }"
      >
        <li
          v-if="explorerState.items.length === 0"
          class="mt-8 text-center"
        >
          The repository is empty.
          <BasicButton
            v-if="!explorerState.browseAllDuringManualRebase"
            class="mt-4 mx-auto"
            @click="editorState.addFile('')"
          >
            Create a file
          </BasicButton>
        </li>
        <li
          v-for="item in explorerState.items"
          :key="item.path"
        >
          <BaseButton
            v-if="item.type === 'parentTree'"
            :href="`/edit/${editorState.repositoryId}/${item.path}`"
            @click.prevent="explorerState.path = item.path"
            class="flex items-center py-3 px-4 font-medium"
            active-class="bg-main-400/20"
          >
            <CaretLeftIcon class="w-6 h-6 inline-block mr-2 text-main-400" />
            <div class="flex-1 mr-2 truncate text-main-300">
              {{ item.name }}
            </div>
          </BaseButton>
          <BaseButton
            v-if="item.type === 'tree'"
            :href="`/edit/${editorState.repositoryId}/${item.path}`"
            @click.prevent="explorerState.path = item.path"
            class="flex items-center py-3 px-4 font-medium"
            active-class="bg-main-400/20"
          >
            <FolderIcon class="w-6 h-6 mr-2 text-main-400 flex-none"/>
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
            :href="`/edit/${editorState.repositoryId}/${item.path}`"
            @click.prevent="editorState.openFile(item.path)"
            class="flex items-center py-3 px-4 text-white font-medium"
            :class="{
              'bg-main-400/20': item.path === editorState.currentFilePath,
              'text-green-400': item.added,
              'text-accent-400': item.modified
            }"
            active-class="bg-main-400/20"
          >
            <FileIcon
              class="w-6 h-6 mr-2 text-main-400/60 flex-none"
            />
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
    <ButtonBarMobile class="flex-none">
      <ButtonBarMobileButton @click="editorState.addFile(explorerState.path)">
        <FileNewIcon class="w-8 h-8" />
      </ButtonBarMobileButton>
      <ButtonBarMobileButton
        @click="editorState.startSync"
        :disabled="editorState.syncDisabled"
      >
        <SyncIcon class="w-8 h-8" />
      </ButtonBarMobileButton>
      <ButtonBarMobileButton to="/settings">
        <CogIcon class="w-8 h-8" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
  </div>
</template>
