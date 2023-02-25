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

export const useDialogService = defineService('DialogService', () => {
  const dialogs = ref<Dialog<Component>[]>([]);
  const currentDialog = computed(() => dialogs.value.at(-1));

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

  async function alert(props: PropsType<typeof AlertDialog>) {
    return showDialog(AlertDialog, props);
  }

  async function confirm(props: PropsType<typeof ConfirmDialog>) {
    return showDialog(ConfirmDialog, props);
  }

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
});
