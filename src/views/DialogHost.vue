<script setup lang="ts">
import { useService } from '@/utils/injector';
import { DialogService } from '@/services/DialogService';

const dialogService = useService(DialogService);

</script>

<template>
  <template v-if="dialogService.currentDialog">
    <component
      :is="dialogService.currentDialog.component"
      v-bind="dialogService.currentDialog.props"
    />
  </template>
</template>
