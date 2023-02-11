export const isIphone = /iPhone/.test(window.navigator.userAgent);
export const isIpad = /iPad/.test(window.navigator.userAgent)
  || (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
  && !isIphone;
export const isIos = isIphone || isIpad;
