<template>
  <nav class="flex justify-center space-x-1" aria-label="Main navigation">
    <div
      class="flex-1 h-[2px] rounded bg-gradient-to-l from-main-400/40 to-transparent
        self-center"
    />
    <slot />
    <div
      class="flex-1 h-[2px] rounded bg-gradient-to-r from-main-400/40 to-transparent
        self-center"
    />
  </nav>
</template>
