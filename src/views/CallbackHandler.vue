<script setup lang="ts">
import { getPendingCallbacks } from '@/utils/waitForCallback';
import { useRouter } from 'vue-router';
import useNoteszMessageBus from '@/composables/useNoteszMessageBus';

const router = useRouter();
const props = defineProps<{
  type: string
}>();
const noteszMessageBus = useNoteszMessageBus();

handleCallback();

async function handleCallback() {
  const pendingCallbacks = getPendingCallbacks();
  if (pendingCallbacks[props.type]) {
    const params = Object.fromEntries(new URLSearchParams(location.search));
    noteszMessageBus.emit('callback', {
      type: props.type,
      params
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    window.close();
  } else {
    router.push('/');
  }
}

</script>

<template>
  <div />
</template>
