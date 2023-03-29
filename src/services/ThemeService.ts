import { computed, ref, watch, reactive } from 'vue';
import { defineService, type InjectResult } from '@/utils/injector';
import { mainPalette, backgroundPalette, type ColorName }
  from '@/services/model/SettingsModel/themeData';
import { DialogService } from '@/services/DialogService';
import { Settings } from '@/services/Settings';
import type { Theme } from '@/services/model/SettingsModel';

const dependencies = [Settings, DialogService];

export const ThemeService = defineService({
  name: 'ThemeService',
  dependencies,
  setup
});

function setup({ settings, dialogService }: InjectResult<typeof dependencies>) {
  const themeSettingsOpen = ref(false);

  const selectedThemeIndex = ref<number>();
  const selectedThemeCopy = ref<Theme>();

  const selectedThemeChanged = computed(() => {
    if (!settings.data || !selectedThemeCopy.value
      || selectedThemeIndex.value === undefined
    ) {
      return false;
    }
    const selectedTheme = settings.data.themes[selectedThemeIndex.value];
    return (
      selectedTheme.mainColor !== selectedThemeCopy.value.mainColor ||
      selectedTheme.accentColor !== selectedThemeCopy.value.accentColor ||
      selectedTheme.backgroundColor !== selectedThemeCopy.value.backgroundColor
    );
  });

  watch(() => {
    // theme settings can change from another tab
    return {
      selectedThemeIndex: settings.data?.selectedTheme,
      theme: settings.data?.themes[settings.data?.selectedTheme]
    };
  }, ({ selectedThemeIndex }) => {
    if (selectedThemeIndex === undefined) return;
    initLocalState();
  }, { immediate: true, deep: true });

  function initLocalState() {
    if (!settings.data) return;
    const themes = settings.data.themes;
    const theme = themes[settings.data.selectedTheme];
    if (!theme) throw new Error('Invalid theme index');
    selectedThemeCopy.value = { ...theme };
    selectedThemeIndex.value = settings.data.selectedTheme;
    applyTheme(selectedThemeCopy.value);
  }

  async function selectTheme(index: number) {
    if (!settings.data) return;
    const themes = settings.data.themes;
    if (!themes[index]) throw new Error('Invalid theme index');
    if (selectedThemeChanged.value) {
      const shouldSave = await dialogService.confirm({
        title: 'Save changes?',
        description: 'You have unsaved changes to the theme. Do you want to save them?',
        confirmButtonLabel: 'Save',
        rejectButtonLabel: 'Discard'
      });
      if (shouldSave) {
        saveSelectedTheme();
      }
    }
    const theme = themes[index];
    selectedThemeCopy.value = { ...theme };
    selectedThemeIndex.value = index;
    applyTheme(selectedThemeCopy.value);
    settings.data.selectedTheme = index;
  }

  function applyTheme(theme: Theme) {
    applyMainColor(theme.mainColor);
    applyAccentColor(theme.accentColor);
    applyBackgroundColor(theme.backgroundColor);
  }

  function applyMainColor(colorName: ColorName) {
    const mainColorShades = mainPalette[colorName];
    if (!mainColorShades) throw new Error('Invalid color name');
    for (const [shadeName, shadeValue] of Object.entries(mainColorShades)) {
      document.documentElement.style.setProperty(`--color-main-${shadeName}`, shadeValue);
    }
  }

  function applyAccentColor(colorName: ColorName) {
    const accentColorShades = mainPalette[colorName];
    if (!accentColorShades) throw new Error('Invalid color name');
    for (const [shadeName, shadeValue] of Object.entries(accentColorShades)) {
      document.documentElement.style.setProperty(`--color-accent-${shadeName}`, shadeValue);
    }
  }

  function applyBackgroundColor(index: number) {
    const backgroundColor = backgroundPalette[index];
    if (!backgroundColor) throw new Error('Invalid color index');
    document.documentElement.style.setProperty('--color-background', backgroundColor);
  }

  function setMainColor(colorName: ColorName) {
    if (!selectedThemeCopy.value) return;
    if (!mainPalette[colorName]) throw new Error('Invalid color name');
    selectedThemeCopy.value.mainColor = colorName;
    applyMainColor(colorName);
  }

  function setAccentColor(colorName: ColorName) {
    if (!selectedThemeCopy.value) return;
    if (!mainPalette[colorName]) throw new Error('Invalid color name');
    selectedThemeCopy.value.accentColor = colorName;
    applyAccentColor(colorName);
  }

  function setBackgroundColor(index: number) {
    if (!selectedThemeCopy.value) return;
    if (!backgroundPalette[index]) throw new Error('Invalid color index');
    selectedThemeCopy.value.backgroundColor = index;
    applyBackgroundColor(index);
  }

  function saveSelectedTheme() {
    if (!settings.data || !selectedThemeCopy.value) return;
    settings.data.themes[settings.data.selectedTheme] = selectedThemeCopy.value;
  }

  function resetSelectedTheme() {
    if (!settings.data) return;
    const themes = settings.data.themes;
    const theme = themes[settings.data.selectedTheme];
    selectedThemeCopy.value = { ...theme };
    applyTheme(selectedThemeCopy.value);
  }

  async function closeThemeSettings() {
    if (selectedThemeChanged.value) {
      const shouldSave = await dialogService.confirm({
        title: 'Save changes?',
        description: 'You have unsaved changes to the theme. Do you want to save them?',
        confirmButtonLabel: 'Save',
        rejectButtonLabel: 'Discard'
      });
      if (shouldSave) {
        saveSelectedTheme();
      } else {
        initLocalState();
      }
    }
    themeSettingsOpen.value = false;
  }

  function openThemeSettings() {
    themeSettingsOpen.value = true;
  }

  return reactive({
    themeSettingsOpen,
    selectedThemeCopy,

    loaded: computed(() => !!settings.data),
    themes: computed(() => settings.data?.themes ?? []),
    selectedTheme: computed(() => settings.data?.selectedTheme ?? 0),
    selectedThemeChanged,

    selectTheme,
    applyTheme,
    setMainColor,
    setAccentColor,
    setBackgroundColor,
    saveSelectedTheme,
    resetSelectedTheme,
    closeThemeSettings,
    openThemeSettings
  });
}
