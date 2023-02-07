<script setup lang="ts">
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { deleteDB } from 'idb';
import GitHubIcon from '@/assets/icons/github.svg?component';
import SpinnerIcon from '@/assets/icons/spinner.svg?component';
import useSettings from '@/composables/useSettings';
import BasicButton from '@/components/BasicButton.vue';
import NoteszLogo from '@/components/NoteszLogo.vue';
import useRepositoryConnectAction from '@/integration/github/useRepositoryConnectAction';

const router = useRouter();
const settings = useSettings();
const { isAuthorizing, authError, connect } = useRepositoryConnectAction();

watch(() => settings.data, () => {
  if (settings.data && settings.data?.selectedRepositoryId) {
    navigateToEditor(settings.data.selectedRepositoryId);
  }
}, { deep: true, immediate: true });

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
  <div class="h-full grid overflow-y-auto">
    <div
      v-if="settings.data && !settings.data.selectedRepositoryId"
      class="place-self-center px-8 py-8 max-w-xl mx-auto text-center mb-safe-b"
    >
      <h1 class="font-semibold mb-4 text-center">Welcome to</h1>
      <div class="flex justify-center mb-8" @click="clearStorage">
        <NoteszLogo
          class="h-12"
          text-class="text-white"
          icon-class="text-accent-300"
          icon-shade-class="text-main-400/40"
        />
      </div>
      <p class="max-w-sm mx-auto font-semibold text-white mb-4">
        A cross-platform, open-source note taking app that stores your notes on GitHub.
      </p>
      <p class="max-w-sm mx-auto mb-8">
        It works offline, and all your data is saved only in your browser and in your GitHub
        repositories, nowhere else.
      </p>
      <BasicButton
        class="mx-auto w-full max-w-[17rem] touch:max-w-[18rem]"
        :disabled="isAuthorizing"
        @click="connect({ redirect: '/' })"
      >
        <template v-if="isAuthorizing">
          <SpinnerIcon class="mx-auto w-6 h-6 text-main-300" />
        </template>
        <template v-else>
          <GitHubIcon class="flex-none h-6 w-6 text-main-400 mr-2" />
          <div class="flex-1 text-center">
            Connect GitHub repository
          </div>
        </template>
      </BasicButton>
      <div
        v-if="authError"
        class="mt-4 font-medium text-red-400 text-center"
      >
        {{ authError.message }}
      </div>
    </div>
  </div>
</template>
