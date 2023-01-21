<script setup lang="ts">
import { ref, computed } from 'vue';
import { refDebounced } from '@vueuse/core';
import GitHubIcon from '@/assets/icons/github.svg?component';
import ArrowLeftIcon32 from '@/assets/icons/arrow-left-32.svg?component';
import XmarkIcon from '@/assets/icons/x-mark.svg?component';
import SearchIcon from '@/assets/icons/search.svg?component';
import BottomBarMobile from '@/components/ButtonBarMobile.vue';
import BottomBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomBarDesktop from '@/components/ButtonBarDesktop.vue';
import BottomBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import useFromDb from '@/composables/useFromDb';
import repositoryModel from '@/model/repositoryModel';
import settingsModel from '@/model/settingsModel';
import BasicButton from '@/components/BasicButton.vue';
import authorize from '@/integration/github/authorize';
import install from '@/integration/github/install';
import listAuthorizedRepositories from '@/integration/github/listAuthorizedRepositories';
import BaseButton from '@/components/BaseButton.vue';
import { useRouter } from 'vue-router';
import SpinnerIcon48 from '@/assets/icons/spinner-48.svg?component';
import useIsTouchDevice from '@/composables/useIsTouchDevice';
import trial from '@/utils/trial';
// import useSyncAction from '@/integration/github/sync/useSyncAction';

const props = defineProps<{
  parentRoute: string
}>();

const router = useRouter();
const isTouchDevice = useIsTouchDevice();
const filterText = ref('');
const debouncedFilterText = refDebounced(filterText, 250);
const isAuthorizing = ref(false);
const authError = ref<Error | undefined>();

const repositoryList = useFromDb({
  get() {
    return repositoryModel.list();
  }
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

// const { isSyncing, syncStatus, sync } = useSyncAction();

async function connect(repoId: string) {
  await repositoryModel.add(repositoryModel.createRepository({ id: repoId }));
  // await sync(repoId);
  await settingsModel.update((settings) => {
    settings.selectedRepositoryId = repoId;
    return settings;
  });

  router.push(props.parentRoute);
}

</script>

<template>
  <div class="h-full overflow-hidden flex flex-col">
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 max-w-xl mx-auto">
        <h1 class="text-xl font-semibold text-cyan-300 my-8 text-center">
          Select a repository
        </h1>
        <div>
          <SpinnerIcon48
            v-if="authorizedRepositories.isFetching || isAuthorizing"
            class="w-12 h-12 text-indigo-200 mx-auto"
          />
          <template v-else>
            <template v-if="notConnectedAuthorizedRepositories && filteredAuthorizedRepositories">
              <div
                v-if="notConnectedAuthorizedRepositories.length === 0"
                class="text-center"
              >
                <span class="text-indigo-200 font-semibold">
                  {{
                    repositoryList.data?.length ?? 0 > 0
                      ? 'No other repositories are accessible.'
                      : 'No repositories are accessible yet.'
                  }}
                </span>
                <br/>
                Setup which repositories <span class="font-semibold">notesz.app</span> may use.
                <BasicButton
                  class="mt-8 mx-auto"
                  @click="_install"
                >
                  Set permissions
                </BasicButton>
              </div>
              <template v-else>
                <div
                  class="max-w-screen-sm bg-indigo-400/20 flex items-center rounded-lg
                    border-2 border-transparent touch:-mx-2 touch:sm:mx-0
                    focus-within:bg-indigo-400/20 focus-within:border-indigo-400 "
                  v-auto-animate
                >
                  <SearchIcon class="text-indigo-400 m-2 w-6 h-6" />
                  <input
                    class="flex-1 bg-transparent focus:outline-none text-indigo-200"
                    v-model="filterText"
                  />
                  <BaseButton
                    v-if="filterText.length > 0"
                    class="ml-2 p-2"
                    active-class="scale-75"
                    @click="filterText = ''"
                  >
                    <XmarkIcon class="text-indigo-400 w-6 h-6" />
                  </BaseButton>
                </div>
                <ul class="mt-2 touch:-mx-4 touch:sm:mx-0 sm:max-w-screen-sm">
                  <li
                    v-for="repo in filteredAuthorizedRepositories"
                    :key="repo.id"
                    class="touch:border-b touch:border-indigo-400/30 touch:first:border-t"
                  >
                    <BaseButton
                      class="w-full mouse:enabled:hover:bg-indigo-400/20
                        flex items-center px-4 py-3 mouse:px-3 mouse:py-2 mouse:rounded-lg"
                      :disabled="!connectedRepositories
                        || connectedRepositories.has(repo.full_name)"
                      active-class="bg-indigo-400/20"
                      @click="connect(repo.full_name)"
                    >
                        <GitHubIcon class="w-6 h-6 flex-none mr-2 fill-indigo-400" />
                        <div class="flex-1 text-left font-semibold text-indigo-200">
                          {{ repo.owner.login }}/<wbr/>{{ repo.name }}
                        </div>
                    </BaseButton>
                  </li>
                  <div
                    v-if="filteredAuthorizedRepositories.length === 0"
                    class="mt-8 mb-16 text-indigo-200 font-semibold text-center"
                  >
                    No repositories match the term
                  </div>

                </ul>
                <div class="my-8">
                  Missing a repository?
                  <br/>
                  <BaseButton
                    class="text-indigo-400 cursor-pointer mouse:hover:underline"
                    tag="a"
                    href=""
                    active-class="underline"
                    @click.prevent="_install()"
                  >
                    Update which repositories
                    <span class="font-semibold">notesz.app</span>
                    may use.
                  </BaseButton>
                </div>
              </template>
            </template>
            <div
              v-else-if="authorizedRepositories.error?.code === 'unauthorized'"
              class="text-center text-indigo-200 font-semibold"
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
              class="text-center text-indigo-200 font-semibold"
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
      <BottomBarMobileButton :to="props.parentRoute">
        <ArrowLeftIcon32 class="w-8 h-8" />
      </BottomBarMobileButton>
    </BottomBarMobile>
    <BottomBarDesktop
      v-else-if="!isTouchDevice"
      class="flex-none w-full max-w-5xl mx-auto mb-8 mt-4"
    >
      <BottomBarDesktopButton :to="props.parentRoute">
        <ArrowLeftIcon32 class="w-8 h-8" />
      </BottomBarDesktopButton>
    </BottomBarDesktop>
  </div>
</template>
