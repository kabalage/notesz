<script setup lang="ts">
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { deleteDB } from 'idb';

import GitHubIcon from '@/assets/icons/github.svg?component';
import { useAppSettings } from '@/composables/useAppSettings';
import { repositories } from '@/model/repositories';
import BasicButton from '@/components/BasicButton.vue';

const router = useRouter();

const appSettings = useAppSettings();

watch(() => appSettings.data, () => {
  if (appSettings.data && appSettings.data?.selectedRepositoryId) {
    navigateToEditor(appSettings.data.selectedRepositoryId);
  }
}, { deep: true });

async function addRepository() {
  if (!appSettings.data) return;
  const repositoryId = 'kabalage/test';
  await repositories.add({
    id: repositoryId,
    type: 'repository',
  });
  appSettings.data.selectedRepositoryId = repositoryId;
  navigateToEditor(repositoryId);
}

function navigateToEditor(repositoryId: string) {
  router.replace(`/edit/${repositoryId}/`);
}

async function clearStorage() {
  localStorage.clear();
  await deleteDB('notesz');
  location.reload();
}

</script>

<template>
  <div
    v-if="appSettings.data && !appSettings.data.selectedRepositoryId"
    class="h-full grid overflow-y-auto"
  >
    <div
      class="place-self-center px-8 py-8 max-w-xl mx-auto text-center mb-safe-b"
    >
      <h1 class="font-semibold mb-2 text-center">Welcome to</h1>
      <div class="flex justify-center mb-8" @click="clearStorage">
        <img src="@/assets/logo-dark.svg" class="h-12 my-2"/>
      </div>
      <p class="max-w-sm mx-auto font-semibold text-indigo-200 mb-4">
        A cross platform, open-source note taking app that stores your notes on GitHub.
      </p>
      <p class="max-w-sm mx-auto mb-8">
        It works offline, and all your data is saved only in your browser and your GitHub
        repository, nowhere else.
      </p>
      <BasicButton
        class="mx-auto"
        @click="addRepository()"
      >
        <GitHubIcon class="flex-none h-6 w-6 fill-indigo-400 mr-2" />
        Connect GitHub repository
      </BasicButton>
    </div>
  </div>
</template>
