// Fork of @uiw/codemirror-extensions-hyper-link
// https://github.com/uiwjs/react-codemirror/blob/v4.23.14/extensions/hyper-link/src/index.ts
//
// Things changed:
//    nicer svg icon
//    fix underline style to be applied to the child
//    always use MatchDecorator

import {
  ViewPlugin,
  EditorView,
  Decoration,
  type DecorationSet,
  MatchDecorator,
  WidgetType,
  ViewUpdate,
} from '@codemirror/view';
import type { Extension } from '@codemirror/state';

// eslint-disable-next-line max-len
const svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"  viewBox="0 0 20 20" fill="currentColor"><path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" /><path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" /></svg>';

const defaultRegexp = /\b((?:https?|ftp):\/\/[^\s/$.?#].[^\s]*)\b/gi;

export interface HyperLinkState {
  at: number;
  url: string;
  anchor: HyperLinkExtensionOptions['anchor'];
}

class HyperLinkIcon extends WidgetType {
  private readonly state: HyperLinkState;
  constructor(state: HyperLinkState) {
    super();
    this.state = state;
  }
  eq(other: HyperLinkIcon) {
    return this.state.url === other.state.url && this.state.at === other.state.at;
  }
  toDOM() {
    const wrapper = document.createElement('a');
    wrapper.href = this.state.url;
    wrapper.target = '_blank';
    wrapper.innerHTML = svgStr;
    wrapper.className = 'cm-hyper-link-icon';
    wrapper.rel = 'nofollow';
    const anchor = this.state.anchor && this.state.anchor(wrapper);
    return anchor || wrapper;
  }
}

const linkDecorator = (
  regexp?: RegExp,
  matchData?: Record<string, string>,
  matchFn?: (str: string, input: string, from: number, to: number) => string,
  anchor?: HyperLinkExtensionOptions['anchor'],
) =>
  new MatchDecorator({
    regexp: regexp || defaultRegexp,
    decorate: (add, from, to, match) => {
      const url = match[0];
      let urlStr = matchFn && typeof matchFn === 'function'
        ? matchFn(url, match.input, from, to)
        : url;
      if (matchData && matchData[url]) {
        urlStr = matchData[url];
      }
      const start = to,
        end = to;
      const linkIcon = new HyperLinkIcon({ at: start, url: urlStr, anchor });
      add(from, to, Decoration.mark({ class: 'cm-hyper-link-underline' }));
      add(start, end, Decoration.widget({ widget: linkIcon, side: 1 }));
    },
  });

export type HyperLinkExtensionOptions = {
  regexp?: RegExp;
  match?: Record<string, string>;
  handle?: (value: string, input: string, from: number, to: number) => string;
  anchor?: (dom: HTMLAnchorElement) => HTMLAnchorElement;
};

export function hyperLinkExtension(
  { regexp, match, handle, anchor }: HyperLinkExtensionOptions = {}
) {
  return ViewPlugin.fromClass(
    class HyperLinkView {
      decorator: MatchDecorator;
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorator = linkDecorator(regexp, match, handle, anchor);
        this.decorations = this.decorator.createDeco(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.decorator.updateDeco(update, this.decorations);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}

export const hyperLinkStyle = EditorView.baseTheme({
  '.cm-hyper-link-icon': {
    display: 'inline-block',
    verticalAlign: 'middle',
    marginLeft: '0.2ch',
  },
  '.cm-hyper-link-icon svg': {
    display: 'block',
  },
  '.cm-hyper-link-underline > *': {
    textDecoration: 'underline',
  },
});

export const hyperLink: Extension = [hyperLinkExtension(), hyperLinkStyle];
