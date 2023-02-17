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
  buttonLabel?: string
}>(), {
  buttonLabel: 'OK'
});

const emit = defineEmits<{
  (e: 'close'): void,
}>();

const dialogRef = ref<InstanceType<typeof BasicDialog> | null>(null);
const buttonRef = ref<HTMLElement | null>(null);

async function close() {
  await dialogRef.value?.close();
  emit('close');
}

</script>

<template>
  <BasicDialog
    ref="dialogRef"
    :initialFocus="buttonRef"
    @cancel="close()"
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
        class="min-w-[6rem]"
        @click="close()"
      >
        {{ props.buttonLabel }}
      </BasicButton>
    </footer>
  </BasicDialog>
</template>
