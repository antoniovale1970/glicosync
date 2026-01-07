
import React, { useState, useMemo } from 'react';
import type { InsulinSchedule, InsulinRecord, Reminder } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ToggleSwitch } from './ToggleSwitch';
import { SyringeIcon } from './icons/SyringeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { EditIcon } from './icons/EditIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ConfirmModal } from './ConfirmModal';

interface InsulinControlProps {
  schedules: InsulinSchedule[];
  setSchedules: React.Dispatch<React.SetStateAction<InsulinSchedule[]>>;
  records: InsulinRecord[];
  setRecords: React.Dispatch<React.SetStateAction<InsulinRecord[]>>;
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const insulinTypes = ['Rápida', 'Ultrarrápida', 'Intermediária', 'Lenta', 'Pré-misturada', 'Outra'];

export const InsulinControl: React.FC<InsulinControlProps> = ({ schedules, setSchedules, records, setRecords }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState(insulinTypes[3]); // Default Lenta
  const [dosage, setDosage] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderDays, setNewReminderDays] = useState<string[]>(daysOfWeek);
  const [reminderTimes, setReminderTimes] = useState<Reminder[]>([]);
  
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'schedule' | 'record' } | null>(null);

  const handleAddReminderTime = () => {
    if (newReminderTime && !reminderTimes.some(rt => rt.time === newReminderTime)) {
        if (newReminderDays.length === 0) {
            alert('Por favor, selecione pelo menos um dia da semana.');
            return;
        }
      setReminderTimes(prev => [...prev, { time: newReminderTime, days: newReminderDays }].sort((a,b) => a.time.localeCompare(b.time)));
      setNewReminderDays(daysOfWeek);
    }
  };

  const handleRemoveReminderTime = (timeToRemove: string) => {
    setReminderTimes(prev => prev.filter(rt => rt.time !== timeToRemove));
  };

  const handleToggleDay = (day: string) => {
    setNewReminderDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setReminderEnabled(false);
    setReminderTimes([]);
    setNewReminderDays(daysOfWeek);
    setEditingId(null);
    setType(insulinTypes[3]);
  };

  const handleEditSchedule = (schedule: InsulinSchedule) => {
      setEditingId(schedule.id);
      setName(schedule.name);
      setType(schedule.type);
      setDosage(schedule.defaultDosage);
      setReminderEnabled(schedule.reminderEnabled);
      setReminderTimes(schedule.reminderTimes || []);
      setNewReminderDays(daysOfWeek);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;

    const scheduleData: InsulinSchedule = {
      id: editingId || new Date().toISOString(),
      name,
      type: type as any,
      defaultDosage: dosage,
      reminderEnabled,
      reminderTimes: reminderEnabled ? reminderTimes : [],
    };

    if (editingId) {
        setSchedules(prev => prev.map(s => s.id === editingId ? scheduleData : s));
    } else {
        setSchedules(prev => [...prev, scheduleData]);
    }
    
    resetForm();
  };

  // CORREÇÃO: Uso de evento e setState funcional
  const handleDeleteScheduleClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteTarget({ id, type: 'schedule' });
  };

  const handleRecordDose = (schedule: InsulinSchedule) => {
      const units = prompt(`Confirmar aplicação de ${schedule.name}? \n\nQuantas unidades foram aplicadas?`, schedule.defaultDosage);
      if (units !== null) {
          const numUnits = parseFloat(units);
          if (!isNaN(numUnits) && numUnits > 0) {
              const newRecord: InsulinRecord = {
                  id: new Date().toISOString(),
                  scheduleId: schedule.id,
                  name: schedule.name,
                  type: schedule.type,
                  units: numUnits,
                  date: new Date().toISOString()
              };
              setRecords(prev => [newRecord, ...prev]);
              alert("Aplicação registrada com sucesso!");
          } else {
              alert("Valor inválido.");
          }
      }
  };

  // CORREÇÃO: Uso de evento e setState funcional
  const handleDeleteRecordClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteTarget({ id, type: 'record' });
  };

  const confirmDelete = () => {
      if (deleteTarget) {
          if (deleteTarget.type === 'schedule') {
              setSchedules(prev => prev.filter(s => s.id !== deleteTarget.id));
              if (editingId === deleteTarget.id) resetForm();
          } else {
              setRecords(prev => prev.filter(r => r.id !== deleteTarget.id));
          }
          setDeleteTarget(null);
      }
  };
  
  const handlePrintHistory = () => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;

      const rows = sortedRecords.map(r => `
        <tr>
            <td>${new Date(r.date).toLocaleString()}</td>
            <td>${r.name}</td>
            <td>${r.type}</td>
            <td>${r.units} UI</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
            <head><title>Histórico de Insulina - GlicoSync</title>
            <style>table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style>
            </head>
            <body><h1>Histórico de Insulina</h1><table><thead><tr><th>Data/Hora</th><th>Insulina</th><th>Tipo</th><th>Dose</th></tr></thead><tbody>${rows}</tbody></table><script>window.print()</script></body>
        </html>
      `);
      printWindow.document.close();
  };

  const sortedRecords = useMemo(() => {
      return [...records].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
                <SyringeIcon className="h-8 w-8 text-sky-400" />
                Controle de Insulina
            </h1>
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button 
                    onClick={() => setActiveTab('config')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-brand-blue text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Minhas Insulinas
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-blue text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <HistoryIcon className="w-4 h-4"/> Histórico
                </button>
            </div>
        </div>

        {activeTab === 'config' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                {/* Form Section */}
                <div className={`lg:col-span-1 bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 border ${editingId ? 'border-yellow-500' : 'border-slate-700'} h-fit`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className={`text-xl font-semibold ${editingId ? 'text-yellow-400' : 'text-slate-200'}`}>
                            {editingId ? 'Editar Insulina' : 'Nova Insulina'}
                        </h2>
                        {editingId && (
                            <button onClick={resetForm} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Nome Comercial</label>
                            <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Lantus, Humalog" className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-sky-500 focus:border-sky-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Tipo</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-sky-500 focus:border-sky-500">
                                {insulinTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Dose Padrão (Unidades)</label>
                            <input required type="number" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="Ex: 10" className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-sky-500 focus:border-sky-500"/>
                        </div>

                        <div className="border-t border-slate-700 pt-4">
                            <div className="flex items-center gap-3 mb-3">
                                <ToggleSwitch enabled={reminderEnabled} onChange={setReminderEnabled} />
                                <span className="text-slate-300 text-sm font-medium">Ativar Alertas</span>
                            </div>

                            {reminderEnabled && (
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-600 space-y-3">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-400 block mb-1">Horário</label>
                                            <input type="time" value={newReminderTime} onChange={e => setNewReminderTime(e.target.value)} className="w-full bg-slate-700 border-slate-600 rounded px-2 py-1 text-white text-sm" />
                                        </div>
                                        <button type="button" onClick={handleAddReminderTime} className="bg-slate-600 hover:bg-slate-500 text-white p-1.5 rounded transition-colors h-[30px] w-[30px] flex items-center justify-center">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Dias</label>
                                        <div className="flex flex-wrap gap-1">
                                            {daysOfWeek.map(day => (
                                                <button 
                                                    key={day} 
                                                    type="button" 
                                                    onClick={() => handleToggleDay(day)}
                                                    className={`text-[10px] px-2 py-1 rounded ${newReminderDays.includes(day) ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {reminderTimes.length > 0 && (
                                        <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                                            {reminderTimes.map((rt, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-slate-800 p-1.5 rounded text-xs border border-slate-700">
                                                    <span className="text-sky-300 font-mono font-bold">{rt.time}</span>
                                                    <span className="text-slate-400 truncate max-w-[100px]">{rt.days?.join(', ')}</span>
                                                    <button type="button" onClick={() => handleRemoveReminderTime(rt.time)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-3 h-3"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button type="submit" className={`w-full font-bold py-2 px-4 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 ${editingId ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-brand-blue hover:bg-brand-blue-light text-white'}`}>
                            {editingId ? <SaveIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />} 
                            {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-200 mb-4">Insulinas Programadas</h2>
                        {schedules.length === 0 ? (
                            <p className="text-slate-500 text-center py-10 bg-slate-800 rounded-xl border border-slate-700 border-dashed">Nenhuma insulina cadastrada.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {schedules.map(s => (
                                    <div key={s.id} className={`bg-slate-800 p-4 rounded-xl shadow-md border flex flex-col justify-between relative overflow-hidden group ${editingId === s.id ? 'border-yellow-500 ring-1 ring-yellow-500/50' : 'border-slate-700'}`}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue"></div>
                                        <div className="pl-3">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-lg font-bold text-white">{s.name}</h3>
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600">{s.type}</span>
                                            </div>
                                            <p className="text-sky-400 font-mono font-bold text-xl mt-1">{s.defaultDosage} <span className="text-sm text-slate-400 font-sans font-normal">unidades</span></p>
                                            
                                            {s.reminderEnabled && s.reminderTimes && s.reminderTimes.length > 0 ? (
                                                <div className="mt-3 space-y-1">
                                                    <p className="text-xs text-slate-400 flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Horários:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.reminderTimes.map((rt, idx) => (
                                                            <span key={idx} className="text-xs bg-sky-900/30 text-sky-200 px-1.5 py-0.5 rounded border border-sky-900/50" title={rt.days?.join(', ')}>
                                                                {rt.time}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="mt-3 text-xs text-slate-500 italic">Sem alertas configurados</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-700">
                                            <button 
                                                onClick={() => handleEditSchedule(s)}
                                                className="text-sky-400 hover:text-sky-300 p-2 rounded hover:bg-sky-900/20 transition-colors"
                                                title="Editar"
                                                disabled={!!editingId && editingId !== s.id}
                                            >
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteScheduleClick(e, s.id)} 
                                                className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20 transition-colors" 
                                                title="Excluir"
                                                disabled={!!editingId && editingId !== s.id}
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleRecordDose(s)} 
                                                className="bg-brand-blue hover:bg-brand-blue-light text-white px-3 py-1.5 rounded text-sm font-bold shadow-sm transition-colors flex items-center gap-2"
                                                disabled={!!editingId}
                                            >
                                                <PlusIcon className="w-4 h-4" /> Registrar Dose
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* NEW: Recent History Section directly in Config Tab */}
                    <div className="pt-6 border-t border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-slate-200">Histórico de Insulinas Administradas</h2>
                            <button 
                                onClick={() => setActiveTab('history')}
                                className="text-sm text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                            >
                                <HistoryIcon className="w-4 h-4" />
                                Ver Completo
                            </button>
                        </div>
                        
                        {sortedRecords.length === 0 ? (
                            <p className="text-slate-500 text-center py-8 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">Nenhuma aplicação registrada recentemente.</p>
                        ) : (
                            <div className="bg-slate-800 rounded-xl shadow-md border border-slate-700 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-slate-300">
                                        <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold">
                                            <tr>
                                                <th className="p-3 pl-4">Data / Hora</th>
                                                <th className="p-3">Insulina</th>
                                                <th className="p-3">Dose</th>
                                                <th className="p-3 pr-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {sortedRecords.slice(0, 5).map(record => (
                                                <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                                                    <td className="p-3 pl-4">
                                                        <div className="text-white text-sm font-medium">{new Date(record.date).toLocaleDateString('pt-BR')}</div>
                                                        <div className="text-xs text-slate-500">{new Date(record.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>
                                                    </td>
                                                    <td className="p-3 text-sm">{record.name}</td>
                                                    <td className="p-3">
                                                        <span className="bg-sky-900/30 text-sky-300 px-2 py-0.5 rounded font-mono font-bold text-sm border border-sky-800/50">
                                                            {record.units} UI
                                                        </span>
                                                    </td>
                                                    <td className="p-3 pr-4 text-right">
                                                        <button onClick={(e) => handleDeleteRecordClick(e, record.id)} className="text-red-400 hover:text-red-300 p-1.5 hover:bg-slate-700 rounded transition-colors" title="Excluir registro">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'history' && (
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-200">Histórico Completo de Aplicações</h2>
                    <button onClick={handlePrintHistory} className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-md shadow-sm" title="Imprimir Histórico">
                        <PrinterIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-300">
                        <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold">
                            <tr>
                                <th className="p-4">Data / Hora</th>
                                <th className="p-4">Insulina</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Dose (UI)</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {sortedRecords.length > 0 ? (
                                sortedRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4">
                                            <div className="text-white">{new Date(record.date).toLocaleDateString('pt-BR')}</div>
                                            <div className="text-xs text-slate-500">{new Date(record.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="p-4 font-medium">{record.name}</td>
                                        <td className="p-4 text-sm">{record.type}</td>
                                        <td className="p-4">
                                            <span className="bg-sky-900/30 text-sky-300 px-2 py-1 rounded font-mono font-bold border border-sky-800/50">
                                                {record.units} UI
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={(e) => handleDeleteRecordClick(e, record.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-slate-700 rounded transition-colors">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">Histórico vazio.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
            title={deleteTarget?.type === 'schedule' ? "Excluir Insulina" : "Excluir Registro"}
            message={deleteTarget?.type === 'schedule' 
                ? "Tem certeza? Isso excluirá o agendamento, mas manterá o histórico." 
                : "Excluir este registro do histórico permanentemente?"
            }
            confirmText="Sim, excluir"
            cancelText="Cancelar"
        />
    </div>
  );
};
