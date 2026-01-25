// src/utils/nutrition.js

export const calculateMacros = (profile) => {
  const { weight, height, age, gender, activity, goal } = profile;
  
  // 1. Tasa Metabólica Basal (Mifflin-St Jeor)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;

  // 2. Gasto Energético Total (TDEE)
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };
  const tdee = bmr * (activityMultipliers[activity] || 1.2);

  // 3. Ajuste por Objetivo
  let targetCalories = tdee;
  if (goal === 'lose_fat') targetCalories *= 0.80; // Déficit 20%
  if (goal === 'gain_muscle') targetCalories *= 1.10; // Superávit 10%

  // 4. Distribución de Macros (Estándar balanceado)
  // Proteína: 4 kcal/g, Carbo: 4 kcal/g, Grasa: 9 kcal/g
  return {
    calories: Math.round(targetCalories),
    protein: Math.round((targetCalories * 0.30) / 4), // 30% Proteína
    fat: Math.round((targetCalories * 0.35) / 9),     // 35% Grasa
    carbs: Math.round((targetCalories * 0.35) / 4),   // 35% Carbos
  };
};

export const generateEmptyJSON = () => ({
  meta: { version: "1.0", created: new Date().toISOString() },
  profile: null,
  logs: [] 
});