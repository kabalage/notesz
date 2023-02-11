<script setup lang="ts">
import { ref } from 'vue';

import TrashIcon from '@/assets/icons/trash.svg?component';
import IconButton from '@/components/IconButton.vue';

const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
};
const logs = ref<any[][]>([]);
const consoleDiv = ref<HTMLDivElement | null>(null);

Object.assign(window.console, {
  log(...args: any[]) {
    const shouldScroll = shouldScrollToBottom();
    logs.value.push(args);
    originalConsole.log(...args);
    if (shouldScroll) {
      scrollToBottom();
    }
  },
  warn(...args: any[]) {
    const shouldScroll = shouldScrollToBottom();
    logs.value.push(args);
    originalConsole.warn(...args);
    if (shouldScroll) {
      scrollToBottom();
    }
  },
  error(...args: any[]) {
    const shouldScroll = shouldScrollToBottom();
    logs.value.push(args);
    originalConsole.error(...args);
    if (shouldScroll) {
      scrollToBottom();
    }
  }
});

function shouldScrollToBottom() {
  if (consoleDiv.value) {
    const { scrollTop, scrollHeight, clientHeight } = consoleDiv.value;
    return scrollHeight - scrollTop - clientHeight < 10;
  }
  return false;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    if (consoleDiv.value) {
      consoleDiv.value.scrollTop = consoleDiv.value.scrollHeight;
    }
  });
}

</script>

<template>
  <div
    ref="consoleDiv"
    class="bg-white text-[0.5rem] leading-[0.6rem] text-black py-1 font-mono overflow-auto
      overscroll-contain divide-y divide-gray-200"
  >
    <div class="sticky top-0 pointer-events-none flex justify-end">
      <IconButton
        class="mr-2 p-2 pointer-events-auto"
        @click="logs = []"
      >
        <TrashIcon class="w-4 h-4" />
      </IconButton>

    </div>
    <div
      v-for="(entry, index) in logs"
      :key="index"
      class="px-4 py-0.5"
    >
      <span
        v-for="(param, paramIndex) in entry"
        :key="paramIndex"
        class="inline-block mr-2"
      >
        {{ param }}
      </span>
    </div>
  </div>
</template>
