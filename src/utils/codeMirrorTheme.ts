import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';

export const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'transparent',
    foreground: '#f8f8f2',
    caret: '#f8f8f0',
    selection: 'rgba(255, 255, 255, 0.2)',
    selectionMatch: 'rgba(255, 255, 255, 0.1)',
    gutterBackground: '#282a36',
    gutterForeground: '#6D8A88',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
  },
  styles: [

    {
      tag: [t.link],
      color: '#ff79c6'
    },
    {
      tag: t.url,
      color: '#8BE9FD'
    },
    {
      tag: t.meta,
      color: '#BD93F9',
      fontWeight: 'bold'
    },
    {
      tag: [t.comment, t.contentSeparator],
      color: '#6272a4'
    },
    {
      tag: t.string,
      color: '#f1fa8c'
    },
    {
      tag: [t.number, t.bool],
      color: '#BD93F9'
    },
    {
      tag: [t.keyword, t.operator, t.tagName],
      color: '#ff79c6'
    },
    {
      tag: [t.function(t.propertyName), t.function(t.variableName), t.attributeName],
      color: '#50fa7b'
    },
    {
      tag: t.derefOperator,
      color: '#f8f8f2'
    },
    {
      tag: t.className,
      color: '#8BE9FD'
    },
    {
      tag: [t.typeName],
      color: '#8BE9FD',
      fontStyle: 'italic'
    },
    {
      tag: t.labelName,
      color: '#50fa7b',
    },
    {
      tag: t.heading,
      color: '#BD93F9',
      fontWeight: 'bold'
    },
    {
      tag: [t.emphasis, t.quote],
      fontStyle: 'italic',
      color: '#f1fa8c'
    },
    {
      tag: t.strong,
      fontWeight: 'bold',
      color: '#FFB86C'
    },
    {
      tag: t.monospace,
      color: '#50fa7b'
    },
    {
      tag: t.strikethrough,
      textDecoration: 'line-through'
    }
  ]
});
