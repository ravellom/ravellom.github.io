// js/utils.js
const Utils = {
    uid: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    
    formatDate: (d) => {
        // Aseguramos que maneje objetos Date o strings
        const dateObj = typeof d === 'string' ? new Date(d) : d;
        return dateObj.toISOString().split('T')[0];
    },

    calculateTargets: (p) => {
        if (!p) return { k:2000, p:150, f:70, c:200 }; // Valores por defecto si no hay perfil
        
        let bmr = (10 * p.weight) + (6.25 * p.height) - (5 * p.age);
        bmr += p.gender === 'male' ? 5 : -161;
        
        const acts = { sed: 1.2, light: 1.375, mod: 1.55, act: 1.725 };
        const tdee = bmr * (acts[p.activity] || 1.2);
        
        let target = tdee;
        if(p.goal === 'lose') target *= 0.80;
        else if(p.goal === 'gain') target *= 1.10;

        return {
            k: Math.round(target),
            p: Math.round((target * 0.3) / 4),
            f: Math.round((target * 0.35) / 9),
            c: Math.round((target * 0.35) / 4)
        };
    },

    // --- NUEVO PARSEADOR INTELIGENTE ---
// Asegúrate de que utils.js tiene esta versión de parseAI:
parseAI: (text) => {
    // Limpieza
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();

    // Regex flexible: Busca Nombre/Kcal seguido de : o espacio y el valor
    const getVal = (keywords) => {
        const regex = new RegExp(`(?:${keywords})\\s*[:=\\-\\.]?\\s*(\\d+)`, 'i');
        const match = cleanText.match(regex);
        return match ? parseInt(match[1]) : null;
    };
    
    // Regex especial para el nombre: captura todo hasta el salto de línea
    const getName = () => {
        const regex = /(?:Nombre|Plato|Alimento)\s*[:=\\-\\.]?\s*([^\n\r]+)/i;
        const match = cleanText.match(regex);
        // Si lo encuentra, limpiamos comas finales por si acaso
        return match ? match[1].replace(/,$/, '').trim() : null;
    };

    return {
        name: getName(),
        k: getVal('Kcal|Calorias|Calorías|Cal'),
        p: getVal('Prot|Proteina|Proteína|Proteínas'),
        f: getVal('Gras|Grasa|Grasas|Fat'),
        c: getVal('Carb|Carbos|Carbohidratos|Hidratos')
    };
}
};