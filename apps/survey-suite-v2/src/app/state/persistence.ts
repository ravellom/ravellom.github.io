import { defaultConfig } from '../../shared/config/model';
import type { SuiteState } from '../../shared/types/state';

export const APP_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'surveySuiteV2.state';

function cloneDefaultConfig() {
  return JSON.parse(JSON.stringify(defaultConfig)) as typeof defaultConfig;
}

export function defaultState(): SuiteState {
  return {
    appSchemaVersion: APP_SCHEMA_VERSION,
    language: 'es',
    activeModule: 'processor',
    activeDatasetId: null,
    datasets: {},
    ui: {
      processor: { view: 'table', panel: 'import' },
      likert: { zoom: 1, panel: 'style', styleTab: 'layout-colors' },
      distribution: { selectedNumeric: [], selectedCategory: null, panel: 'data', styleTab: 'layout-colors' }
    },
    config: cloneDefaultConfig()
  };
}

export function loadState(): SuiteState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();

    const parsed = JSON.parse(raw) as SuiteState;
    if (parsed.appSchemaVersion !== APP_SCHEMA_VERSION) {
      return defaultState();
    }

    const fallback = defaultState();
    return {
      ...fallback,
      ...parsed,
      ui: {
        ...fallback.ui,
        ...(parsed.ui ?? {}),
        processor: {
          ...fallback.ui.processor,
          ...(parsed.ui?.processor ?? {})
        },
        likert: {
          ...fallback.ui.likert,
          ...(parsed.ui?.likert ?? {})
        },
        distribution: {
          ...fallback.ui.distribution,
          ...(parsed.ui?.distribution ?? {})
        }
      },
      config: {
        ...fallback.config,
        ...(parsed.config ?? {}),
        sharedChart: {
          ...fallback.config.sharedChart,
          ...(parsed.config?.sharedChart ?? {})
        },
        sharedExport: {
          ...fallback.config.sharedExport,
          ...(parsed.config?.sharedExport ?? {})
        },
        sharedAnnotations: {
          ...fallback.config.sharedAnnotations,
          ...(parsed.config?.sharedAnnotations ?? {})
        },
        processor: {
          ...fallback.config.processor,
          ...(parsed.config?.processor ?? {})
        },
        likert: {
          ...fallback.config.likert,
          ...(parsed.config?.likert ?? {})
        },
        likertChartType: {
          ...fallback.config.likertChartType,
          ...(parsed.config?.likertChartType ?? {})
        },
        distribution: {
          ...fallback.config.distribution,
          ...(parsed.config?.distribution ?? {})
        },
        distributionChartType: {
          ...fallback.config.distributionChartType,
          ...(parsed.config?.distributionChartType ?? {})
        }
      }
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: SuiteState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState(): SuiteState {
  const next = defaultState();
  saveState(next);
  return next;
}
