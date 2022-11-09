<script setup lang="ts">
import { ref } from 'vue';
import { useBetterPointerActiveState } from '@/composables/useBetterPointerActiveState';

const props = withDefaults(defineProps<{
  toggled?: boolean
}>(), {
  toggled: false
});

const buttonEl = ref<HTMLButtonElement | undefined>(undefined);
const active = useBetterPointerActiveState(buttonEl, {
  minActiveTime: 100
});

const style = ref({
  bottom: '0px',
  left: '0px',
  width: '0px'
});

function onPointerDown() {
  const documentBounds = document.body.getBoundingClientRect();
  const bounds =  buttonEl.value!.getBoundingClientRect();
  style.value.bottom = `${documentBounds.height - bounds.top - bounds.height}px`;
  style.value.left = `${bounds.left}px`;
  style.value.width = `${bounds.width}px`;
}

</script>

<template>
  <button
    ref="buttonEl"
    class="w-10 h-12"
    @pointerdown="onPointerDown"
  >
    <div
      class="px-2 py-2 my-1"
      :class="{
        'bg-indigo-400/20 rounded-lg': props.toggled
      }"
    >
      <slot :active="active" />
    </div>
    <Teleport
      to="body"
      :disabled="!active"
    >
      <div
        v-if="active"
        class="bg-violet-950 text-indigo-100 rounded-lg h-24 absolute z-50  mb-1
          pointer-events-none will-change-transform shadow-lg"
        :style="style"
      >
        <div class="bg-indigo-400/30 rounded-lg overflow-hidden h-full w-full px-2 pt-3">
          <slot :active="active" />
        </div>
      </div>
    </Teleport>
  </button>
</template>
