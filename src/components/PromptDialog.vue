<script setup lang="ts">
import { ref } from 'vue';
import {
  DialogTitle,
  DialogDescription,
} from '@headlessui/vue';
import BasicButton from './BasicButton.vue';
import BasicDialog from './BasicDialog.vue';
import MessageBox from '@/components/MessageBox.vue';
import { vSmoothResize } from '@/composables/useSmoothResize';

const props = withDefaults(defineProps<{
  title: string,
  description?: string,
  confirmButtonLabel?: string,
  cancelButtonLabel?: string,
  initialValue?: string,
  placeholder?: string,
  validate?: (value: string) => string | null | undefined | Promise<string | null | undefined>,
}>(), {
  confirmButtonLabel: 'OK',
  cancelButtonLabel: 'Cancel',
  validate: () => null
});

const emit = defineEmits<{
  (e: 'close', value: string | null): void,
}>();

const dialogRef = ref<InstanceType<typeof BasicDialog> | null>(null);
const inputRef = ref<HTMLElement | null>(null);
const inputValue = ref(props.initialValue ?? '');
const validationError = ref<string | null | undefined>(null);

async function close(value: string | null) {
  const validationResult = props.validate(inputValue.value);
  if (validationResult instanceof Promise) {
    validationError.value = await validationResult;
  } else {
    validationError.value = validationResult;
  }
  if (value !== null && validationError.value) {
    if (document.activeElement !== inputRef.value) {
      inputRef.value!.focus();
    }
    return;
  }
  await dialogRef.value?.close();
  emit('close', value);
}

function onInput(event: Event) {
  inputValue.value = (event.target as HTMLInputElement).value;
  validationError.value = null;
}

</script>

<template>
  <BasicDialog
    ref="dialogRef"
    :initialFocus="inputRef"
    @cancel="close(null)"
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
    <form @submit.prevent>

      <input
        ref="inputRef"
        type="text"
        class="mt-4 w-full py-3 px-6 bg-background/50 rounded-lg"
        autocapitalize="off"
        enterkeyhint="done"
        spellcheck="false"
        :value="inputValue"
        :placeholder="props.placeholder"
        @input="onInput"
      >
      <div v-smooth-resize class="relative overflow-hidden">
        <Transition
          enter-active-class="duration-200 delay-200 transition-all ease-in-out
            motion-reduce:transition-none"
          leave-active-class="duration-300 transition-all ease-in-out
            motion-reduce:transition-none !absolute bottom-0"
          enter-from-class="opacity-0 transform scale-[0.95]"
          leave-to-class="opacity-0 transform scale-[0.95]"
        >
          <MessageBox
            v-if="validationError"
            class="mt-4 !text-left w-full"
            :message="validationError"
            type="warning"
          />
        </Transition>
      </div>
      <footer class="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <BasicButton
          class="mt-2 sm:mt-0 min-w-[6rem]"
          type="button"
          ghost
          @click="close(null)"
        >
          {{ props.cancelButtonLabel }}
        </BasicButton>
        <BasicButton
          class="min-w-[6rem]"
          @click="close(inputValue)"
        >
          {{ props.confirmButtonLabel }}
        </BasicButton>
      </footer>
    </form>
  </BasicDialog>
</template>
