<script setup lang="ts">
import { computed } from 'vue';
import { deleteDB } from 'idb';
import GitHubIcon from '@/assets/icons/github.svg?component';
import ArrowLeftIcon32 from '@/assets/icons/arrow-left-32.svg?component';
import PlusIcon from '@/assets/icons/plus.svg?component';
import ExternalLinkIcon20 from '@/assets/icons/external-link-20.svg?component';
import BottomBarMobile from '@/components/ButtonBarMobile.vue';
import BottomBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomBarDesktop from '@/components/ButtonBarDesktop.vue';
import BottomBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import useFromDb from '@/composables/useFromDb';
import repositoryModel from '@/model/repositoryModel';
import useSettings from '@/composables/useSettings';
import BasicButton from '@/components/BasicButton.vue';
import BaseButton from '@/components/BaseButton.vue';
import SpinnerIcon from '@/assets/icons/spinner.svg?component';
import useRepositoryConnectAction from '@/integration/github/useRepositoryConnectAction';
import useIsTouchDevice from '@/composables/useIsTouchDevice';
// import DevSandbox from './DevSandbox.vue';

const settings = useSettings();
const isTouchDevice = useIsTouchDevice();
const repositoryList = useFromDb({
  get() {
    return repositoryModel.list();
  }
});
const { isAuthorizing, authError, connect } = useRepositoryConnectAction();

const backNavigationPath = computed(() => {
  return settings.data?.selectedRepositoryId
    ? `/edit/${settings.data?.selectedRepositoryId}`
    : '/';
});

async function disconnectRepository(id: string) {
  if (!settings.data) return;
  await repositoryModel.delete(id);
  await repositoryList.refetch();
  if (settings.data.selectedRepositoryId === id) {
    settings.data.selectedRepositoryId = repositoryList.data![0]?.id || null;
  }
}

function selectRepository(repoId: string) {
  if (!settings.data) return;
  settings.data.selectedRepositoryId = repoId;
}

async function clearStorage() {
  localStorage.clear();
  await deleteDB('notesz');
  location.href = '/';
}
</script>

<template>
  <div class="h-full overflow-hidden flex flex-col">
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 max-w-xl mx-auto">
        <h1 class="text-xl font-semibold text-cyan-300 my-8 text-center">Settings</h1>
        <div v-if="settings.data && repositoryList.data">
          <h2 class="uppercase text-sm font-semibold mb-4">Repositories</h2>
          <ul class="space-y-4 mb-8" v-auto-animate>
            <li
              v-for="repo in repositoryList.data"
              :key="repo.id"
              class="flex"
            >
              <BaseButton
                class="flex-1 border-2 rounded-lg sm:flex divide-y-2 sm:divide-y-0 sm:divide-x-2
                  divide-indigo-500/40
                  mouse:enabled:cursor-pointer mouse:enabled:hover:bg-indigo-500/10
                  transform transition-transform duration-200 ease-in-out
                  motion-reduce:transition-none motion-reduce:transform-none
                  relative before:absolute before:inset-0 before:pointer-events-none
                  before:transition-all before:duration-200 before:ease-in-out
                  motion-reduce:before:transition-none motion-reduce:before:transform-none"
                :class="{
                  'border-indigo-400 bg-indigo-500/20':
                    settings.data.selectedRepositoryId === repo.id,
                  'border-indigo-500/40 bg-transparent':
                    settings.data.selectedRepositoryId !== repo.id
                }"
                active-class="scale-[0.9] bg-indigo-500/10 motion-reduce:opacity-50
                  before:scale-[1.11111] motion-reduce:before:opacity-50"
                :disabled="settings.data.selectedRepositoryId === repo.id"
                :min-active-time="200"
                @click="selectRepository(repo.id)"
                @keyup.stop.enter="selectRepository(repo.id)"
                tabindex="0"
              >
                <div
                  class="w-full sm:w-auto sm:flex-1 flex items-center text-left truncate px-4 py-3
                    mouse:enabled:hover:bg-indigo-500/10 enabled:active:bg-indigo-500/10 "
                >
                  <GitHubIcon class="w-6 h-6 flex-none mr-2 fill-indigo-400" />
                  <div class="flex-1 font-semibold text-indigo-200 truncate">
                    {{ repo.id }}
                  </div>
                </div>
                <div class="flex divide-x-2 divide-indigo-500/40">
                  <BaseButton
                    class="flex-1 font-semibold text-center text-red-400 px-4 py-3
                    border-indigo-500/40 mouse:hover:bg-red-500/20"
                    active-class="bg-red-500/20"
                    @click.stop="disconnectRepository(repo.id)"
                  >
                    Disconnect
                  </BaseButton>
                  <BaseButton
                    class="flex-1 font-semibold flex justify-center items-center px-4 py-3
                    border-indigo-500/40 mouse:hover:bg-indigo-500/20"
                    active-class="bg-indigo-500/20"
                    :href="`https://github.com/${repo.id}`"
                    target="_blank"
                    @click.stop
                  >
                    Open
                    <ExternalLinkIcon20 class="ml-1 w-5 h-5 flex-none" />
                  </BaseButton>
                </div>
              </BaseButton>
            </li>
          </ul>

          <BasicButton
            class="mx-auto w-56 touch:w-64"
            :disabled="isAuthorizing"
            @click="connect({ redirect: '/settings' })"
          >
            <template v-if="isAuthorizing">
              <SpinnerIcon class="mx-auto w-6 h-6 text-indigo-300" />
            </template>
            <template v-else>
              <PlusIcon class="w-6 h-6 text-indigo-400 mr-2" />
              <div class="flex-1 text-center">
                Connect repository
              </div>
            </template>
          </BasicButton>
          <div v-if="authError" class="mt-4 font-medium text-red-400 text-center">
            {{ authError.message }}
          </div>
        </div>
        <BasicButton
          v-if="false"
          @click="clearStorage"
          class="mx-auto mt-16"
        >
          Delete all data
        </BasicButton>
        <!-- <DevSandbox /> -->
      </div>
    </div>
    <BottomBarMobile
      v-if="isTouchDevice"
      class="flex-none"
    >
      <BottomBarMobileButton :to="backNavigationPath">
        <ArrowLeftIcon32 class="w-8 h-8" />
      </BottomBarMobileButton>
    </BottomBarMobile>
    <BottomBarDesktop
      v-else-if="!isTouchDevice"
      class="flex-none w-full max-w-5xl mx-auto mb-8 mt-4"
    >
      <BottomBarDesktopButton :to="backNavigationPath">
        <!-- <ArrowLeftIcon class="w-6 h-6" /> -->
        <ArrowLeftIcon32 class="w-8 h-8" />
      </BottomBarDesktopButton>
    </BottomBarDesktop>
  </div>
</template>
