/*
  DialogService

    Provides a way to show dialogs as part of an async operation.

    `showDialog` returns a promise that resolves when the dialog is closed.
    There are 3 built-in dialogs: `AlertDialog`, `ConfirmDialog`, and `PromptDialog` with
    a shorthand method for each.
    (`DialogService.alert`, `DialogService.confirm`, and `DialogService.prompt`)

    You can also create custom dialogs, and show them by passing them to `showDialog`.
*/

import { ref, computed, reactive, markRaw, type Component } from 'vue';
import { defineService } from '@/utils/injector';
import type { PropsType, EventType, ComponentWithEvent } from '@/utils/vueTsUtils';
import AlertDialog from '@/components/AlertDialog.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import PromptDialog from '@/components/PromptDialog.vue';

interface Dialog<T extends Component> {
  component: T;
  props: PropsType<T>;
}

export const DialogService = defineService({
  name: 'DialogService',
  setup
});

function setup() {
  const dialogs = ref<Dialog<Component>[]>([]);
  const currentDialog = computed(() => dialogs.value.at(-1));

  /**
   * Shows a dialog and returns a promise that resolves when the dialog is closed.
   *
   * @param component The component to use for the dialog. Must have a `close` event.
   * @param props The props to pass to the dialog component
   */
  function showDialog<C extends Component>(
    component: ComponentWithEvent<C, 'close'>,
    props: PropsType<C>
  ): Promise<EventType<C, 'close'>> {
    return new Promise((resolve) => {
      const dialog: Dialog<C> = {
        component,
        props: {
          ...props,
          onClose: (value: EventType<C, 'close'>) => {
            dialogs.value.pop();
            if (typeof props.onClose === 'function') {
              props.onClose(value);
            }
            resolve(value);
          }
        }
      };
      dialogs.value.push(markRaw(dialog));
    });
  }

  /**
   * Shorthand for showing the `AlertDialog` component.
   */
  async function alert(props: PropsType<typeof AlertDialog>) {
    return showDialog(AlertDialog, props);
  }

  /**
   * Shorthand for showing the `ConfirmDialog` component.
   */
  async function confirm(props: PropsType<typeof ConfirmDialog>) {
    return showDialog(ConfirmDialog, props);
  }

  /**
   * Shorthand for showing the `PromptDialog` component.
   */
  async function prompt(props: PropsType<typeof PromptDialog>) {
    return showDialog(PromptDialog, props);
  }

  return reactive({
    dialogs,
    currentDialog,
    alert,
    confirm,
    prompt
  });
}
