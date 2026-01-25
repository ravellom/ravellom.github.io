// src/components/forms/FoodLogger.jsx
import React, { useState } from 'react';
import { Card } from '../ui/Cards';

export const FoodLogger = ({ onLogFood }) => {
  const [input, setInput] = useState({ name: '', k: '', p: '', f: '', c: '' });
  const [aiText, setAiText] = useState('');

  // Magia: Extraer números del texto de la IA
  const parseAiText = () => {
    // Busca patrones simples como "400 kcal", "20g proteina", etc.
    const k = aiText.match(/(\d+)\s*(kcal|calorias)/i)?.[1] || '';
    const p = aiText.match(/(\d+)\s*g?\s*(prot|prote)/i)?.[1] || '';
    const f = aiText.match(/(\d+)\s*g?\s*(gras|fat)/i)?.[1] || '';
    const c = aiText.match(/(\d+)\s*g?\s*(carb|hidrat)/i)?.[1] || '';
    
    setInput(prev => ({ ...prev, k, p, f, c }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogFood({
      id: Date.now(),
      name: input.name || 'Comida rápida',
      calories: Number(input.k),
      protein: Number(input.p),
      fat: Number(input.f),
      carbs: Number(input.c),
      timestamp: new Date().toISOString()
    });
    setInput({ name: '', k: '', p: '', f: '', c: '' });
    setAiText('');
  };

  return (
    <Card className="mt-6">
      <h3 className="font-bold text-lg mb-3">Registrar Comida</h3>
      
      {/* Área "Smart Paste" para IA */}
      <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-blue-100">
        <label className="text-xs font-bold text-blue-600 mb-1 block">¿Usaste ChatGPT/Gemini?</label>
        <textarea 
          className="w-full text-sm p-2 bg-white border rounded mb-2"
          placeholder="Pega aquí lo que te dijo la IA (ej: 'Son 450 kcal, 20g prot...')"
          rows="2"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          onBlur={parseAiText} // Auto-rellenar al salir del campo
        />
        <p className="text-[10px] text-slate-400">Los datos se rellenarán abajo automáticamente.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input 
          type="text" placeholder="Nombre (ej: Tostada aguacate)" 
          className="w-full p-2 border rounded"
          value={input.name} onChange={e => setInput({...input, name: e.target.value})}
          required
        />
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><input type="number" placeholder="Kcal" className="w-full p-1 border rounded text-center" value={input.k} onChange={e => setInput({...input, k: e.target.value})} required /><span className="text-[10px]">Kcal</span></div>
          <div><input type="number" placeholder="Prot" className="w-full p-1 border rounded text-center" value={input.p} onChange={e => setInput({...input, p: e.target.value})} /><span className="text-[10px]">Prot</span></div>
          <div><input type="number" placeholder="Gras" className="w-full p-1 border rounded text-center" value={input.f} onChange={e => setInput({...input, f: e.target.value})} /><span className="text-[10px]">Gras</span></div>
          <div><input type="number" placeholder="Carb" className="w-full p-1 border rounded text-center" value={input.c} onChange={e => setInput({...input, c: e.target.value})} /><span className="text-[10px]">Carb</span></div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
          Añadir al Diario
        </button>
      </form>
    </Card>
  );
};
