<script setup lang="ts">
import ExclamationTriangleIcon from '@/assets/icons/exclamation-triangle.svg?component';

const props = defineProps<{
  message: string;
  type: 'error' | 'warning';
}>();
</script>

<template>
  <div
    class="px-4 py-3 font-medium rounded-lg border-2 flex items-start"
    :class="{
      'bg-red-500/20 text-red-300 border-red-500':
        props.type === 'error',
      'bg-orange-400/20 text-orange-300 border-orange-400':
        props.type === 'warning'
    }"
  >
    <ExclamationTriangleIcon class="w-6 h-6 mr-3 flex-none" />
    <div>
      {{ props.message }}
    </div>
  </div>
</template>
