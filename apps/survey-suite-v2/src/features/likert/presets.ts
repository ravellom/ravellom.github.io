import type { Lang } from '../../shared/config/model';

export type LikertPreset = {
  id: string;
  label: Record<Lang, string>;
  points: number;
  start: number;
  labels: Record<Lang, string[]>;
};

export const LIKERT_PRESETS: LikertPreset[] = [
  {
    id: 'agreement_5',
    label: { es: 'Acuerdo 5 puntos', en: 'Agreement 5-point' },
    points: 5,
    start: 1,
    labels: {
      es: ['Muy en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Muy de acuerdo'],
      en: ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']
    }
  },
  {
    id: 'agreement_7',
    label: { es: 'Acuerdo 7 puntos', en: 'Agreement 7-point' },
    points: 7,
    start: 1,
    labels: {
      es: ['Muy en desacuerdo', 'En desacuerdo', 'Algo en desacuerdo', 'Neutral', 'Algo de acuerdo', 'De acuerdo', 'Muy de acuerdo'],
      en: ['Strongly disagree', 'Disagree', 'Somewhat disagree', 'Neutral', 'Somewhat agree', 'Agree', 'Strongly agree']
    }
  },
  {
    id: 'frequency_5',
    label: { es: 'Frecuencia 5 puntos', en: 'Frequency 5-point' },
    points: 5,
    start: 1,
    labels: {
      es: ['Nunca', 'Raramente', 'A veces', 'A menudo', 'Siempre'],
      en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
    }
  },
  {
    id: 'satisfaction_5',
    label: { es: 'Satisfacción 5 puntos', en: 'Satisfaction 5-point' },
    points: 5,
    start: 1,
    labels: {
      es: ['Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'],
      en: ['Very dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very satisfied']
    }
  },
  {
    id: 'importance_5',
    label: { es: 'Importancia 5 puntos', en: 'Importance 5-point' },
    points: 5,
    start: 1,
    labels: {
      es: ['No importante', 'Poco importante', 'Moderadamente importante', 'Importante', 'Muy importante'],
      en: ['Not important', 'Slightly important', 'Moderately important', 'Important', 'Very important']
    }
  },
  {
    id: 'quality_5',
    label: { es: 'Calidad 5 puntos', en: 'Quality 5-point' },
    points: 5,
    start: 1,
    labels: {
      es: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'],
      en: ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent']
    }
  },
  {
    id: 'likelihood_5',
    label: { es: 'Probabilidad 5 puntos', en: 'Likelihood 5-point' },
    points: 5,
    start: 1,
    labels: {
      es: ['Muy improbable', 'Improbable', 'Neutral', 'Probable', 'Muy probable'],
      en: ['Very unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very likely']
    }
  },
  {
    id: 'numeric_0_9',
    label: { es: 'Numérica 10 puntos (0-9)', en: 'Numeric 10-point (0-9)' },
    points: 10,
    start: 0,
    labels: {
      es: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    }
  },
  {
    id: 'numeric_1_10',
    label: { es: 'Numérica 10 puntos (1-10)', en: 'Numeric 10-point (1-10)' },
    points: 10,
    start: 1,
    labels: {
      es: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      en: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    }
  }
];

export function getLikertPreset(id: string): LikertPreset | null {
  return LIKERT_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function getLikertPresetLabel(id: string, lang: Lang): string | null {
  const preset = getLikertPreset(id);
  return preset ? preset.label[lang] : null;
}

export function getLikertPresetLabels(id: string, lang: Lang): string[] | null {
  const preset = getLikertPreset(id);
  return preset ? preset.labels[lang] : null;
}
