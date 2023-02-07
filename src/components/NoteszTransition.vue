<script setup lang="ts">

function onBeforeLeave(el: Element) {
  if (!(el instanceof HTMLElement)) {
    return;
  }
  Object.assign(el.style, {
    width: el.offsetWidth + 'px',
    height: el.offsetHeight + 'px',
    left: el.offsetLeft + 'px',
    top: el.offsetTop + 'px',
    margin: '0'
  });
}

</script>

<template>
  <Transition
    enter-active-class="duration-300 transition-all ease-in-out motion-reduce:transition-none"
    leave-active-class="duration-300 transition-all ease-in-out motion-reduce:transition-none
      !absolute"
    enter-from-class="opacity-0 transform scale-[0.95]"
    leave-to-class="opacity-0 transform scale-[0.95]"
    @before-leave="onBeforeLeave"
  >
    <slot />
  </Transition>
</template>
