<script setup lang="ts">
import { ref, computed } from 'vue';
import { refDebounced } from '@vueuse/core';
import { useRouter } from 'vue-router';

import GitHubIcon from '@/assets/icons/github.svg?component';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component';
import XmarkIcon from '@/assets/icons/x-mark.svg?component';
import SearchIcon from '@/assets/icons/search.svg?component';
import SpinnerIcon48 from '@/assets/icons/spinner-48.svg?component';
import PlusIcon from '@/assets/icons/plus.svg?component';
import LockClosedIcon from '@/assets/icons/lock-closed.svg?component';

import ButtonBarMobile from '@/components/ButtonBarMobile.vue';
import ButtonBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomButtonBarDesktop from '@/components/BottomButtonBarDesktop.vue';
import ButtonBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import IconButton from '@/components/IconButton.vue';
import NoteszTransition from '@/components/NoteszTransition.vue';
import BasicButton from '@/components/BasicButton.vue';
import BaseButton from '@/components/BaseButton.vue';
import BasicInput from '@/components/BasicInput.vue';

import { useAsyncState } from '@/composables/useAsyncState';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import { trial } from '@/utils/trial';
import { waitForChildWindowClose } from '@/utils/waitForChildWindowClose';

import { useService } from '@/utils/injector';
import { RepositoryModel } from '@/services/model/RepositoryModel';
import { SettingsModel } from '@/services/model/SettingsModel';
import { GitHubIntegration } from '@/services/integration/GitHubIntegration';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';
import type { InstallResult } from '@/services/integration/github/install';

const props = defineProps<{
  redirect: string
}>();

const noteszMessageBus = useService(NoteszMessageBus);
const repositoryModel = useService(RepositoryModel);
const settingsModel = useService(SettingsModel);
const githubIntegration = useService(GitHubIntegration);
const router = useRouter();
const isTouchDevice = useIsTouchDevice();

const filterText = ref('');
const debouncedFilterText = refDebounced(filterText, 250);
const isAuthorizing = ref(false);
const authError = ref<Error | undefined>();
const connectingRepositoryId = ref<string | undefined>();

const repositoryList = useAsyncState({
  get() {
    return repositoryModel.list();
  }
});
noteszMessageBus.on('change:repository', (id) => {
  // Only refetch if the changed repository is not the one we're currently connecting.,
  // It's disorienting to pull out the repository immediately from the list after selecting it.
  if (connectingRepositoryId.value !== id) {
    repositoryList.refetch();
  }
});

const connectedRepositories = computed(() => {
  if (!repositoryList.data) {
    return undefined;
  } else {
    return new Set(repositoryList.data.map((repo) => repo.id));
  }
});

const authorizedRepositories = useAsyncState({
  get(update?: InstallResult) {
    return githubIntegration.listAuthorizedRepositories(update);
  }
});

const notConnectedAuthorizedRepositories = computed(() => {
  if (!authorizedRepositories.data || !connectedRepositories.value) {
    return undefined;
  }
  return authorizedRepositories.data.filter((repo) => {
    return !connectedRepositories.value!.has(repo.full_name);
  });
});

const filteredAuthorizedRepositories = computed(() => {
  if (!notConnectedAuthorizedRepositories.value) {
    return undefined;
  }
  if (!filterText.value) {
    return notConnectedAuthorizedRepositories.value;
  }
  return notConnectedAuthorizedRepositories.value.filter((repo) => {
    return repo.full_name.toLocaleLowerCase().includes(
      debouncedFilterText.value.toLocaleLowerCase()
    );
  });
});

async function _install() {
  const { canceled, result } = await githubIntegration.install();
  if (!canceled) {
    authorizedRepositories.refetch(result);
  }
}

async function _authorize() {
  isAuthorizing.value = true;
  authError.value = undefined;
  const [user, error] = await trial(() => githubIntegration.authorize());
  if (user) {
    authorizedRepositories.refetch();
  } else {
    authError.value = error;
  }
  isAuthorizing.value = false;
}

async function connect(repoId: string) {
  connectingRepositoryId.value = repoId;
  await repositoryModel.add(repositoryModel.createRepository({ id: repoId }));
  await settingsModel.update((settings) => {
    settings.selectedRepositoryId = repoId;
    return settings;
  });
  router.push(`/sync/${repoId}?redirect=${props.redirect}`);
}

async function handleCreateRepository() {
  const childWindow = window.open('https://github.com/new', '_blank', 'popup');
  if (childWindow === null) {
    throw new Error('Failed to open child window');
  }
  await waitForChildWindowClose(childWindow);
  authorizedRepositories.refetch();
}

</script>

