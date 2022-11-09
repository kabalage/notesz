<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { vAutoAnimate } from '@formkit/auto-animate';
import GitHubIcon from '@/assets/icons/github.svg?component';
// import ArrowLeftIcon from '@/assets/icons/arrow-left.svg?component';
import ArrowLeftIcon32 from '@/assets/icons/arrow-left-32.svg?component';
import PlusIcon from '@/assets/icons/plus.svg?component';
import ExternalLinkIcon20 from '@/assets/icons/external-link-20.svg?component';
import BottomBarMobile from '@/components/ButtonBarMobile.vue';
import BottomBarMobileButton from '@/components/ButtonBarMobileButton.vue';
import BottomBarDesktop from '@/components/ButtonBarDesktop.vue';
import BottomBarDesktopButton from '@/components/ButtonBarDesktopButton.vue';
import { useFromDb } from '@/composables/useFromDb';
import { repositories } from '@/model/repositories';
import { useAppSettings } from '@/composables/useAppSettings';
import BasicButton from '@/components/BasicButton.vue';
import BaseButton from '@/components/BaseButton.vue';

const appSettings = useAppSettings();
const repositoryList = useFromDb({
  get() {
    return repositories.list();
  }
});
const repositoryListElement = ref<HTMLElement | undefined>();

const isTouchDevice = useMediaQuery('(pointer: coarse)');
const persisted = ref<boolean|null>(null);
const persistResult = ref<boolean|null>(null);

const backNavigationPath = computed(() => {
  return appSettings.data?.selectedRepositoryId
    ? `/edit/${appSettings.data?.selectedRepositoryId}`
    : '/';
});

onMounted(async () => {
  if (navigator.storage) {
    persisted.value = await navigator.storage.persisted();
  }
});

async function persist() {
  persistResult.value = await navigator.storage.persist();
}

async function connectRepository() {
  if (!appSettings.data) return;
  const id = `kabalage/test-${Math.random().toString().slice(-6)}`;
  await repositories.add({ id, type: 'repository' });
  await repositoryList.refetch();
  appSettings.data.selectedRepositoryId = id;
}
async function disconnectRepository(id: string) {
  if (!appSettings.data) return;
  await repositories.delete(id);
  await repositoryList.refetch();
  if (appSettings.data.selectedRepositoryId === id) {
    appSettings.data.selectedRepositoryId = repositoryList.data![0]?.id || null;
  }
}

function selectRepository(repoId: string) {
  if (!appSettings.data) return;
  appSettings.data.selectedRepositoryId = repoId;
}

</script>

