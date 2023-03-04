<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { deleteDB } from 'idb';

import GitHubIcon from '@/assets/icons/github.svg?component';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component';
import PlusIcon from '@/assets/icons/plus.svg?component';
import ExternalLinkIcon20 from '@/assets/icons/external-link-20.svg?component';
import CheckIcon from '@/assets/icons/check.svg?component';

import ButtonBarMobile from '@/components/ButtonBarMobile.vue';
import ButtonBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomButtonBarDesktop from '@/components/BottomButtonBarDesktop.vue';
import ButtonBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import BasicButton from '@/components/BasicButton.vue';
import BaseButton from '@/components/BaseButton.vue';
import BasicSwitch from '@/components/BasicSwitch.vue';
import BasicSelect from '@/components/BasicSelect.vue';
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

const syntaxThemes = [
  { label: 'Notesz', value: 'notesz' },
  { label: 'Dracula', value: 'dracula' }
];

const editorFontSizes = [
  { label: 'Smaller', value: 0.75 },
  { label: 'Normal', value: 0.875 },
  { label: 'Larger', value: 1 }
];

const repositoryList = useFromDb({
  get() {
    return repositoryModel.list();
  }
});
messages.on('change:repository', () => {
  repositoryList.refetch();
});

const user = useFromDb({
  get: userModel.get
});
messages.on('change:user', () => {
  user.refetch();
});

const authError = ref<Error | undefined>(undefined);
const isAuthorizing = ref(false);