<template>
  <div class="h-full overflow-hidden flex flex-col">
    <main class="flex-1 overflow-y-auto">
      <div class="p-4 max-w-xl mx-auto">
        <h1 class="text-xl font-semibold text-accent-300 mt-4 mb-8 text-center">
          Select a repository
        </h1>
        <div>
          <SpinnerIcon48
            v-if="authorizedRepositories.isGetting || isAuthorizing"
            class="w-12 h-12 text-main-400 mx-auto"
            aria-label="Loading"
            role="status"
          />
          <template v-else>
            <template v-if="notConnectedAuthorizedRepositories && filteredAuthorizedRepositories">
              <div
                v-if="notConnectedAuthorizedRepositories.length === 0"
                class="text-center max-w-sm mx-auto"
              >
                {{
                  repositoryList.data?.length ?? 0 > 0
                    ? 'No other repositories are accessible.'
                    : 'No repositories are accessible yet.'
                }}
                <br/>
                Setup which repositories
                <span class="font-medium text-accent-300">
                  Notesz
                </span>
                may use.
                <BasicButton
                  class="mt-4 mx-auto"
                  @click="_install"
                >
                  <LockClosedIcon
                    class="w-6 h-6 flex-none mr-2 text-accent-300"
                    aria-hidden="true"
                  />
                  Set permissions
                </BasicButton>
                <br/>
                <br/>
                If you don't already have a repository for your notes, you should create one first.
                <BasicButton
                  class="mt-4 mx-auto"
                  @click="handleCreateRepository"
                >
                  <PlusIcon
                    class="w-6 h-6 flex-none mr-2 text-accent-300"
                    aria-hidden="true"
                  />
                  Create new repository
                </BasicButton>
              </div>
              <template v-else>
                <div class="relative touch:-mx-2 touch:sm:mx-0">
                  <BasicInput
                    class="w-full pl-10"
                    aria-label="Filter"
                    :class="{
                      'pr-10': filterText.length > 0,
                      'pr-4': filterText.length === 0
                    }"
                    v-model="filterText"
                  />
                  <div
                    class="p-2 absolute top-0 left-0 bottom-0 pointer-events-none flex items-center
                      justify-center"
                    aria-hidden="true"
                  >
                    <SearchIcon class="text-accent-300 w-6 h-6" />
                  </div>
                  <NoteszTransition
                    enter-from-class="opacity-0 transform scale-50"
                    leave-to-class="opacity-0 transform scale-50"
                  >
                    <div
                      v-if="filterText.length > 0"
                      class="absolute top-0 right-0 bottom-0 flex items-center justify-center"
                    >
                      <IconButton
                        class="p-2 rounded-lg"
                        aria-label="Clear filtering"
                        @click="filterText = ''"
                      >
                        <XmarkIcon class="w-6 h-6" />
                      </IconButton>
                    </div>
                  </NoteszTransition>
                </div>
                <ul class="mt-2 touch:mt-4 touch:-mx-4 touch:sm:mx-0 sm:max-w-screen-sm">
                  <li
                    v-if="filterText === ''"
                    class="touch:border-b touch:border-main-400/20 touch:first:border-t"
                  >
                    <BaseButton
                      class="w-full mouse:enabled:hover:bg-main-400/20
                        flex items-center px-4 py-3 mouse:px-3 mouse:py-2 mouse:rounded-lg"
                      active-class="bg-main-400/20"
                      @click="handleCreateRepository"
                    >
                      <PlusIcon
                        class="w-6 h-6 flex-none mr-2 text-main-400"
                        aria-hidden="true"
                      />
                      <div class="flex-1 text-left font-medium text-white">
                        Create new repository
                      </div>
                    </BaseButton>
                  </li>
                  <li
                    v-for="repo in filteredAuthorizedRepositories"
                    :key="repo.id"
                    class="touch:border-b touch:border-main-400/20 touch:first:border-t"
                  >
                    <BaseButton
                      class="w-full mouse:enabled:hover:bg-main-400/20
                        flex items-center px-4 py-3 mouse:px-3 mouse:py-2 mouse:rounded-lg"
                      active-class="bg-main-400/20"
                      :aria-label="repo.full_name"
                      @click="connect(repo.full_name)"
                    >
                        <GitHubIcon
                          class="w-6 h-6 flex-none mr-2 text-main-400"
                          aria-hidden="true"
                        />
                        <div class="flex-1 text-left font-medium text-white">
                          {{ repo.owner.login }}/<wbr/>{{ repo.name }}
                        </div>
                    </BaseButton>
                  </li>
                  <div
                    v-if="filteredAuthorizedRepositories.length === 0"
                    class="mt-8 mb-16 text-white font-medium text-center"
                  >
                    No repositories match the term
                  </div>

                </ul>
                <p class="my-8">
                  Missing a repository?
                  <br/>
                  <BaseButton
                    class="text-accent-300 cursor-pointer mouse:hover:underline"
                    active-class="underline"
                    @click="_install()"
                  >
                    Update which repositories
                    <span class="font-semibold">Notesz</span>
                    may use.
                  </BaseButton>
                </p>
              </template>
            </template>
            <p
              v-else-if="authorizedRepositories.error?.code === 'unauthorized'"
              class="text-center text-main-200 font-medium"
            >
              {{ authError?.message || 'You need to login again with GitHub.' }}
              <BasicButton
                class="mt-8 mx-auto"
                @click="_authorize"
              >
                Relogin
              </BasicButton>
            </p>
            <p
              v-else-if="authorizedRepositories.error"
              class="text-center text-main-200 font-medium"
            >
              {{ authorizedRepositories.error?.message }}
              <BasicButton
                class="mt-8 mx-auto"
                @click="authorizedRepositories.refetch()"
              >
                Retry
              </BasicButton>
            </p>
          </template>
        </div>
      </div>
    </main>
    <ButtonBarMobile
      v-if="isTouchDevice"
      class="flex-none"
    >
      <ButtonBarMobileButton
        :to="props.redirect"
        aria-label="Back"
      >
        <ArrowLeftIcon class="w-6 h-6" aria-hidden="true" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
    <BottomButtonBarDesktop v-else-if="!isTouchDevice">
      <ButtonBarDesktopButton
        :to="props.redirect"
        class="!p-2.5"
        aria-label="Back"
      >
        <ArrowLeftIcon class="w-6 h-6" aria-hidden="true" />
      </ButtonBarDesktopButton>
    </BottomButtonBarDesktop>
  </div>
</template>