<template>
  <div class="h-full overflow-hidden flex flex-col">
    <div class="flex-1 overflow-y-auto">
      <div class="p-4 max-w-xl mx-auto">
        <h1 class="text-xl font-semibold text-cyan-300 my-8 text-center">Settings</h1>
        <div v-if="appSettings.data && repositoryList.data">
          <h2 class="uppercase text-sm font-semibold mb-4">Repositories</h2>
          <ul
            ref="repositoryListElement"
            class="space-y-4 mb-8"
            v-auto-animate
          >
            <BaseButton
              v-for="repo in repositoryList.data"
              :key="repo.id"
              tag="li"
              class="border-2 rounded-lg sm:flex divide-y-2 sm:divide-y-0 sm:divide-x-2
                divide-indigo-500/40 transition-transform duration-200 ease-in-out
                mouse:cursor-pointer mouse:hover:bg-indigo-500/10"
              :class="{
                'border-indigo-400 bg-indigo-500/20':
                  appSettings.data.selectedRepositoryId === repo.id,
                'border-indigo-500/40 bg-transparent':
                  appSettings.data.selectedRepositoryId !== repo.id
              }"
              active-class="scale-[90%] bg-indigo-500/10"
              :disabled="appSettings.data.selectedRepositoryId === repo.id"
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
          </ul>

          <BasicButton
            class="mx-auto"
            @click="connectRepository()"
          >
            <PlusIcon class="w-6 h-6 text-indigo-400 mr-2" />
            Connect repository
          </BasicButton>
        </div>

        <div v-if="false">
          <h1 class="text-xl font-semibold text-cyan-300 mb-4 text-center mt-16">
            Developer sandbox
          </h1>
          <div>
            <div>
              <button @click="persist()">persist</button> ({{ persisted }},  {{ persistResult }})
            </div>
            <div><a href="https://vercel.com">External link</a></div>
          </div>
          <div class="grid grid-cols-6  gap-2 sm:gap-4 mt-8">
            <!-- <div class="w-6 h-6 rounded bg-indigo-900"></div>
            <div class="w-6 h-6 rounded bg-indigo-800"></div>
            <div class="w-6 h-6 rounded bg-indigo-700"></div>
            <div class="w-6 h-6 rounded bg-indigo-600"></div>
            <div class="w-6 h-6 rounded bg-indigo-500"></div>
            <div class="w-6 h-6 rounded bg-indigo-400"></div> -->

            <!-- <div class="w-6 h-6 rounded bg-indigo-50"></div>
            <div class="w-6 h-6 rounded bg-indigo-100"></div>
            <div class="w-6 h-6 rounded bg-indigo-200"></div>
            <div class="w-6 h-6 rounded bg-indigo-300"></div>
            <div class="w-6 h-6 rounded bg-indigo-400"></div>
            <div class="w-6 h-6 rounded bg-indigo-500"></div> -->

            <div class="h-6 rounded bg-indigo-500/10"></div>
            <div class="h-6 rounded bg-indigo-500/20"></div>
            <div class="h-6 rounded bg-indigo-500/20"></div>
            <div class="h-6 rounded bg-indigo-500/40"></div>
            <div class="h-6 rounded bg-indigo-500/60"></div>
            <div class="h-6 rounded bg-indigo-500/80"></div>
            <!-- <div class="h-6 rounded bg-indigo-500/100"></div> -->

            <div class="h-6 rounded bg-indigo-400/10"></div>
            <div class="h-6 rounded bg-indigo-400/20"></div>
            <div class="h-6 rounded bg-indigo-400/40"></div>
            <div class="h-6 rounded bg-indigo-400/60"></div>
            <div class="h-6 rounded bg-indigo-400/80"></div>
            <div class="h-6 rounded bg-indigo-400/100"></div>

            <div class="h-6 rounded bg-blue-400/10"></div>
            <div class="h-6 rounded bg-blue-400/20"></div>
            <div class="h-6 rounded bg-blue-400/40"></div>
            <div class="h-6 rounded bg-blue-400/60"></div>
            <div class="h-6 rounded bg-blue-400/80"></div>
            <div class="h-6 rounded bg-blue-400/100"></div>

            <div class="h-6 rounded bg-sky-400/10"></div>
            <div class="h-6 rounded bg-sky-400/20"></div>
            <div class="h-6 rounded bg-sky-400/40"></div>
            <div class="h-6 rounded bg-sky-400/60"></div>
            <div class="h-6 rounded bg-sky-400/80"></div>
            <div class="h-6 rounded bg-sky-400/100"></div>

            <div class="h-6 rounded bg-cyan-400/10"></div>
            <div class="h-6 rounded bg-cyan-400/20"></div>
            <div class="h-6 rounded bg-cyan-400/40"></div>
            <div class="h-6 rounded bg-cyan-400/60"></div>
            <div class="h-6 rounded bg-cyan-400/80"></div>
            <div class="h-6 rounded bg-cyan-400/100"></div>

            <div class="h-6 rounded bg-green-400/10"></div>
            <div class="h-6 rounded bg-green-400/20"></div>
            <div class="h-6 rounded bg-green-400/40"></div>
            <div class="h-6 rounded bg-green-400/60"></div>
            <div class="h-6 rounded bg-green-400/80"></div>
            <div class="h-6 rounded bg-green-400/100"></div>

            <div class="h-6 rounded bg-yellow-400/10"></div>
            <div class="h-6 rounded bg-yellow-400/20"></div>
            <div class="h-6 rounded bg-yellow-400/40"></div>
            <div class="h-6 rounded bg-yellow-400/60"></div>
            <div class="h-6 rounded bg-yellow-400/80"></div>
            <div class="h-6 rounded bg-yellow-400/100"></div>

            <div class="h-6 rounded bg-orange-400/10"></div>
            <div class="h-6 rounded bg-orange-400/20"></div>
            <div class="h-6 rounded bg-orange-400/40"></div>
            <div class="h-6 rounded bg-orange-400/60"></div>
            <div class="h-6 rounded bg-orange-400/80"></div>
            <div class="h-6 rounded bg-orange-400/100"></div>

            <div class="h-6 rounded bg-red-400/10"></div>
            <div class="h-6 rounded bg-red-400/20"></div>
            <div class="h-6 rounded bg-red-400/40"></div>
            <div class="h-6 rounded bg-red-400/60"></div>
            <div class="h-6 rounded bg-red-400/80"></div>
            <div class="h-6 rounded bg-red-400/100"></div>

            <div class="h-6 rounded bg-pink-400/10"></div>
            <div class="h-6 rounded bg-pink-400/20"></div>
            <div class="h-6 rounded bg-pink-400/40"></div>
            <div class="h-6 rounded bg-pink-400/60"></div>
            <div class="h-6 rounded bg-pink-400/80"></div>
            <div class="h-6 rounded bg-pink-400/100"></div>

            <div class="h-6 rounded bg-gray-400/10"></div>
            <div class="h-6 rounded bg-gray-400/20"></div>
            <div class="h-6 rounded bg-gray-400/40"></div>
            <div class="h-6 rounded bg-gray-400/60"></div>
            <div class="h-6 rounded bg-gray-400/80"></div>
            <div class="h-6 rounded bg-gray-400/100"></div>

          </div>

          <div class="grid grid-cols-11 gap-2 sm:gap-4 mt-8">
            <!-- <div class="w-6 h-6 rounded bg-indigo-900"></div>
            <div class="w-6 h-6 rounded bg-indigo-800"></div>
            <div class="w-6 h-6 rounded bg-indigo-700"></div>
            <div class="w-6 h-6 rounded bg-indigo-600"></div>
            <div class="w-6 h-6 rounded bg-indigo-500"></div>
            <div class="w-6 h-6 rounded bg-indigo-400"></div> -->

            <!-- <div class="w-6 h-6 rounded bg-indigo-50"></div>
            <div class="w-6 h-6 rounded bg-indigo-100"></div>
            <div class="w-6 h-6 rounded bg-indigo-200"></div>
            <div class="w-6 h-6 rounded bg-indigo-300"></div>
            <div class="w-6 h-6 rounded bg-indigo-400"></div>
            <div class="w-6 h-6 rounded bg-indigo-500"></div> -->

            <div class="h-6 rounded bg-indigo-1000"></div>
            <div class="h-6 rounded bg-indigo-900"></div>
            <div class="h-6 rounded bg-indigo-800"></div>
            <div class="h-6 rounded bg-indigo-700"></div>
            <div class="h-6 rounded bg-indigo-600"></div>
            <div class="h-6 rounded bg-indigo-500"></div>
            <div class="h-6 rounded bg-indigo-400"></div>
            <div class="h-6 rounded bg-indigo-300"></div>
            <div class="h-6 rounded bg-indigo-200"></div>
            <div class="h-6 rounded bg-indigo-100"></div>
            <div class="h-6 rounded bg-indigo-50"></div>

            <div class="h-6 rounded bg-indigo-500/10"></div>
            <div class="h-6 rounded bg-indigo-500/20"></div>
            <div class="h-6 rounded bg-indigo-500/40"></div>
            <div class="h-6 rounded bg-indigo-500/60"></div>
            <div class="h-6 rounded bg-indigo-500/80"></div>
            <div class="h-6 rounded bg-indigo-500"></div>
            <div class="h-6 rounded bg-indigo-400"></div>
            <div class="h-6 rounded bg-indigo-300"></div>
            <div class="h-6 rounded bg-indigo-200"></div>
            <div class="h-6 rounded bg-indigo-100"></div>
            <div class="h-6 rounded bg-indigo-50"></div>

            <div class="h-6 rounded bg-cyan-900"></div>
            <div class="h-6 rounded bg-cyan-900"></div>
            <div class="h-6 rounded bg-cyan-800"></div>
            <div class="h-6 rounded bg-cyan-700"></div>
            <div class="h-6 rounded bg-cyan-600"></div>
            <div class="h-6 rounded bg-cyan-500"></div>
            <div class="h-6 rounded bg-cyan-400"></div>
            <div class="h-6 rounded bg-cyan-300"></div>
            <div class="h-6 rounded bg-cyan-200"></div>
            <div class="h-6 rounded bg-cyan-100"></div>
            <div class="h-6 rounded bg-cyan-50"></div>

            <div class="h-6 rounded bg-cyan-500/10"></div>
            <div class="h-6 rounded bg-cyan-500/20"></div>
            <div class="h-6 rounded bg-cyan-500/40"></div>
            <div class="h-6 rounded bg-cyan-500/60"></div>
            <div class="h-6 rounded bg-cyan-500/80"></div>
            <div class="h-6 rounded bg-cyan-500"></div>
            <div class="h-6 rounded bg-cyan-400"></div>
            <div class="h-6 rounded bg-cyan-300"></div>
            <div class="h-6 rounded bg-cyan-200"></div>
            <div class="h-6 rounded bg-cyan-100"></div>
            <div class="h-6 rounded bg-cyan-50"></div>

          </div>
        </div>
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
