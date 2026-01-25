// src/App.jsx
import React, { useState, useEffect } from 'react';
import { calculateMacros, generateEmptyJSON } from './utils/nutrition';
import { DailySummary } from './components/dashboard/DailySummary';
import { FoodLogger } from './components/forms/FoodLogger';
import { Card } from './components/ui/Cards';
import { Download, Upload } from 'lucide-react'; // Instalar: npm i lucide-react

export default function App() {
  const [data, setData] = useState(null); // Estado global de la app
  
  // Totales de hoy
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = data?.logs.filter(l => l.timestamp.startsWith(today)) || [];
  const consumed = todayLogs.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    fat: acc.fat + curr.fat,
    carbs: acc.carbs + curr.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

  // Objetivos (si hay perfil)
  const targets = data?.profile ? calculateMacros(data.profile) : { calories: 2000, protein: 150, fat: 70, carbs: 200 };

  // Funciones de Archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => setData(JSON.parse(event.target.result));
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pulso_backup_${today}.json`;
    link.click();
  };

  const handleNewProfile = () => {
    // Aquí iría un formulario simple para crear el perfil inicial
    // Por brevedad, creamos uno mockeado
    const newData = generateEmptyJSON();
    newData.profile = { weight: 75, height: 175, age: 30, gender: 'male', activity: 'moderate', goal: 'lose_fat' };
    setData(newData);
  };

  const addFood = (food) => {
    const newLogs = [...data.logs, food];
    setData({ ...data, logs: newLogs });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-blue-600 tracking-tighter">/// pulso libre</h1>
          <div className="flex gap-2">
            <label className="p-2 bg-white rounded-full shadow cursor-pointer">
              <Upload size={20} className="text-slate-600" />
              <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
            </label>
            {data && (
              <button onClick={handleDownload} className="p-2 bg-blue-600 rounded-full shadow text-white">
                <Download size={20} />
              </button>
            )}
          </div>
        </header>

        {!data ? (
          <Card className="text-center py-10">
            <h2 className="text-xl font-bold mb-4">Bienvenido</h2>
            <p className="text-slate-500 mb-6">Carga tu archivo JSON o inicia uno nuevo.</p>
            <button onClick={handleNewProfile} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold">
              Crear Nuevo Perfil
            </button>
          </Card>
        ) : (
          <>
            <DailySummary targets={targets} consumed={consumed} />
            <FoodLogger onLogFood={addFood} />
            
            {/* Lista simple de comidas */}
            <div className="mt-6">
              <h3 className="font-bold text-slate-400 text-sm uppercase mb-2">Historial de Hoy</h3>
              {todayLogs.map(log => (
                <div key={log.id} className="bg-white p-3 rounded-xl mb-2 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-bold">{log.name}</p>
                    <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                  <span className="font-mono text-blue-600 font-bold">{log.calories} kcal</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
