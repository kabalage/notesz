<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { deleteDB } from 'idb';
import GitHubIcon from '@/assets/icons/github.svg?component';
import BasicButton from '@/components/BasicButton.vue';
import NoteszLogo from '@/components/NoteszLogo.vue';
import MessageBox from '@/components/MessageBox.vue';
import { trial } from '@/utils/trial';
import { useService } from '@/utils/injector';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';
import { GitHubIntegration } from '@/services/integration/GitHubIntegration';
import { Settings } from '@/services/Settings';
import { UserModel } from '@/services/model/UserModel';
import { useAsyncState } from '@/composables/useAsyncState';

const settings = useService(Settings);
const githubIntegration = useService(GitHubIntegration);
const userModel = useService(UserModel);
const noteszMessageBus = useService(NoteszMessageBus);

const router = useRouter();

const user = useAsyncState({
  get: userModel.get
});
noteszMessageBus.on('change:user', () => {
  user.refetch();
});

const authError = ref<Error | undefined>(undefined);
const isAuthorizing = ref(false);
const appVersion = import.meta.env.APP_VERSION;

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
  <div class="h-full overflow-y-auto flex flex-col">

    <div class="flex-1 grid">
      <div
        v-if="settings.data && !settings.data.selectedRepositoryId"
        class="place-self-center px-8 py-8 max-w-xl mx-auto text-center mb-safe-b"
      >
        <h1 class="font-medium mb-4 text-center">
          Welcome to
          <span class="sr-only">Notesz</span>
        </h1>
        <div
          class="flex justify-center mb-8"
          aria-hidden="true"
          @click="clearStorage"
        >
          <NoteszLogo
            class="h-12"
            text-class="text-white"
            icon-class="text-accent-300"
            icon-shade-class="text-main-400/40"
          />
        </div>
        <p class="max-w-sm mx-auto font-medium text-white mb-4">
          An open-source note taking app that stores your notes on GitHub.
        </p>
        <p class="max-w-sm mx-auto mb-8">
          Add it to your Home Screen on your phone to use it like a native app.
          It works offline, and all your data is synced directly from the browser to GitHub,
          no third party involved.
        </p>
        <BasicButton
          class="mx-auto"
          :loading="isAuthorizing"
          @click="authorizeThenRedirect()"
        >
          <GitHubIcon class="flex-none h-6 w-6 text-main-400 mr-2" aria-hidden="true" />
          <div class="text-center">
            Connect GitHub repository
          </div>
        </BasicButton>
        <MessageBox
          v-if="authError"
          class="mt-4 justify-center"
          :message="authError.message"
          type="error"
          role="alert"
        />
      </div>
    </div>
    <div class="pb-safe-b">
      <p class="mb-8 max-w-sm mx-auto text-center text-sm">
        Built by
        <a
          class="text-white cursor-pointer underline underline-offset-2
            decoration-white/40 mouse:hover:decoration-white"
          href="https://github.com/kabalage"
          target="_blank"
          v-text="'Balázs Kaufmann'"
        />.
        <br>The source is available on
        <a
          class="text-white cursor-pointer underline underline-offset-2
            decoration-white/40 mouse:hover:decoration-white"
          href="https://github.com/kabalage/notesz"
          target="_blank"
          v-text="'GitHub'"
        />.
        <br>Version: {{ appVersion }}
      </p>
    </div>
  </div>
</template>
