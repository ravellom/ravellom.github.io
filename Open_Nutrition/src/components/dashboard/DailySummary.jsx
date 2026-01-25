// src/components/dashboard/DailySummary.jsx
import React from 'react';
import { Card, MacroBar } from '../ui/Cards';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

export const DailySummary = ({ targets, consumed }) => {
  const remaining = Math.max(0, targets.calories - consumed.calories);
  
  const data = [
    { name: 'Consumido', value: consumed.calories },
    { name: 'Restante', value: remaining },
  ];

  return (
    <div className="space-y-4">
      <Card className="flex flex-col items-center">
        <h2 className="text-lg font-bold text-slate-800 self-start mb-2">Resumen de Hoy</h2>
        
        {/* Gráfico de Anillo tipo Pulso */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#3b82f6" /> {/* Azul Pulso */}
                <Cell fill="#e2e8f0" /> {/* Gris fondo */}
                <Label 
                  value={`${remaining}`} 
                  position="center" 
                  className="text-2xl font-bold fill-slate-800"
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-slate-500 mt-[-10px]">Kcal Restantes</p>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Macronutrientes</h3>
        <MacroBar label="Proteínas" current={consumed.protein} max={targets.protein} color="bg-purple-500" />
        <MacroBar label="Grasas" current={consumed.fat} max={targets.fat} color="bg-orange-400" />
        <MacroBar label="Carbohidratos" current={consumed.carbs} max={targets.carbs} color="bg-emerald-400" />
      </Card>
    </div>
  );
};
