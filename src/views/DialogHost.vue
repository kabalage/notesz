<script setup lang="ts">
import { useDialogState } from '@/stores/dialogState';

const dialogState = useDialogState()!;

</script>

<template>
  <template v-if="dialogState.currentDialog">
    <component
      :is="dialogState.currentDialog.component"
      v-bind="dialogState.currentDialog.props"
    />
  </template>
</template>
