<script setup lang="ts">
import { ref } from 'vue';

import BasicButton from '@/components/BasicButton.vue';
import { useRouter } from 'vue-router';

import useSyncAction from '@/integration/github/sync/useSyncAction';

const props = defineProps<{
  repo: string,
  redirect: string
}>();

const router = useRouter();
const { syncProgress, syncProgressMessage, sync } = useSyncAction();

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
  <div class="h-full overflow-hidden flex flex-col items-center justify-center">
      <div class="p-4 w-full max-w-xl flex flex-col items-center justify-center">
        <div class="mb-2 w-2/3  text-lg font-medium flex">
          <div class="text-cyan-300">
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
        <div class="h-1 rounded-full w-2/3 bg-indigo-400/40">
          <div
            class="h-1 rounded-full transform bg-cyan-300
              transition-transform duration-300 ease-in-out"
            :style="{
              width: `${Math.round(syncProgress * 100)}%`
            }"
          ></div>
        </div>
        <div
          v-if="!error"
          class="mt-2 w-2/3 h-6 text-right text-sm truncate font-medium"
        >
          {{ syncProgressMessage }}
        </div>
        <div
          v-else
          class="mt-4 w-2/3"
        >
          <p
            class="px-4 py-2 rounded-lg"
            :class="{
              'bg-red-500/30 text-red-300': error.code !== 'rebaseConflicts',
              'bg-orange-500/30 text-orange-300': error.code === 'rebaseConflicts'
            }"
          >
            <span v-if="error.code === 'rebaseConflicts'">
              Some local changes conflict with remote changes.
              Resolve them to be able to continue the synchronization.
            </span>
            <span v-else>
              {{ error.message }}
            </span>
          </p>
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
