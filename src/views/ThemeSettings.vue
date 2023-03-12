<script setup lang="ts">
import { ref, watch } from 'vue';
import CheckIcon from '@/assets/icons/check.svg?component';
import CaretLeftIcon from '@/assets/icons/caret-left.svg?component';
import CaretRightIcon from '@/assets/icons/caret-right.svg?component';
import BaseButton from '@/components/BaseButton.vue';
import BasicButton from '@/components/BasicButton.vue';
import NoteszTransition from '@/components/NoteszTransition.vue';
import { mainPalette, backgroundPalette, type ColorName }
  from '@/services/model/settingsModel/themeData';
import { useEventListener, useThrottleFn, useScroll } from '@vueuse/core';
import { useThemeService } from '@/services/themeService';
import useVirtualKeyboard from '@/composables/useVirtualKeyboard';

const virtualKeyboard = useVirtualKeyboard();
const themeService = useThemeService();
const scrollContainer = ref<HTMLElement | null>(null);
const { x } = useScroll(scrollContainer, {
  throttle: 200
});

const offset = 25;
const arrivedLeft = ref<boolean>(true);
const arrivedRight = ref<boolean>(true);

updateScrollIndicators();

watch(() => [x.value, scrollContainer.value], () => updateScrollIndicators());
useEventListener(
  'resize',
  useThrottleFn(updateScrollIndicators, 200, true, false),
  { passive: true }
);
useEventListener(
  'orientationchange',
  useThrottleFn(updateScrollIndicators, 200, true, false),
  { passive: true }
);

// The arrivedState from useScroll is not initialized properly, so we need to use our own
// (When no scroll event is emitted, useScroll does not set the rigth and bottom arrivedState)
function updateScrollIndicators() {
  if (!scrollContainer.value) return;
  const scrollLeft = scrollContainer.value.scrollLeft;
  const scrollWidth = scrollContainer.value.scrollWidth;
  const clientWidth = scrollContainer.value.clientWidth;
  arrivedLeft.value = scrollLeft <= 0 + offset;
  arrivedRight.value = scrollLeft + clientWidth >= scrollWidth - offset;
}

const paletteOrder: (ColorName)[] = [
  'red',     'orange', 'amber',   'lime',  'slate',
  'rose',    'teal',   'emerald', 'green', 'stone',
  'pink',    'cyan',   'sky',     'blue',
  'fuchsia', 'purple', 'violet',  'indigo',
];

</script>

