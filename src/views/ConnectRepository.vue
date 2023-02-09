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

import BottomBarMobile from '@/components/ButtonBarMobile.vue';
import BottomBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomBarDesktop from '@/components/ButtonBarDesktop.vue';
import BottomBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import IconButton from '@/components/IconButton.vue';
import NoteszTransition from '@/components/NoteszTransition.vue';

import useFromDb from '@/composables/useFromDb';
import repositoryModel from '@/model/repositoryModel';
import settingsModel from '@/model/settingsModel';
import BasicButton from '@/components/BasicButton.vue';
import authorize from '@/integration/github/authorize';
import install from '@/integration/github/install';
import listAuthorizedRepositories from '@/integration/github/listAuthorizedRepositories';
import BaseButton from '@/components/BaseButton.vue';
import useIsTouchDevice from '@/composables/useIsTouchDevice';
import trial from '@/utils/trial';
import waitForChildWindowClose from '@/utils/waitForChildWindowClose';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';

const props = defineProps<{
  redirect: string
}>();

const router = useRouter();
const isTouchDevice = useIsTouchDevice();
const messages = useNoteszMessageBus();
const filterText = ref('');
const debouncedFilterText = refDebounced(filterText, 250);
const isAuthorizing = ref(false);
const authError = ref<Error | undefined>();

const repositoryList = useFromDb({
  get() {
    return repositoryModel.list();
  }
});
messages.on('change:repository', () => {
  repositoryList.refetch();
});

const connectedRepositories = computed(() => {
  if (!repositoryList.data) {
    return undefined;
  } else {
    return new Set(repositoryList.data.map((repo) => repo.id));
  }
});

const authorizedRepositories = useFromDb({
  get(update?: { installationId: number, setupAction: 'update' | 'install'}) {
    return listAuthorizedRepositories(update);
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
  const { canceled, update } = await install();
  if (!canceled) {
    authorizedRepositories.refetch(update);
  }
}

async function _authorize() {
  isAuthorizing.value = true;
  authError.value = undefined;
  const [user, error] = await trial(() => authorize());
  if (user) {
    authorizedRepositories.refetch();
  } else {
    authError.value = error;
  }
  isAuthorizing.value = false;
}

async function connect(repoId: string) {
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
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 max-w-xl mx-auto">
        <h1 class="text-xl font-semibold text-accent-300 mt-4 mb-8 text-center">
          Select a repository
        </h1>
        <div>
          <SpinnerIcon48
            v-if="authorizedRepositories.isFetching || isAuthorizing"
            class="w-12 h-12 text-main-400 mx-auto"
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
                <span class="font-semibold text-accent-300">
                  Notesz
                </span>
                may use.
                <BasicButton
                  class="mt-4 mx-auto"
                  @click="_install"
                >
                  <LockClosedIcon class="w-6 h-6 flex-none mr-2 text-accent-300" />
                  Set permissions
                </BasicButton>
                <br/>
                <br/>
                If you don't already have a repository for your notes, you should create one first.
                <BasicButton
                  class="mt-4 mx-auto"
                  @click="handleCreateRepository"
                >
                  <PlusIcon class="w-6 h-6 flex-none mr-2 text-accent-300" />
                  Create new repository
                </BasicButton>
              </div>
              <template v-else>
                <div
                  class="max-w-screen-sm bg-main-400/20 flex items-center rounded-lg
                    border-2 border-transparent touch:-mx-2 touch:sm:mx-0
                    focus-within:bg-main-400/20 focus-within:border-main-400 relative"
                >
                  <SearchIcon class="text-accent-300 m-2 w-6 h-6" />
                  <input
                    class="flex-1 bg-transparent focus:outline-none text-white"
                    v-model="filterText"
                  />
                  <NoteszTransition
                    enter-from-class="opacity-0 transform scale-50"
                    leave-to-class="opacity-0 transform scale-50"
                  >
                    <IconButton
                      v-if="filterText.length > 0"
                      class="ml-2 p-2"
                      @click="filterText = ''"
                    >
                      <XmarkIcon class="w-6 h-6" />
                    </IconButton>
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
                      <PlusIcon class="w-6 h-6 flex-none mr-2 text-main-400" />
                      <div class="flex-1 text-left font-semibold text-white">
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
                      @click="connect(repo.full_name)"
                    >
                        <GitHubIcon class="w-6 h-6 flex-none mr-2 text-main-400" />
                        <div class="flex-1 text-left font-semibold text-white">
                          {{ repo.owner.login }}/<wbr/>{{ repo.name }}
                        </div>
                    </BaseButton>
                  </li>
                  <div
                    v-if="filteredAuthorizedRepositories.length === 0"
                    class="mt-8 mb-16 text-white font-semibold text-center"
                  >
                    No repositories match the term
                  </div>

                </ul>
                <div class="my-8">
                  Missing a repository?
                  <br/>
                  <BaseButton
                    class="text-accent-300 cursor-pointer mouse:hover:underline"
                    tag="a"
                    href=""
                    active-class="underline"
                    @click.prevent="_install()"
                  >
                    Update which repositories
                    <span class="font-semibold">Notesz</span>
                    may use.
                  </BaseButton>
                </div>
              </template>
            </template>
            <div
              v-else-if="authorizedRepositories.error?.code === 'unauthorized'"
              class="text-center text-main-200 font-semibold"
            >
              {{ authError?.message || 'You need to login again with GitHub.' }}
              <BasicButton
                class="mt-8 mx-auto"
                @click="_authorize"
              >
                Relogin
              </BasicButton>
            </div>
            <div
              v-else-if="authorizedRepositories.error"
              class="text-center text-main-200 font-semibold"
            >
              {{ authorizedRepositories.error?.message }}
              <BasicButton
                class="mt-8 mx-auto"
                @click="authorizedRepositories.refetch()"
              >
                Retry
              </BasicButton>
            </div>
          </template>
        </div>
      </div>
    </div>
    <BottomBarMobile
      v-if="isTouchDevice"
      class="flex-none"
    >
      <BottomBarMobileButton :to="props.redirect">
        <ArrowLeftIcon class="w-8 h-8" />
      </BottomBarMobileButton>
    </BottomBarMobile>
    <BottomBarDesktop
      v-else-if="!isTouchDevice"
      class="flex-none w-full max-w-5xl mx-auto mb-8 mt-4"
    >
      <BottomBarDesktopButton :to="props.redirect">
        <ArrowLeftIcon class="w-8 h-8" />
      </BottomBarDesktopButton>
    </BottomBarDesktop>
  </div>
</template>
