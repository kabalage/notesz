import { computed, reactive, ref, watch } from 'vue';
import { createInjectionState } from '@/utils/createInjectionState';
import { mainPalette, backgroundPalette, type ColorName } from '@/model/themeData';
import useSettings from '@/composables/useSettings';
import type { Theme } from '@/model/settingsModel';

const [provideThemeState, useThemeState] = createInjectionState(() => {

  const themeSettingsOpen = ref(false);
  const settings = useSettings();
  const selectedThemeCopy = ref<Theme>();

  const selectedThemeChanged = computed(() => {
    if (!settings.data || !selectedThemeCopy.value) return false;
    const selectedTheme = settings.data.themes[settings.data.selectedTheme];
    return (
      selectedTheme.mainColor !== selectedThemeCopy.value.mainColor ||
      selectedTheme.accentColor !== selectedThemeCopy.value.accentColor ||
      selectedTheme.backgroundColor !== selectedThemeCopy.value.backgroundColor
    );
  });

  watch(() => settings.data?.selectedTheme, (index) => {
    if (index === undefined) return;
    selectTheme(index);
  });

  function selectTheme(index: number) {
    if (!settings.data) return;
    const themes = settings.data.themes;
    if (!themes[index]) throw new Error('Invalid theme index');
    if (selectedThemeChanged.value) {
      // TODO: Show a dialog instead of a confirm
      const shouldSave = confirm('Save changes to the theme?');
      if (shouldSave) {
        saveSelectedTheme();
      }
    }
    settings.data.selectedTheme = index;
    const theme = themes[index];
    selectedThemeCopy.value = { ...theme };
    applyTheme(selectedThemeCopy.value);
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

  function closeThemeSettings() {
    if (selectedThemeChanged.value) {
      // TODO: Show a dialog instead of a confirm
      const shouldSave = confirm('Save changes to the theme?');
      if (shouldSave) {
        saveSelectedTheme();
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
});

export { provideThemeState, useThemeState };
