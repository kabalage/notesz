<template>
  <div class="relative w-full max-w-5xl mx-auto">
    <div class="flex justify-center space-x-1 mb-8 mt-4">
      <div
        class="flex-1 h-[2px] rounded bg-gradient-to-l from-main-400/40 to-transparent
          self-center"
      />
      <slot />
      <div
        class="flex-1 h-[2px] rounded bg-gradient-to-r from-main-400/40 to-transparent
          self-center"
      />
    </div>
    <div
      class="absolute z-10 h-16 inset-x-0 top-0 -mt-16 pointer-events-none
        bg-gradient-to-t from-background to-transparent"
    />
  </div>
</template>
