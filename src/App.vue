<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';

import NoteszTransition from '@/components/NoteszTransition.vue';
import DialogHost from '@/views/DialogHost.vue';

import { vSmoothResize } from '@/composables/useSmoothResize';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';
import { provideThemeService } from '@/services/themeService';
import { provideDialogService } from '@/services/dialogService';
import { provideNoteszDb } from './services/model/noteszDb';
import { provideSettings } from './services/settingsService';
import { provideNoteszMessageBus } from './services/noteszMessageBus';
import { provideBlobModel } from './services/model/blobModel';
import { provideFileIndexModel } from './services/model/fileIndexModel';
import { provideRepositoryModel } from './services/model/repositoryModel';
import { provideSettingsModel } from './services/model/settingsModel';
import { provideUserModel } from './services/model/userModel';
import { provideGitHubIntegration } from './services/integration/githubIntegration';
import { provideServiceWorkerUpdates } from './services/serviceWorkerUpdates';

const ThemeSettings = defineAsyncComponent(() => import('@/views/ThemeSettings.vue'));
const MobileDevConsole = defineAsyncComponent(() => import('@/views/MobileDevConsole.vue'));

provideNoteszMessageBus();
provideNoteszDb();
provideDialogService();
provideBlobModel();
provideFileIndexModel();
provideRepositoryModel();
provideSettingsModel();
provideUserModel();
provideSettings();
provideGitHubIntegration();
provideServiceWorkerUpdates();
const themeService = provideThemeService();

const isTouchDevice = useIsTouchDevice();

</script>

<template>
  <div
    v-if="themeService.loaded"
    class="w-full h-full flex flex-col bg-main-400/20"
  >
    <MobileDevConsole
      v-if="false"
      ref="consoleDiv"
      class="h-32"
    />
    <div
      class="flex-1 overflow-hidden bg-background"
      key="main-area"
      v-smooth-resize="{ watchParent: true, animationDuration: 300 }"
    >
      <RouterView class="" v-slot="{ Component }">
        <Transition
          v-if="!isTouchDevice"
          enter-active-class="duration-200 transition-all ease-out
            motion-reduce:transition-none"
          leave-active-class="duration-100 transition-all ease-in
            motion-reduce:transition-none"
          enter-from-class="opacity-0 transform scale-[0.95]"
          leave-to-class="opacity-0 transform scale-[0.95]"
          mode="out-in"
        >
          <component :is="Component" />
        </Transition>
        <component v-else :is="Component" />
      </RouterView>
    </div>
    <NoteszTransition
      enter-from-class=""
      leave-to-class="translate-y-full"
    >
      <ThemeSettings
        v-if="themeService.themeSettingsOpen"
        class="flex-none"
        key="theme-settings"
      />
    </NoteszTransition>
    <DialogHost />
  </div>
</template>
