<script setup lang="ts">
import { useDialogService } from '@/services/dialogService';

const dialogService = useDialogService();

</script>

<template>
  <template v-if="dialogService.currentDialog">
    <component
      :is="dialogService.currentDialog.component"
      v-bind="dialogService.currentDialog.props"
    />
  </template>
</template>
