<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { deleteDB } from 'idb';

import GitHubIcon from '@/assets/icons/github.svg?component';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component';
import PlusIcon from '@/assets/icons/plus.svg?component';
import ExternalLinkIcon20 from '@/assets/icons/external-link-20.svg?component';
import SparklesIcon from '@/assets/icons/sparkles.svg?component';

import BottomBarMobile from '@/components/ButtonBarMobile.vue';
import BottomBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomBarDesktop from '@/components/ButtonBarDesktop.vue';
import BottomBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import BasicButton from '@/components/BasicButton.vue';
import BaseButton from '@/components/BaseButton.vue';
import NoteszTransitionGroup from '@/components/NoteszTransitionGroup.vue';

import { trial } from '@/utils/trial';
import { useFromDb } from '@/composables/useFromDb';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import { useThemeService } from '@/services/themeService';
import { useDialogService } from '@/services/dialogService';
import { useSettings } from '@/services/settingsService';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';
import { useGitHubIntegration } from '@/services/integration/githubIntegration';
import { useUserModel } from '@/services/model/userModel';
import { useRepositoryModel } from '@/services/model/repositoryModel';

const router = useRouter();
const themeService = useThemeService();
const dialogService = useDialogService();
const settings = useSettings();
const isTouchDevice = useIsTouchDevice();
const messages = useNoteszMessageBus();
const repositoryModel = useRepositoryModel();
const githubIntegration = useGitHubIntegration();
const userModel = useUserModel();

const repositoryList = useFromDb({
  get() {
    return repositoryModel.list();
  }
});
messages.on('change:repository', () => {
  repositoryList.refetch();
});

const authError = ref<Error | undefined>(undefined);
const isAuthorizing = ref(false);

async function authorizeThenRedirect() {
  isAuthorizing.value = true;
  const connectRoute = '/connect?redirect=/settings';
  const user = await userModel.get();
  if (!user) {
    const [user, error] = await trial(() => githubIntegration.authorize());
    if (user) {
      router.push(connectRoute);
    } else {
      if (error.code !== 'canceled') {
        authError.value = error;
      }
      isAuthorizing.value = false;
    }
  } else {
    router.push(connectRoute);
  }
}

const backNavigationPath = computed(() => {
  return settings.data?.selectedRepositoryId
    ? `/edit/${settings.data?.selectedRepositoryId}`
    : '/';
});

