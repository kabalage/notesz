<script setup lang="ts">
import { ref } from 'vue';
import {
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue';
import BasicButton from './BasicButton.vue';
import BasicDialog from './BasicDialog.vue';

const props = withDefaults(defineProps<{
  title: string,
  description?: string,
  confirmButtonLabel?: string,
  rejectButtonLabel?: string,
  confirmDanger?: boolean
}>(), {
  confirmButtonLabel: 'Yes',
  rejectButtonLabel: 'No',
});

const emit = defineEmits<{
  (e: 'close', value: boolean): void,
}>();

const dialogRef = ref<InstanceType<typeof BasicDialog> | null>(null);
const rejectButtonRef = ref<HTMLElement | null>(null);

async function close(value: boolean) {
  await dialogRef.value?.close();
  emit('close', value);
}

</script>

<template>
  <BasicDialog
    ref="dialogRef"
    :initialFocus="rejectButtonRef"
    @cancel="close(false)"
  >
    <DialogTitle
      class="text-center sm:text-left text-lg font-semibold text-white"
    >
      <span v-html="props.title" />
    </DialogTitle>
    <DialogDescription
      v-if="props.description"
      as="p"
      class="mt-2 text-main-200 text-center sm:text-left"
    >
      <span v-html="props.description" />
    </DialogDescription>

    <footer class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
      <BasicButton
        ref="rejectButtonRef"
        class="mt-2 sm:mt-0 min-w-[6rem]"
        ghost
        @click="close(false)"
      >
        {{ props.rejectButtonLabel }}
      </BasicButton>
      <BasicButton
        class="min-w-[6rem]"
        @click="close(true)"
        :danger="props.confirmDanger"
      >
        {{ props.confirmButtonLabel }}
      </BasicButton>
    </footer>
  </BasicDialog>
</template>
