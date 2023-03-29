<script setup lang="ts">
import { getPendingCallbacks } from '@/utils/waitForCallback';
import { useRouter } from 'vue-router';
import { useService } from '@/utils/injector';
import { NoteszMessageBus } from '@/services/NoteszMessageBus';

const props = defineProps<{
  type: string
}>();
const noteszMessageBus = useService(NoteszMessageBus);
const router = useRouter();

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
