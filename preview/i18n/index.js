// Language selection the same way Open edX MFEs do it (@edx/frontend-platform i18n): the language preference
// cookie, then the browser language, then English; right-to-left languages set <html dir="rtl">.
import { messages as paragonMessages } from '@openedx/paragon';

// Translations of this page, keyed by locale, e.g. { ar: require('./messages/ar.json') }. Missing messages fall
// back to the English defaultMessage.
const appMessages = {};

const LANGUAGE_PREFERENCE_COOKIE_NAME = 'openedx-language-preference';
const RTL_LOCALES = ['ar', 'he', 'fa', 'fa-ir', 'ur'];

const locales = new Set(['en', ...Object.keys(paragonMessages), ...Object.keys(appMessages)]);

const primarySubtag = (code) => code.split('-')[0];

function findSupportedLocale(locale) {
  if (locales.has(locale)) { return locale; }
  if (locales.has(primarySubtag(locale))) { return primarySubtag(locale); }
  return 'en';
}

function readCookie(name) {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

export function getLocale() {
  const preference = readCookie(LANGUAGE_PREFERENCE_COOKIE_NAME);
  if (preference) { return findSupportedLocale(preference.toLowerCase()); }
  return findSupportedLocale((window.navigator.language || 'en').toLowerCase());
}

export const isRtl = (locale) => RTL_LOCALES.includes(locale);

export function getMessages(locale) {
  return { ...(paragonMessages[locale] || {}), ...(appMessages[locale] || {}) };
}

export function applyLocaleToDocument(locale) {
  const html = document.documentElement;
  html.setAttribute('lang', locale);
  html.setAttribute('dir', isRtl(locale) ? 'rtl' : 'ltr');
}
