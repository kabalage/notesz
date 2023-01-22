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

const errorMessage = ref('');

startSync();

async function startSync() {
  try {
    await sync(props.repo);
    navigateBack();
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Error';
    console.error(err);
  }
}

async function retry() {
  errorMessage.value = '';
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
            Synchronizing...
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
          v-if="!errorMessage"
          class="mt-2 w-2/3 h-6 text-right text-sm truncate font-medium"
        >
          {{ syncProgressMessage }}
        </div>
        <div
          v-else
          class="mt-4 w-2/3"
        >
          <p class="text-red-400 text-sm text-center font-medium">
            {{ errorMessage }}
          </p>
          <div class="mt-4 flex items-center justify-center">
            <BasicButton class="flex-1" @click="retry">
              Retry
            </BasicButton>
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
