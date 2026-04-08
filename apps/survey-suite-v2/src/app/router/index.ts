import type { ModuleId } from '../../shared/types/state';
import { store } from '../state/store';

export function initRouter(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-module]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const moduleId = button.dataset.module as ModuleId | undefined;
      if (!moduleId) return;
      store.setActiveModule(moduleId);
    });
  });
}