async function disconnectRepository(id: string) {
  if (!settings.data) return;
  const confirmed = await dialogService.confirm({
    title: 'Disconnect repository?',
    description: `Are you sure you want to disconnect <em class="break-words">${id}</em>?`,
    confirmButtonLabel: 'Disconnect',
    rejectButtonLabel: 'Cancel'
  });
  if (!confirmed) return;
  if (settings.data.selectedRepositoryId === id) {
    const idx = repositoryList.data!.findIndex(repo => repo.id === id);
    settings.data.selectedRepositoryId = repositoryList.data![idx + 1]?.id
      || repositoryList.data![idx - 1]?.id
      || null;
  }
  await repositoryModel.delete(id);
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
    <div class="flex-1 overflow-y-auto overscroll-contain">
      <div
        v-if="settings.data && repositoryList.data && repositoryList.isInitialized"
        class="p-4 pb-8 max-w-xl mx-auto"
      >
        <h1 class="text-xl font-semibold text-accent-300 mt-4 mb-8 text-center">
          Settings
        </h1>

        <!-- Repositories -->
        <div>
          <div class="flex items-center mb-8">
            <h2 class="uppercase text-sm leading-normal font-semibold">Repositories</h2>
            <div class="ml-4 border-b-2 border-main-400/20 flex-1"></div>
          </div>
          <NoteszTransitionGroup tag="ul" class="space-y-4">
            <li
              v-if="repositoryList.data.length === 0"
              class="text-center"
            >
              No repositories connected yet.
            </li>
            <li
              v-for="repo in repositoryList.data"
              :key="repo.id"
              class="flex"
            >
              <BaseButton
                class="flex-1 border-2 rounded-lg sm:flex divide-y-2 sm:divide-y-0 sm:divide-x-2
                  divide-main-400/40
                  transform transition-transform duration-200 ease-in-out
                  motion-reduce:transition-none motion-reduce:transform-none
                  relative before:absolute before:inset-0 before:pointer-events-none
                  before:transition-all before:duration-200 before:ease-in-out
                  motion-reduce:before:transition-none motion-reduce:before:transform-none"
                tag="div"
                :class="{
                  'border-main-400 bg-main-400/20':
                    settings.data.selectedRepositoryId === repo.id,
                  'border-main-400/40 bg-transparent':
                    settings.data.selectedRepositoryId !== repo.id
                }"
                active-class="scale-[0.9] !bg-main-400/20 !border-main-400 motion-reduce:opacity-50
                  before:scale-[1.11111] motion-reduce:before:opacity-50"
                :disabled="settings.data.selectedRepositoryId === repo.id"
              >
                <BaseButton
                  class="w-full sm:w-auto sm:flex-1 flex items-center text-left truncate px-4 py-3
                    mouse:enabled:hover:bg-main-400/20 mouse:enabled:cursor-pointer"
                  active-class="bg-main-400/20"
                  :disabled="settings.data.selectedRepositoryId === repo.id"
                  :stop-pointer-event-propagation="false"
                  @click="selectRepository(repo.id)"
                  @keyup.enter="selectRepository(repo.id)"
                >
                  <GitHubIcon class="w-6 h-6 flex-none mr-2 text-main-400" />
                  <div class="flex-1 font-semibold text-white truncate">
                    {{ repo.id }}
                  </div>
                </BaseButton>
                <div class="flex divide-x-2 divide-main-500/40">
                  <BaseButton
                    class="flex-1 font-semibold text-center text-red-400 px-4 py-3
                      mouse:enabled:hover:bg-red-500/20"
                    active-class="bg-red-500/20"
                    @click.stop="disconnectRepository(repo.id)"
                  >
                    Disconnect
                  </BaseButton>
                  <BaseButton
                    class="flex-1 font-semibold flex justify-center items-center px-4 py-3
                      mouse:hover:bg-main-500/20"
                    active-class="bg-main-500/20"
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
          </NoteszTransitionGroup>

          <BasicButton
            class="mx-auto mt-8"
            :loading="isAuthorizing"
            @click="authorizeThenRedirect()"
          >
            <PlusIcon class="w-6 h-6 text-accent-300 mr-2" />
            <span>Connect repository</span>
          </BasicButton>
          <div v-if="authError" class="mt-4 font-medium text-red-400 text-center">
            {{ authError.message }}
          </div>
        </div>

        <!-- Appearance -->
        <div class="flex items-center mt-16 mb-8">
          <h2 class="uppercase text-sm leading-normal font-semibold">Appearance</h2>
          <div class="ml-4 border-b-2 border-main-400/20 flex-1"></div>
        </div>
        <div class="flex items-center">
          <BasicButton
            class="mx-auto"
            @click="themeService.openThemeSettings()"
          >
            <SparklesIcon class="w-6 h-6 text-accent-300 mr-2" />
            Configure theme
          </BasicButton>
        </div>

        <BasicButton
          v-if="false"
          @click="clearStorage"
          class="mx-auto mt-16"
        >
          Delete all data
        </BasicButton>

      </div>
    </div>

    <BottomBarMobile
      v-if="isTouchDevice"
      class="flex-none"
    >
      <BottomBarMobileButton :to="backNavigationPath">
        <ArrowLeftIcon class="w-6 h-6" />
      </BottomBarMobileButton>
    </BottomBarMobile>
    <BottomBarDesktop
      v-else-if="!isTouchDevice"
      class="flex-none w-full max-w-5xl mx-auto mb-8 mt-4"
    >
      <BottomBarDesktopButton :to="backNavigationPath">
        <ArrowLeftIcon class="w-8 h-8" />
      </BottomBarDesktopButton>
    </BottomBarDesktop>
  </div>
</template>
