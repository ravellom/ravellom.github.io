// src/components/ui/Cards.jsx
import React from 'react';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className}`}>
    {children}
  </div>
);

export const MacroBar = ({ label, current, max, color }) => {
  const percentage = Math.min((current / max) * 100, 100);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
        <span>{label}</span>
        <span>{current} / {max}g</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
