<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import BasicButton from '@/components/BasicButton.vue';
import MessageBox from '@/components/MessageBox.vue';
import { useGitHubIntegration } from '@/services/integration/githubIntegration';

const props = defineProps<{
  repo: string,
  redirect: string
}>();

const router = useRouter();
const githubIntegration = useGitHubIntegration();
const { syncProgress, syncProgressMessage, sync } = githubIntegration.useSyncAction();

const error = ref<Error|undefined>(undefined);

startSync();

async function startSync() {
  try {
    await sync(props.repo);
    navigateBack();
  } catch (err) {
    if (err instanceof Error) {
      error.value = err;
    } else {
      console.error(err);
      error.value = new Error('Unexpected error');
    }
  }
}

async function retry() {
  error.value = undefined;
  await startSync();
}

function navigateBack() {
  router.push(props.redirect);
}

</script>

<template>
  <div class="h-full overflow-hidden flex flex-col items-stretch justify-center p-8">
      <div class="mx-auto w-full sm:max-w-sm flex flex-col items-stretch justify-center">
        <div class="mb-2 text-lg font-medium flex">
          <div class="text-accent-300">
            <template v-if="error?.code === 'rebaseConflicts'">
              Conflicts detected
            </template>
            <template v-else-if="error">
              Synchronization failed
            </template>
            <template v-else>
              Synchronizing...
            </template>
          </div>
        </div>
        <div class="h-1 rounded-full bg-main-400/40">
          <div
            class="h-1 rounded-full transform bg-accent-300
              transition-transform duration-300 ease-in-out"
            :style="{
              width: `${Math.round(syncProgress * 100)}%`
            }"
          ></div>
        </div>
        <div
          v-if="!error"
          class="mt-2 h-6 text-right text-sm leading-normal truncate font-medium"
        >
          {{ syncProgressMessage }}
        </div>
        <div
          v-else
          class="mt-4"
        >
          <MessageBox
            :type="error.code === 'rebaseConflicts' ? 'warning' : 'error'"
            :message="error.code === 'rebaseConflicts'
              ? `Some local changes are conflicting with remote changes.
                Resolve them to be able to continue with the synchronization.`
              : error.message"
          />
          <div class="mt-4 flex items-center">
            <BasicButton
              v-if="error.code !== 'rebaseConflicts'"
              class="flex-1"
              @click="retry"
            >
              Retry
            </BasicButton>
            <div class="flex-1" v-else />
            <BasicButton
              class="ml-2 flex-1"
              @click="navigateBack"
            >
              OK
            </BasicButton>
          </div>
        </div>
      </div>
  </div>
</template>
