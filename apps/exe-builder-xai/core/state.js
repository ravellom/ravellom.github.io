const listeners = new Set();

export const appState = {
    locale: 'es',
    data: null,
    validation: null,
    promptTrace: '',
    exerciseMemory: {},
    studentResultsSummary: null
};

export function setState(partialState) {
    Object.assign(appState, partialState);
    listeners.forEach((listener) => listener(appState));
}

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
