<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { deleteDB } from 'idb';
import GitHubIcon from '@/assets/icons/github.svg?component';
import BasicButton from '@/components/BasicButton.vue';
import NoteszLogo from '@/components/NoteszLogo.vue';
import MessageBox from '@/components/MessageBox.vue';
import { trial } from '@/utils/trial';
import { useNoteszMessageBus } from '@/services/noteszMessageBus';
import { useGitHubIntegration } from '@/services/integration/githubIntegration';
import { useSettings } from '@/services/settingsService';
import { useUserModel } from '@/services/model/userModel';
import { useFromDb } from '@/composables/useFromDb';

const router = useRouter();
const settings = useSettings();
const githubIntegration = useGitHubIntegration();
const userModel = useUserModel();
const messages = useNoteszMessageBus();

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
  const connectRoute = '/connect?redirect=/';
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

watch(() => settings.data?.selectedRepositoryId, async (selectedRepositoryId) => {
  if (selectedRepositoryId) {
    navigateToEditor(selectedRepositoryId);
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
      <h1 class="font-medium mb-4 text-center">Welcome to</h1>
      <div class="flex justify-center mb-8" @click="clearStorage">
        <NoteszLogo
          class="h-12"
          text-class="text-white"
          icon-class="text-accent-300"
          icon-shade-class="text-main-400/40"
        />
      </div>
      <p class="max-w-sm mx-auto font-medium text-white mb-4">
        A cross-platform, open-source note taking app that stores your notes on GitHub.
      </p>
      <p class="max-w-sm mx-auto mb-8">
        It works offline, and all your data is saved only in your browser and in your GitHub
        repositories, nowhere else.
      </p>
      <BasicButton
        class="mx-auto"
        :loading="isAuthorizing"
        @click="authorizeThenRedirect()"
      >
        <GitHubIcon class="flex-none h-6 w-6 text-main-400 mr-2" />
        <div class="text-center">
          Connect GitHub repository
        </div>
      </BasicButton>
      <MessageBox
        v-if="authError"
        class="mt-4 justify-center"
        :message="authError.message"
        type="error"
      />
    </div>
  </div>
</template>
