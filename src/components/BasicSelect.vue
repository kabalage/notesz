<script setup lang="ts">
import { computed } from 'vue';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption
} from '@headlessui/vue';
import CheckIcon from '@/assets/icons/check.svg?component';
import CaretUpDownIcon from '@/assets/icons/caret-up-down.svg?component';
import BetterPointerActive from './BetterPointerActive.vue';
import { useService } from '@/utils/injector';
import { Settings } from '@/services/Settings';

const settings = useService(Settings);

const props = defineProps<{
  darken?: boolean,
  modelValue?: string | number | null | undefined,
  options?: {
    label: string,
    value: string | number
  }[],
  id?: string,
  labelId?: string
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>();

const selectedOption = computed(() => {
  return props.options?.find(option => option.value === props.modelValue);
});

</script>

<template>
  <Listbox
    as="div"
    class="relative font-medium"
    :model-value="props.modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
  >
    <ListboxButton
      :id="id"
      class="flex w-full rounded-lg text-white pl-4 pr-2 py-2 leading-normal disabled:opacity-50
        cursor-pointer"
      :class="props.darken
        ? `bg-background/40 enabled:mouse:hover:bg-background/50
          enabled:mouse:hover:focus:bg-background/40 placeholder:text-main-200/60`
        : `bg-main-400/20 enabled:mouse:hover:bg-main-400/40
          enabled:mouse:hover:focus:bg-main-400/20 placeholder:text-main-200/60`"
      :aria-labelledby="`${props.labelId} value-${props.id}`"
    >
      <span
        :id="`value-${props.id}`"
        class="flex-1 text-left truncate"
      >
        {{ selectedOption?.label }}
      </span>
      <CaretUpDownIcon class="w-6 h-6 text-main-400/80" aria-hidden="true" />
    </ListboxButton>
    <transition
      enter-active-class="transition duration-150 ease-out origin-top"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-out"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <ListboxOptions
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto overscroll-contain rounded-lg p-1
          text-base  ring-1 ring-main-400/30
          focus-visible:ring-2 space-y-px"
        :class="settings.data?.backdropFilter
          ? 'bg-background/80 backdrop-blur-md'
          : 'bg-background'"
        :aria-labelledby="`${props.labelId}`"
      >
        <ListboxOption
          v-for="option in props.options"
          :key="option.value"
          :value="option.value"
          as="template"
          v-slot="{ active, selected }"
        >
          <BetterPointerActive
            tag="li"
            v-slot="{ active: betterPointerActive }"
          >
            <!--
              Spacer for scroll positioning. When scrolling the selected option into view, it
              should have at least h-1 distance from the top.
            -->
            <div class="h-1 w-1 pointer-events-none -mt-1"></div>
            <div
              class="text-white relative cursor-pointer py-2 pl-2 pr-4 flex rounded-md"
              :class="{
                'bg-main-400/30 ': active || betterPointerActive
              }"
            >
              <CheckIcon
                v-if="selected"
                class="w-6 h-6 text-accent-400"
                aria-hidden="true"
              />
              <span class="flex-1 truncate" :class="selected ? 'ml-2' : 'ml-8'">
                {{ option.label }}
              </span>
            </div>
            <!--
              Spacer for scroll positioning. When scrolling the selected option into view, it
              should have at least h-1 distance from the bottom.
            -->
            <div class="h-1 w-1 pointer-events-none -mb-1"></div>
          </BetterPointerActive>
        </ListboxOption>
      </ListboxOptions>
    </transition>
  </Listbox>
</template>
