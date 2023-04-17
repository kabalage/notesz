import { tags as t } from '@lezer/highlight';
import { createTheme } from '@uiw/codemirror-themes';

export const darkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'transparent',
    foreground: 'rgb(255 255 255 / 1)',
    caret: 'rgb(255 255 255 / 1)',
    selection: 'rgb(var(--color-main-400) / 0.4)',
    selectionMatch: 'rgb(var(--color-accent-400) / 0.4)',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
  },
  styles: [
    {
      tag: t.link,
      color: 'rgb(var(--color-accent-200) / 0.9)',
      textDecoration: 'underline'
    },
    {
      tag: t.url,
      color: 'rgb(var(--color-main-200) / 0.6)',
    },
    {
      tag: t.className,
      color: 'rgb(var(--color-main-200) / 1)',
    },
    {
      tag: t.meta,
      color: 'rgb(var(--color-main-300) / 0.8)',
      fontWeight: 'bold'
    },
    {
      tag: t.heading,
      color: 'rgb(var(--color-accent-300) / 1)',
      fontWeight: 'bold'
    },
    {
      tag: [t.comment, t.contentSeparator],
      color: 'rgb(var(--color-main-300) / 0.6)'
    },
    {
      tag: t.string,
      color: 'rgb(var(--color-accent-300) / 1)'
    },
    {
      tag: [t.number, t.bool],
      color: 'rgb(var(--color-accent-300) / 1)'
    },
    {
      tag: [t.keyword, t.operator, t.tagName],
      color: 'rgb(var(--color-main-300) / 0.8)'
    },
    {
      tag: [t.labelName, t.monospace],
      color: 'rgb(var(--color-main-300) / 1)'
    },
    {
      tag: [t.function(t.propertyName), t.function(t.variableName), t.attributeName],
      color: 'rgb(255 255 255 / 1)'
    },
    {
      tag: t.derefOperator,
      color: 'rgb(255 255 255 / 1)'
    },
    {
      tag: t.typeName,
      color: 'rgb(var(--color-main-300) / 0.8)',
      fontStyle: 'italic'
    },
    {
      tag: [t.emphasis, t.quote],
      fontStyle: 'italic',
      color: 'rgb(var(--color-accent-200) / 0.9)'
    },
    {
      tag: t.strong,
      fontWeight: 'bold',
      color: 'rgb(var(--color-accent-300) / 1)'
    },
    {
      tag: t.strikethrough,
      textDecoration: 'line-through'
    }
  ]
});

export const draculaTheme = createTheme({
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
      tag: t.link,
      color: '#ff79c6'
    },
    {
      tag: [t.url, t.className],
      color: '#8BE9FD'
    },
    {
      tag: [t.meta, t.heading],
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
      tag: [t.function(t.propertyName), t.function(t.variableName), t.attributeName, t.labelName,
        t.monospace],
      color: '#50fa7b'
    },
    {
      tag: t.derefOperator,
      color: '#f8f8f2'
    },
    {
      tag: t.typeName,
      color: '#8BE9FD',
      fontStyle: 'italic'
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
      tag: t.strikethrough,
      textDecoration: 'line-through'
    }
  ]
});
