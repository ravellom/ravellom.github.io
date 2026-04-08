import { eventBus } from '../../shared/events/bus';
import type { ConfigModel } from '../../shared/config/model';
import type { Dataset, Lang, ModuleId, ModuleUIState, SuiteState } from '../../shared/types/state';
import { loadState, resetState, saveState } from './persistence';

type Listener = (state: SuiteState) => void;

class Store {
  private state: SuiteState = loadState();
  private listeners: Set<Listener> = new Set();

  getState(): SuiteState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private publish(): void {
    saveState(this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  setLanguage(lang: Lang): void {
    this.state = {
      ...this.state,
      language: lang,
      config: {
        ...this.state.config,
        global: {
          ...this.state.config.global,
          language: lang
        }
      }
    };
    this.publish();
    eventBus.emit('language:changed', { lang });
  }

  setActiveModule(moduleId: ModuleId): void {
    this.state = { ...this.state, activeModule: moduleId };
    this.publish();
  }

  setModulePanel(moduleId: ModuleId, panel: string): void {
    const currentUI = this.state.ui[moduleId];
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        [moduleId]: {
          ...currentUI,
          panel
        }
      } as ModuleUIState
    };
    this.publish();
  }

  setProcessorView(view: 'table' | 'json'): void {
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        processor: {
          ...this.state.ui.processor,
          view
        }
      }
    };
    this.publish();
  }

  setLikertStyleTab(styleTab: 'layout-colors' | 'layout-typography' | 'layout-bars' | 'layout-legend' | 'layout-axes-grid' | 'layout-canvas'): void {
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        likert: {
          ...this.state.ui.likert,
          styleTab
        }
      }
    };
    this.publish();
  }

  setDistributionStyleTab(styleTab: 'layout-colors' | 'layout-typography' | 'layout-marks' | 'layout-annotations' | 'layout-axes-grid' | 'layout-canvas'): void {
    this.state = {
      ...this.state,
      ui: {
        ...this.state.ui,
        distribution: {
          ...this.state.ui.distribution,
          styleTab
        }
      }
    };
    this.publish();
  }

  setActiveDataset(datasetId: string | null): void {
    this.state = {
      ...this.state,
      activeDatasetId: datasetId,
      config: {
        ...this.state.config,
        global: {
          ...this.state.config.global,
          activeDatasetId: datasetId
        }
      }
    };
    this.publish();
    eventBus.emit('dataset:activated', { datasetId });
  }

  updateConfigSection<K extends keyof ConfigModel>(section: K, patch: Partial<ConfigModel[K]>): void {
    this.state = {
      ...this.state,
      config: {
        ...this.state.config,
        [section]: {
          ...this.state.config[section],
          ...patch
        }
      }
    };
    this.publish();
  }

  addDataset(name: string, records: Dataset['records']): string {
    const id = `ds_${Date.now()}`;
    const now = new Date().toISOString();
    const dataset: Dataset = {
      id,
      name,
      records,
      createdAt: now,
      updatedAt: now
    };

    this.state = {
      ...this.state,
      datasets: {
        ...this.state.datasets,
        [id]: dataset
      },
      activeDatasetId: id,
      config: {
        ...this.state.config,
        global: {
          ...this.state.config.global,
          activeDatasetId: id
        }
      }
    };

    this.publish();
    eventBus.emit('dataset:created', { datasetId: id, name });
    eventBus.emit('dataset:activated', { datasetId: id });
    return id;
  }

  updateDatasetRecords(datasetId: string, records: Dataset['records'], name?: string): void {
    const current = this.state.datasets[datasetId];
    if (!current) return;

    const updated: Dataset = {
      ...current,
      name: name ?? current.name,
      records,
      updatedAt: new Date().toISOString()
    };

    this.state = {
      ...this.state,
      datasets: {
        ...this.state.datasets,
        [datasetId]: updated
      }
    };
    this.publish();
  }

  deleteDataset(datasetId: string): void {
    const datasets = { ...this.state.datasets };
    delete datasets[datasetId];
    const nextActive = this.state.activeDatasetId === datasetId ? null : this.state.activeDatasetId;

    this.state = {
      ...this.state,
      datasets,
      activeDatasetId: nextActive,
      config: {
        ...this.state.config,
        global: {
          ...this.state.config.global,
          activeDatasetId: nextActive
        }
      }
    };

    this.publish();
    eventBus.emit('dataset:deleted', { datasetId });
    eventBus.emit('dataset:activated', { datasetId: nextActive });
  }

  hardReset(): void {
    this.state = resetState();
    this.publish();
  }
}

export const store = new Store();

