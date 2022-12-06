<script setup lang="ts">
import { getPendingCallbacks } from '@/integration/github/waitForCallback';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps<{
  type: string
}>();

handleCallback();

async function handleCallback() {
  const pendingCallbacks = getPendingCallbacks();
  if (pendingCallbacks[props.type]) {
    const params = Object.fromEntries(new URLSearchParams(location.search));
    localStorage.tabMessage = JSON.stringify({
      id: Date.now(),
      type: 'callback',
      callback: props.type,
      params
    });
    window.close();
  } else {
    router.push('/');
  }
}

</script>

<template>
  <div />
</template>
