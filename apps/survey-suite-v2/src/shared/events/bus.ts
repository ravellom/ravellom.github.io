import type { Lang } from '../types/state';

export interface AppEventMap {
  'app:init': {};
  'language:changed': { lang: Lang };
  'dataset:created': { datasetId: string; name: string };
  'dataset:deleted': { datasetId: string };
  'dataset:activated': { datasetId: string | null };
  'error:raised': { code: string; message: string; scope: 'app' | 'processor' | 'likert' | 'distribution' };
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers: Partial<Record<keyof AppEventMap, Set<Handler<unknown>>>> = {};

  on<K extends keyof AppEventMap>(event: K, handler: Handler<AppEventMap[K]>): () => void {
    let eventHandlers = this.handlers[event];
    if (!eventHandlers) {
      eventHandlers = new Set<Handler<unknown>>();
      this.handlers[event] = eventHandlers;
    }
    eventHandlers.add(handler as Handler<unknown>);

    return () => {
      this.handlers[event]?.delete(handler as Handler<unknown>);
    };
  }

  emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]): void {
    this.handlers[event]?.forEach((handler) => {
      (handler as Handler<AppEventMap[K]>)(payload);
    });
  }
}

export const eventBus = new EventBus();
