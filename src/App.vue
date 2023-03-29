<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { RouterView } from 'vue-router';

import NoteszTransition from '@/components/NoteszTransition.vue';
import DialogHost from '@/views/DialogHost.vue';

import { vSmoothResize } from '@/composables/useSmoothResize';
import { useIsTouchDevice } from '@/composables/useIsTouchDevice';

import { provideServices } from '@/utils/injector';
import { ThemeService } from '@/services/ThemeService';
import { DialogService } from '@/services/DialogService';
import { NoteszDb } from './services/model/NoteszDb';
import { Settings } from './services/Settings';
import { NoteszMessageBus } from './services/NoteszMessageBus';
import { BlobModel } from './services/model/BlobModel';
import { FileIndexModel } from './services/model/FileIndexModel';
import { RepositoryModel } from './services/model/RepositoryModel';
import { SettingsModel } from './services/model/SettingsModel';
import { UserModel } from './services/model/UserModel';
import { GitHubIntegration } from './services/integration/GitHubIntegration';
import { ServiceWorkerUpdates } from './services/ServiceWorkerUpdates';

const {  themeService } = provideServices([
  ThemeService,
  DialogService,
  NoteszDb,
  Settings,
  NoteszMessageBus,
  BlobModel,
  FileIndexModel,
  RepositoryModel,
  SettingsModel,
  UserModel,
  GitHubIntegration,
  ServiceWorkerUpdates
]);

const ThemeSettings = defineAsyncComponent(() => import('@/views/ThemeSettings.vue'));
const MobileDevConsole = defineAsyncComponent(() => import('@/views/MobileDevConsole.vue'));

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
      class="flex-1 overflow-hidden bg-background relative"
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
