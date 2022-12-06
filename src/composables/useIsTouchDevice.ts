import { createSharedComposable, useMediaQuery } from '@vueuse/core';

export default createSharedComposable(() => useMediaQuery('(pointer: coarse)'));
