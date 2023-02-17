<script setup lang="ts">
import { ref } from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
} from '@headlessui/vue';
import useVirtualKeyboard from '@/utils/useVirtualKeyboard';

const props = defineProps<{
  initialFocus?: HTMLElement | null,
}>();

const emit = defineEmits<{
  (e: 'cancel'): void
}>();

defineExpose({
  close,
});

const isOpen = ref(true);
const virtualKeyboard = useVirtualKeyboard();
let resolveAnimationEnd: ((...args: any) => void) | null = null;

async function close() {
  isOpen.value = false;
  await new Promise((resolve) => resolveAnimationEnd = resolve);
}

function afterLeave() {
  if (resolveAnimationEnd) {
    resolveAnimationEnd();
  }
}

</script>

<template>
  <!--
    Backdrop
    It needs to be animated as a sibling to the dialog, because in Chrome backdrop-blur does not
    work if a parent is animating. (https://bugs.chromium.org/p/chromium/issues/detail?id=1194050)
  -->
  <Teleport to="body">
    <Transition
      appear
      enter-active-class="transition-opacity ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
    </Transition>
  </Teleport>

  <!-- Dialog -->
  <TransitionRoot
    :show="isOpen"
    appear
    as="template"
    @afterLeave="afterLeave"
  >
    <Dialog
      class="absolute z-50 inset-0 flex flex-col items-center justify-end sm:justify-center"
      :initialFocus="props.initialFocus"
      :static="true"
      @close="emit('cancel')"
    >
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0 translate-y-1/2 sm:translate-y-0 sm:scale-90"
        enter-to="opacity-100 translate-y-0 sm:scale-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100 translate-y-0 sm:scale-100"
        leave-to="opacity-0 translate-y-1/2 sm:translate-y-0 sm:scale-95"
      >
        <DialogPanel
          class="w-full max-w-screen-sm sm:max-w-lg scale-100 bg-background sm:rounded-lg"
        >
          <div
            class="p-6 bg-main-400/20 sm:rounded-lg sm:pb-6"
            :class="{
              'pb-[max(1.5rem,env(safe-area-inset-bottom))]': !virtualKeyboard.visible.value
            }"
          >
            <slot v-bind:close="close" />
          </div>
        </DialogPanel>
      </TransitionChild>
    </Dialog>
  </TransitionRoot>
</template>
