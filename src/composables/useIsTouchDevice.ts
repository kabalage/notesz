import { createSharedComposable, useMediaQuery } from '@vueuse/core';

export const useIsTouchDevice = createSharedComposable(() => useMediaQuery('(pointer: coarse)'));
