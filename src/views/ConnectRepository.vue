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

import { useFromDb } from '@/composables/useFromDb';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import { trial } from '@/utils/trial';
import { waitForChildWindowClose } from '@/utils/waitForChildWindowClose';
import { useRepositoryModel } from '@/services/model/repositoryModel';
import { useSettingsModel } from '@/services/model/settingsModel';
import { useGitHubIntegration } from '@/services/integration/githubIntegration';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';

const props = defineProps<{
  redirect: string
}>();

const router = useRouter();
const isTouchDevice = useIsTouchDevice();
const messages = useNoteszMessageBus();
const repositoryModel = useRepositoryModel();
const settingsModel = useSettingsModel();
const githubIntegration = useGitHubIntegration();

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
  const { canceled, update } = await githubIntegration.install();
  if (!canceled) {
    authorizedRepositories.refetch(update);
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
                <span class="font-medium text-accent-300">
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
                <div class="relative touch:-mx-2 touch:sm:mx-0">
                  <BasicInput
                    class="w-full pl-10"
                    :class="{
                      'pr-10': filterText.length > 0,
                      'pr-4': filterText.length === 0
                    }"
                    v-model="filterText"
                  />
                  <div
                    class="p-2 absolute top-0 left-0 bottom-0 pointer-events-none flex items-center
                      justify-center"
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
                      <PlusIcon class="w-6 h-6 flex-none mr-2 text-main-400" />
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
                      @click="connect(repo.full_name)"
                    >
                        <GitHubIcon class="w-6 h-6 flex-none mr-2 text-main-400" />
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
              class="text-center text-main-200 font-medium"
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
              class="text-center text-main-200 font-medium"
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
    <ButtonBarMobile
      v-if="isTouchDevice"
      class="flex-none"
    >
      <ButtonBarMobileButton :to="props.redirect">
        <ArrowLeftIcon class="w-6 h-6" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
    <BottomButtonBarDesktop v-else-if="!isTouchDevice">
      <ButtonBarDesktopButton
        :to="props.redirect"
        class="!p-2.5"
      >
        <ArrowLeftIcon class="w-6 h-6" />
      </ButtonBarDesktopButton>
    </BottomButtonBarDesktop>
  </div>
</template>