async function authorizeThenRedirect() {
  isAuthorizing.value = true;
  const connectRoute = '/connect?redirect=/settings';
  // Fetching user must be done before calling authorize, because authorize opens a popup that
  // requires to be called from a user interaction. Awaiting here for the user to be fetched
  // would cause the popup to be blocked.
  if (!user.data) {
    const [authResult, error] = await trial(() => githubIntegration.authorize());
    if (authResult) {
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
        class="p-4 pb-16 max-w-xl mx-auto"
      >

        <!-- Repositories -->
        <div>
          <h2 class="text-xl font-semibold text-accent-300 mt-4 mb-8 text-left">
            Repositories
          </h2>
          <p class="mb-6">
            You may connect multiple repositories to
            <span class="text-white font-medium">Notesz</span>.
            Select the one you want to work on.
          </p>
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
                class="flex-1 border rounded-lg sm:flex divide-y sm:divide-y-0 sm:divide-x
                  divide-main-400/40
                  transform transition-transform duration-200 ease-in-out
                  motion-reduce:transition-none motion-reduce:transform-none
                  relative before:absolute before:inset-0 before:pointer-events-none
                  before:transition-all before:duration-200 before:ease-in-out
                  motion-reduce:before:transition-none motion-reduce:before:transform-none"
                tag="div"
                :class="{
                  'border-transparent bg-main-400/20 ring-2 ring-main-400':
                    settings.data.selectedRepositoryId === repo.id,
                  'border-main-400/40 bg-transparent':
                    settings.data.selectedRepositoryId !== repo.id
                }"
                active-class="scale-[0.9]  motion-reduce:opacity-50
                  before:scale-[1.11111] motion-reduce:before:opacity-50"
                :disabled="settings.data.selectedRepositoryId === repo.id"
              >
                <BaseButton
                  class="w-full sm:w-auto sm:flex-1 flex items-center text-left truncate px-3 py-2.5
                    mouse:enabled:hover:bg-main-400/20 mouse:enabled:cursor-pointer
                    mouse:enabled:hover:rounded-t-lg mouse:enabled:hover:sm:rounded-tr-none
                    mouse:enabled:hover:sm:rounded-bl-lg"
                  active-class="!bg-transparent"
                  :disabled="settings.data.selectedRepositoryId === repo.id"
                  :stop-pointer-event-propagation="false"
                  @click="selectRepository(repo.id)"
                  @keyup.enter="selectRepository(repo.id)"
                >

                  <CheckIcon
                    class="w-6 h-6 flex-none mr-2 text-accent-300"
                    :class="settings.data.selectedRepositoryId !== repo.id
                      ? 'invisible': ''"
                  />
                  <GitHubIcon class="w-6 h-6 flex-none mr-2 text-main-300" />
                  <div class="flex-1 font-medium text-white truncate">
                    {{ repo.id }}
                  </div>
                </BaseButton>
                <div class="flex divide-x divide-main-500/40">
                  <BaseButton
                    class="flex-1 font-medium text-center text-red-400 px-4 py-2.5
                      mouse:enabled:hover:bg-red-500/20
                      mouse:enabled:hover:rounded-bl-lg mouse:enabled:hover:sm:rounded-bl-none"
                    active-class="bg-red-500/20"
                    @click.stop="disconnectRepository(repo.id)"
                  >
                    Disconnect
                  </BaseButton>
                  <BaseButton
                    class="flex-1 font-medium flex justify-center items-center px-4 py-2.5
                      mouse:hover:bg-main-500/20 mouse:enabled:hover:rounded-br-lg
                      mouse:enabled:hover:sm:rounded-tr-lg"
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

        <!-- Settings -->
        <div class="flex items-center mt-16 mb-8">
          <h2 class="text-xl font-semibold text-accent-300 text-left">
            Settings
          </h2>
          <div
            class="ml-4 flex-1 h-[2px] rounded bg-gradient-to-r from-main-400/30 to-transparent
              self-center"
          />
        </div>
        <div class="bg-main-400/20 rounded-lg divide-y divide-main-400/20">
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Theme
            </div>
            <BasicButton
              @click="themeService.themeSettingsOpen
                ? themeService.closeThemeSettings()
                : themeService.openThemeSettings()"
            >
              Configure...
            </BasicButton>
          </div>
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Syntax theme
            </div>
            <BasicSelect
              class="w-40"
              v-model="settings.data.syntaxTheme"
              :options="syntaxThemes"
            />
          </div>
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Editor font size
            </div>
            <BasicSelect
              class="w-40"
              v-model="settings.data.editorFontSize"
              :options="editorFontSizes"
            />
          </div>
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Spellcheck
            </div>
            <BasicSwitch v-model="settings.data.spellcheck" />
          </div>
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Autocapitalize
            </div>
            <BasicSwitch v-model="settings.data.autocapitalize" />
          </div>
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Autocorrect
            </div>
            <BasicSwitch v-model="settings.data.autocorrect" />
          </div>
          <div class="flex items-center py-2 pl-4 pr-2">
            <div class="text-white font-medium flex-1 mr-2">
              Backdrop blur effects
            </div>
            <BasicSwitch v-model="settings.data.backdropFilter" />
          </div>
        </div>

        <!-- About -->
        <div class="flex items-center mt-16 mb-8">
          <h2 class="text-xl font-semibold text-accent-300 text-left">
            About
          </h2>
          <div
            class="ml-4 flex-1 h-[2px] rounded bg-gradient-to-r from-main-400/40 to-transparent
              self-center"
          />
        </div>
        <article class="text-main-200 space-y-6">
          <p>
            I'm <span class="text-white font-medium">Balázs Kaufmann</span> (
            <a
              href="https://github.com/kabalage"
              target="_blank"
              class="text-accent-300 cursor-pointer underline underline-offset-2
                decoration-accent-300/40 mouse:hover:decoration-accent-300"
            >
              @kabalage
            </a>
            ), and I created
            <span class="text-white font-medium">Notesz</span>
            as a personal project. My goal was to create a simple, serverless note-taking app that
            stores everything on GitHub, and also works well on phones.
          </p>
          <p>
            I'm still deciding on how I'd like to handle collaboration, but feel free to create
            discussions on GitHub, or create issues if you run into bugs.
          </p>
          <p>
            <span class="font-medium text-white">Source:</span>
            <a
              class="ml-2 text-accent-300 cursor-pointer underline underline-offset-2
                decoration-accent-300/40 mouse:hover:decoration-accent-300"
              href="https://github.com/kabalage/notesz"
              target="_blank"
            >
              <GitHubIcon
                class="inline-block w-5 h-5 mr-0.5 text-accent-300"
              />
              <span>kabalage/notesz</span>
            </a>
          </p>
          <p class="text-main-400 !mt-12">
            <span class="font-bold">Fun fact:</span>
            “Notesz” means “pocket notebook” in Hungarian.
            It's pronounced
            <span class="whitespace-nowrap">“not-ass”, </span><wbr>
            <span class="whitespace-nowrap">IPA: /ˈnotɛs/</span>.
          </p>
        </article>

        <BasicButton
          v-if="false"
          @click="clearStorage"
          class="mx-auto mt-16"
        >
          Delete all data
        </BasicButton>

      </div>
    </div>

    <ButtonBarMobile v-if="isTouchDevice">
      <ButtonBarMobileButton :to="backNavigationPath">
        <ArrowLeftIcon class="w-6 h-6" />
      </ButtonBarMobileButton>
    </ButtonBarMobile>
    <BottomButtonBarDesktop v-else-if="!isTouchDevice">
      <ButtonBarDesktopButton
        :to="backNavigationPath"
        class="!p-2.5"
      >
        <ArrowLeftIcon class="w-6 h-6" />
      </ButtonBarDesktopButton>
    </BottomButtonBarDesktop>
  </div>
</template>
