import React from 'react';
import { StatCardProps } from '../types';

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = "bg-white" }) => {
  return (
    <div className={`${color} p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-xs font-medium">
          <span className={trend.startsWith('+') ? "text-green-600" : "text-red-600"}>
            {trend}
          </span>
          <span className="text-slate-400 ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
};
