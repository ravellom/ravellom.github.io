import es from './locales/es.js';
import en from './locales/en.js';

const dictionaries = { es, en };

let currentLocale = 'es';

function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => (acc && key in acc ? acc[key] : null), obj);
}

export function setLocale(locale) {
    currentLocale = dictionaries[locale] ? locale : 'es';
    return currentLocale;
}

export function getLocale() {
    return currentLocale;
}

export function t(key, params = {}) {
    const dict = dictionaries[currentLocale] || dictionaries.es;
    const fallback = getNestedValue(dictionaries.es, key) ?? key;
    const template = getNestedValue(dict, key) ?? fallback;

    return String(template).replace(/\{(\w+)\}/g, (_, token) => {
        return token in params ? String(params[token]) : `{${token}}`;
    });
}