<template>
  <aside
    v-if="themeService.loaded && themeService.selectedThemeCopy"
    class="relative bg-black border-t-2 border-main-400/60"
    :class="{
      'pb-[calc(env(safe-area-inset-bottom,0.5rem)-0.5rem)]': !virtualKeyboard.visible.value
    }"
    aria-label="Theme settings"
  >
    <!-- Scroll indicators -->
    <NoteszTransition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!arrivedRight"
        class="absolute top-0 right-0 bottom-0 z-10 w-12 pointer-events-none mb-safe-b
          flex items-center justify-end
          bg-gradient-to-r from-transparent to-black/90 via-black/70"
        aria-hidden="true"
      >
        <CaretRightIcon class="w-8 h-8 mr-1 absolute animate-pulse text-white" />
      </div>
    </NoteszTransition>
    <NoteszTransition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="!arrivedLeft"
        class="absolute top-0 left-0 bottom-0 z-10 w-12 pointer-events-none mb-safe-b
          flex items-center justify-start
          bg-gradient-to-l from-transparent to-black/90 via-black/70"
        aria-hidden="true"
      >
        <CaretLeftIcon class="w-8 h-8 mr-1 absolute animate-pulse text-white" />
      </div>
    </NoteszTransition>

    <!-- Scroll container -->
    <div
      class="px-4 mouse:max-w-5xl touch:max-w-7xl mx-auto flex justify-between overflow-x-scroll
        snap-x snap-mandatory"
      ref="scrollContainer"
    >
      <!-- Theme selector -->
      <div class="flex-none snap-center p-4 mx-2 lg:mx-0">
        <div class="mb-2 text-white font-medium">
          Theme:
        </div>
        <section
          class="flex-1 grid grid-cols-5 gap-2"
          aria-label="Themes"
          role="radiogroup"
        >
          <BaseButton
            v-for="(theme, index) in themeService.themes"
            :key="index"
            class="rounded-lg w-12 h-12 mouse:w-8 mouse:h-8 text-white/80 font-bold
              transform transition-transform duration-200 ease-in-out
              motion-reduce:transition-none motion-reduce:transform-none
              relative before:absolute before:inset-0
              before:transition-all before:duration-200 before:ease-in-out
              motion-reduce:before:transition-none motion-reduce:before:transform-none
              grid grid-cols-2 ring-offset-2 ring-offset-black"
            active-class="scale-50 motion-reduce:opacity-50
              before:scale-200 motion-reduce:before:opacity-50"
            :style="{
              background: themeService.selectedTheme === index
                ? `rgb(${backgroundPalette[themeService.selectedThemeCopy.backgroundColor]})`
                : `rgb(${backgroundPalette[theme.backgroundColor]})`
            }"
            :class="{
              'ring-2 ring-white':
                themeService.selectedTheme === index
            }"
            role="radio"
            :aria-label="`Theme ${index + 1}`"
            :aria-checked="themeService.selectedTheme === index"
            @click="themeService.selectTheme(index)"
          >
            <span
              class="block w-6 h-6 mouse:w-4 mouse:h-4 rounded-tl-lg"
              :style="{
                background: themeService.selectedTheme === index
                  ? `rgb(${mainPalette[themeService.selectedThemeCopy.mainColor]['500']})`
                  : `rgb(${mainPalette[theme.mainColor]['500']})`
              }"
            />
            <span
              class="block w-6 h-6 mouse:w-4 mouse:h-4 rounded-tr-lg"
              :style="{
                background: themeService.selectedTheme === index
                  ? `rgb(${mainPalette[themeService.selectedThemeCopy.mainColor]['500']} / 0.4)`
                  : `rgb(${mainPalette[theme.mainColor]['500']} / 0.4)`
              }"
            />
            <span
              class="flex items-center justify-center w-12 h-6 mouse:w-8 mouse:h-4
                col-span-2 rounded-b-lg"
              :style="{
                background: `rgb(255 255 255 / 0.1)`
              }"
            >
              <span
                class="block rounded-full w-6 h-1.5 mouse:w-4 mouse:h-1"
                :style="{
                  background: themeService.selectedTheme === index
                    ? `rgb(${mainPalette[themeService.selectedThemeCopy.accentColor]['400']})`
                    : `rgb(${mainPalette[theme.accentColor]['400']})`
                }"
              />
            </span>
          </BaseButton>
        </section>
      </div>

      <!-- Main color selector -->
      <div class="flex-none snap-center p-4 mx-2 lg:mx-0">
        <div class="mb-2 text-white font-medium">
          Main color:
        </div>
        <div
          class="flex-1 grid grid-cols-5 gap-2 mouse:gap-[0.375rem]"
          aria-label="Main colors"
          role="radiogroup"
        >
          <BaseButton
            v-for="(colorName, index) in paletteOrder"
            :key="index"
            class="rounded-lg w-8 h-8 mouse:w-6 mouse:h-6 mouse:rounded-md text-white/80 font-bold
              transform transition-transform duration-200 ease-in-out
              motion-reduce:transition-none motion-reduce:transform-none
              relative before:absolute before:inset-0
              before:transition-all before:duration-200 before:ease-in-out
              motion-reduce:before:transition-none motion-reduce:before:transform-none
              ring-offset-2 ring-offset-black"
            active-class="scale-50 motion-reduce:opacity-50
              before:scale-200 motion-reduce:before:opacity-50"
            :style="{
              background: `rgb(${mainPalette[colorName]['500']})`
            }"
            :class="{
              'ring-2 ring-white':
                colorName === themeService.selectedThemeCopy.mainColor,
              'col-span-2': index === 13
            }"
            role="radio"
            :aria-label="colorName"
            :aria-checked="colorName === themeService.selectedThemeCopy.mainColor"
            @click="themeService.setMainColor(colorName)"
          >
            ·
          </BaseButton>
        </div>
      </div>

      <!-- Background color selector -->
      <div class="flex-none snap-center p-4 mx-2 lg:mx-0">
        <div class="mb-2 text-white font-medium">
          Background color:
        </div>
        <div
          class="flex-1 grid grid-cols-5 gap-2 mouse:gap-[0.375rem]"
          aria-label="Background colors"
          role="radiogroup"
        >
          <template
            v-for="(color, index) in backgroundPalette"
            :key="index"
          >
            <BaseButton
              v-if="color"
              class="rounded-lg w-8 h-8 mouse:w-6 mouse:h-6 mouse:rounded-md text-white/80
                font-bold
                transform transition-transform duration-200 ease-in-out
                motion-reduce:transition-none motion-reduce:transform-none
                relative before:absolute before:inset-0
                before:transition-all before:duration-200 before:ease-in-out
                motion-reduce:before:transition-none motion-reduce:before:transform-none
                after:absolute after:inset-0 after:rounded-lg
                ring-offset-2 ring-offset-black"
              active-class="scale-50 motion-reduce:opacity-50
                before:scale-200 motion-reduce:before:opacity-50"
              :class="{
                'after:bg-white/10': index !== 12,
                'after:bg-white/5': index === 12,
                'ring-2 ring-white':
                  index === themeService.selectedThemeCopy.backgroundColor,
                'col-span-2 justify-self-end': index === 15
              }"
              :style="{
                background: `rgb(${color})`
              }"
              role="radio"
              :aria-label="`Background color ${index + 1}`"
              :aria-checked="index === themeService.selectedThemeCopy.backgroundColor"
              @click="themeService.setBackgroundColor(index)"
            >·
            </BaseButton>
            <div v-else />
          </template>
        </div>
      </div>

      <!-- Accent color selector -->
      <div class="flex-none snap-center p-4 mx-2 lg:mx-0">
        <div class="mb-2 text-white font-medium">
          Accent color:
        </div>
        <div
          class="flex-1 grid grid-cols-5 gap-2 mouse:gap-[0.375rem]"
          aria-label="Accent colors"
          role="radiogroup"
        >
          <BaseButton
            v-for="(colorName, index) in paletteOrder"
            :key="index"
            class="rounded-lg w-8 h-8 mouse:w-6 mouse:h-6 mouse:rounded-md text-white/80 font-bold
              transform transition-transform duration-200 ease-in-out
              motion-reduce:transition-none motion-reduce:transform-none
              relative before:absolute before:inset-0
              before:transition-all before:duration-200 before:ease-in-out
              motion-reduce:before:transition-none motion-reduce:before:transform-none
              ring-offset-2 ring-offset-black"
            active-class="scale-50 motion-reduce:opacity-50
              before:scale-200 motion-reduce:before:opacity-50"
            :style="{
              background: `rgb(${mainPalette[colorName]['500']})`
            }"
            :class="{
              'ring-2 ring-white':
                colorName === themeService.selectedThemeCopy.accentColor,
              'col-span-2': index === 13
            }"
            role="radio"
            :aria-label="colorName"
            :aria-checked="colorName === themeService.selectedThemeCopy.accentColor"
            @click="themeService.setAccentColor(colorName)"
          >
            ·
          </BaseButton>
        </div>
      </div>

      <!-- Buttons -->
      <div class="flex-none snap-center p-4 mx-2 lg:mx-0 flex flex-col items-center justify-center">
        <template v-if="themeService.selectedThemeChanged">
          <BasicButton
            class="w-28 mb-2"
            @click="themeService.saveSelectedTheme"
          >
            Save
          </BasicButton>
          <BasicButton
            class="w-28"
            @click="themeService.resetSelectedTheme"
          >
            Discard
          </BasicButton>
        </template>
        <BasicButton
          v-else
          class="w-28"
          @click="themeService.closeThemeSettings()"
        >
          <CheckIcon class="flex-none w-6 h-6 text-accent-300 mr-2" aria-hidden="true" />
          Done
        </BasicButton>
      </div>
    </div>
  </aside>
</template>
