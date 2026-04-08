export type Lang = 'es' | 'en';
export type ModuleId = 'processor' | 'likert' | 'distribution';

import type { ConfigModel } from '../config/model';

export interface DatasetRecord {
  [key: string]: string | number | null;
}

export interface Dataset {
  id: string;
  name: string;
  records: DatasetRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ModuleUIState {
  processor: {
    view: 'table' | 'json';
    panel: 'import' | 'transform' | 'clean' | 'storage';
  };
  likert: {
    zoom: number;
    panel: 'scale' | 'chart' | 'style' | 'export';
    styleTab: 'layout-colors' | 'layout-typography' | 'layout-bars' | 'layout-legend' | 'layout-axes-grid' | 'layout-canvas';
  };
  distribution: {
    selectedNumeric: string[];
    selectedCategory: string | null;
    panel: 'data' | 'chart' | 'style' | 'export';
    styleTab: 'layout-colors' | 'layout-typography' | 'layout-marks' | 'layout-annotations' | 'layout-axes-grid' | 'layout-canvas';
  };
}

export interface SuiteState {
  appSchemaVersion: number;
  language: Lang;
  activeModule: ModuleId;
  activeDatasetId: string | null;
  datasets: Record<string, Dataset>;
  ui: ModuleUIState;
  config: ConfigModel;
}
