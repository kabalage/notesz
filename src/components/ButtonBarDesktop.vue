<template>
  <div class="flex justify-center space-x-0.5" >
    <div
      class="flex-1 h-[2px] rounded bg-gradient-to-l from-indigo-500/50 to-transparent
        self-center"
    />
    <slot />
    <div
      class="flex-1 h-[2px] rounded bg-gradient-to-r from-indigo-500/50 to-transparent
        self-center"
    />
  </div>
</template>
