
import React, { useState, useMemo } from 'react';
import type { HydrationRecord } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { WaterDropIcon } from './icons/WaterDropIcon';
import { CheckIcon } from './icons/CheckIcon';

interface HydrationWidgetProps {
  records: HydrationRecord[];
  setRecords: React.Dispatch<React.SetStateAction<HydrationRecord[]>>;
}

const DRINK_TYPES = ['Água', 'Suco', 'Chá', 'Café', 'Água de Coco', 'Outro'];
const DAILY_GOAL = 2500; // ml

export const HydrationWidget: React.FC<HydrationWidgetProps> = ({ records, setRecords }) => {
  const [amount, setAmount] = useState<string>('250');
  const [type, setType] = useState<HydrationRecord['type']>('Água');

  // Filter today's records
  const todayRecords = useMemo(() => {
    const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local
    return records.filter(r => {
        const recordDate = new Date(r.date).toLocaleDateString('sv-SE');
        return recordDate === today;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const todayTotal = useMemo(() => {
    return todayRecords.reduce((acc, curr) => acc + curr.amount, 0);
  }, [todayRecords]);

  const percentage = Math.min(100, Math.round((todayTotal / DAILY_GOAL) * 100));
  const isGoalReached = todayTotal >= DAILY_GOAL;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (!val || val <= 0) return;

    const newRecord: HydrationRecord = {
        id: new Date().toISOString(),
        date: new Date().toISOString(),
        amount: val,
        type: type
    };

    setRecords(prev => [newRecord, ...prev]);
  };

  const handleDelete = (id: string) => {
      setRecords(prev => prev.filter(r => r.id !== id));
  };

  // Progress Circle Logic - Expanded radius for better visibility
  const radius = 45; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 text-slate-100 h-full flex flex-col relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className={`p-2.5 rounded-full ${isGoalReached ? 'bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}>
                {isGoalReached ? (
                    <CheckIcon className="w-6 h-6 text-green-400" />
                ) : (
                    <WaterDropIcon className="w-6 h-6 text-blue-400" />
                )}
            </div>
            <h2 className="text-xl font-bold tracking-tight truncate">Hidratação Diária</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start shrink-0 min-w-0">
            {/* Progress Circle - Larger and more prominent */}
            <div className="relative w-36 h-36 flex-shrink-0 group">
                <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000 ${isGoalReached ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                    <circle
                        className="text-slate-700/50"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className={`${isGoalReached ? 'text-green-500' : 'text-blue-500'} transition-all duration-1000 ease-out`}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="50"
                        cy="50"
                    />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center z-20">
                    <span className={`text-3xl font-black tracking-tighter ${isGoalReached ? 'text-green-400' : 'text-white'}`}>{percentage}%</span>
                    <div className="flex flex-col items-center -mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{todayTotal} ml</span>
                        <span className="text-[8px] text-slate-500 font-medium">Meta: {DAILY_GOAL}ml</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex-grow w-full min-w-0 flex flex-col justify-center">
                {isGoalReached && (
                    <div className="mb-4 p-3 bg-green-600/10 border border-green-500/30 rounded-xl flex items-center gap-3 animate-bounce-subtle">
                        <span className="text-2xl">💧</span>
                        <div className="overflow-hidden min-w-0">
                            <p className="text-green-400 font-black text-sm uppercase tracking-tight">Meta Concluída!</p>
                            <p className="text-[10px] text-green-500/70 font-medium">Ótimo trabalho hoje.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleAdd} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select 
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 w-full min-w-0 shadow-sm"
                        >
                            {DRINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="relative min-w-0">
                            <input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-slate-700 border border-slate-600 text-slate-100 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8 shadow-sm font-bold"
                                placeholder="ml"
                            />
                            <span className="absolute right-3 top-3 text-xs text-slate-500 font-bold pointer-events-none">ml</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        {[200, 300, 500].map(vol => (
                            <button 
                                key={vol}
                                type="button" 
                                onClick={() => setAmount(vol.toString())} 
                                className="flex-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-slate-300 transition-all active:scale-95 border border-slate-600/50"
                            >
                                {vol}ml
                            </button>
                        ))}
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-95 mt-2"
                    >
                        <PlusIcon className="w-4 h-4 flex-shrink-0" /> Registrar Ingestão
                    </button>
                </form>
            </div>
        </div>

        {/* Recent History */}
        <div className="mt-6 pt-4 border-t border-slate-700 flex-grow overflow-hidden flex flex-col min-h-[140px]">
            <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Registros de Hoje</h3>
                <span className="text-[10px] text-slate-600 font-mono">{todayRecords.length} entradas</span>
            </div>
            <div className="overflow-y-auto flex-grow pr-1 space-y-2 custom-scrollbar">
                {todayRecords.length > 0 ? (
                    todayRecords.map(record => (
                        <div key={record.id} className="flex justify-between items-center bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 text-xs hover:border-slate-600 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                <div className={`w-1.5 h-6 rounded-full shrink-0 ${record.type === 'Água' ? 'bg-blue-400' : record.type === 'Café' ? 'bg-amber-700' : record.type === 'Suco' ? 'bg-orange-400' : 'bg-slate-500'}`}></div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-slate-200 truncate">{record.type}</span>
                                    <span className="text-[9px] text-slate-500">{new Date(record.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="font-black text-blue-400">{record.amount} ml</span>
                                <button onClick={() => handleDelete(record.id)} className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 py-4">
                        <WaterDropIcon className="w-10 h-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium uppercase tracking-widest opacity-40">Nenhum líquido registrado</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
