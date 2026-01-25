// js/utils.js
const Utils = {
    // Generar ID único
    uid: () => Date.now().toString(36) + Math.random().toString(36).substr(2),

    // Formatear Fecha YYYY-MM-DD
    formatDate: (dateObj) => dateObj.toISOString().split('T')[0],

    // Cálculo Nutricional
    calculateTargets: (profile) => {
        let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
        bmr += profile.gender === 'male' ? 5 : -161;
        const acts = { sed: 1.2, light: 1.375, mod: 1.55, act: 1.725 };
        const tdee = bmr * (acts[profile.activity] || 1.2);
        
        let target = tdee;
        if(profile.goal === 'lose') target *= 0.80;
        if(profile.goal === 'gain') target *= 1.10;

        return {
            k: Math.round(target),
            p: Math.round((target * 0.3) / 4),
            f: Math.round((target * 0.35) / 9),
            c: Math.round((target * 0.35) / 4)
        };
    },

    // Parser inteligente (Regex mejorado)
    parseAI: (text) => ({
        k: (text.match(/(\d+)\s*(kcal|cal)/i) || [])[1],
        p: (text.match(/(\d+)\s*g?\s*(prot)/i) || [])[1],
        f: (text.match(/(\d+)\s*g?\s*(gras|fat)/i) || [])[1],
        c: (text.match(/(\d+)\s*g?\s*(carb|hidr)/i) || [])[1],
    })
};
