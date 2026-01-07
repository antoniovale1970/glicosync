
import React, { useState, useMemo } from 'react';
import type { Medication, Reminder } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ToggleSwitch } from './ToggleSwitch';
import { EditIcon } from './icons/EditIcon';
import { CloseIcon } from './icons/CloseIcon';
import { PharmacyCrossIcon } from './icons/PharmacyCrossIcon';
import { BookIcon } from './icons/BookIcon';
import { LeafletModal } from './LeafletModal';
import { PharmacyModal } from './PharmacyModal';
import { CameraIcon } from './icons/CameraIcon';
import { MedicationIcon } from './icons/MedicationIcon';
import { ClockIcon } from './icons/ClockIcon';
import { generateContent } from '../services/geminiService';
import { Spinner } from './Spinner';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ConfirmModal } from './ConfirmModal';
import { CalendarIcon } from './icons/CalendarIcon';
import { CheckIcon } from './icons/CheckIcon';

interface MedicationsProps {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const weekendDays = ['Dom', 'Sáb'];

export const Medications: React.FC<MedicationsProps> = ({ medications, setMedications }) => {
  // State for adding new medication
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [photo, setPhoto] = useState('');
  const [leaflet, setLeaflet] = useState('');
  const [isGeneratingLeaflet, setIsGeneratingLeaflet] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<Reminder[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderNote, setNewReminderNote] = useState('');
  const [newReminderDays, setNewReminderDays] = useState<string[]>(daysOfWeek);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // State for editing existing medication
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  // Derived state for editing ID to be used in JSX
  const editingId = editingMedication?.id;
  const [editNewReminderTime, setEditNewReminderTime] = useState('08:00');
  const [editNewReminderNote, setEditNewReminderNote] = useState('');
  const [editNewReminderDays, setEditNewReminderDays] = useState<string[]>(daysOfWeek);
  const [isEditingLeafletGenerating, setIsEditingLeafletGenerating] = useState(false);

  // Modal States
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [medicationToSearch, setMedicationToSearch] = useState<Medication | null>(null);
  const [leafletMedication, setLeafletMedication] = useState<Medication | null>(null);
  const [viewingMedication, setViewingMedication] = useState<Medication | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtered Medications Logic
  const filteredMedications = useMemo(() => {
    return medications.filter(med => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medications, searchTerm]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("A imagem é muito grande (Máx: 4MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingMedication) {
        if (file.size > 4 * 1024 * 1024) {
            alert("A imagem é muito grande (Máx: 4MB).");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setEditingMedication({ ...editingMedication, photo: reader.result as string });
        reader.readAsDataURL(file);
    }
  };

  const handleGenerateLeaflet = async (isEdit: boolean = false) => {
    const targetName = isEdit ? editingMedication?.name : name;
    if (!targetName) { alert("Digite o nome do medicamento primeiro."); return; }

    if (isEdit) setIsEditingLeafletGenerating(true);
    else setIsGeneratingLeaflet(true);

    const prompt = `Gere um resumo conciso da bula para: "${targetName}". Inclua: Para que serve, como usar e efeitos colaterais.`;

    try {
        const result = await generateContent(prompt);
        if (isEdit && editingMedication) setEditingMedication({ ...editingMedication, leaflet: result });
        else setLeaflet(result);
    } catch (error) {
        alert("Erro ao conectar com a IA.");
    } finally {
        if (isEdit) setIsEditingLeafletGenerating(false);
        else setIsGeneratingLeaflet(false);
    }
  };

  const handleToggleDay = (day: string, currentDays: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // Fixed: Added handleRemoveReminderTime function to fix line 302 error
  const handleRemoveReminderTime = (timeToRemove: string) => {
    setReminderTimes(prev => prev.filter(rt => rt.time !== timeToRemove));
  };

  const handleAddReminderTime = () => {
    if (newReminderTime && !reminderTimes.some(rt => rt.time === newReminderTime)) {
        if (newReminderDays.length === 0) { alert('Selecione pelo menos um dia.'); return; }
        setReminderTimes(prev => [...prev, { time: newReminderTime, note: newReminderNote, days: newReminderDays }].sort((a,b) => a.time.localeCompare(b.time)));
        setNewReminderNote('');
        setNewReminderDays(daysOfWeek);
    }
  };

  // Fixed: handleEditStart function implemented to fix line 426 error
  const handleEditStart = (med: Medication) => {
    setEditingMedication(med);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setPhoto(med.photo || '');
    setLeaflet(med.leaflet || '');
    setReminderEnabled(!!med.reminderEnabled);
    setReminderTimes(med.reminderTimes || []);
    
    // Scroll to the edit form at the top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fixed: handleSubmit now handles updates when editingMedication is present
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !frequency) return;
    const medData: Medication = {
      id: editingId || new Date().toISOString(),
      name, dosage, frequency,
      photo: photo || undefined,
      leaflet: leaflet || undefined,
      reminderEnabled,
      reminderTimes: reminderEnabled ? reminderTimes : [],
    };

    if (editingId) {
        setMedications(prev => prev.map(m => m.id === editingId ? medData : m));
    } else {
        setMedications([medData, ...medications]);
    }
    resetForm();
  };

  // Fixed: resetForm now clears the editing state correctly
  const resetForm = () => {
    setName(''); setDosage(''); setFrequency(''); setPhoto(''); setLeaflet('');
    setReminderEnabled(false); setReminderTimes([]); setNewReminderTime('08:00');
    setNewReminderNote(''); setNewReminderDays(daysOfWeek);
    setEditingMedication(null);
  };

  const confirmDelete = () => {
    if (deleteId) {
        setMedications(prev => prev.filter(m => m.id !== deleteId));
        setViewingMedication(null);
        setDeleteId(null);
    }
  };

  const formatDays = (days?: string[]) => {
    if (!days || days.length === 0) return 'Nenhum dia';
    if (days.length === 7) return 'Diariamente';
    if (days.length === 5 && weekDays.every(d => days.includes(d))) return 'Seg a Sex';
    return days.sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)).join(', ');
  };

  // Day Selector UI Helper
  const DaySelector = ({ selectedDays, onToggle, onSelectAll, onSelectWeekdays, onSelectWeekend }: { 
    selectedDays: string[], 
    onToggle: (day: string) => void,
    onSelectAll: () => void,
    onSelectWeekdays: () => void,
    onSelectWeekend: () => void
  }) => (
    <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
            {daysOfWeek.map(day => (
                <button
                    type="button"
                    key={day}
                    onClick={() => onToggle(day)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                        selectedDays.includes(day) 
                        ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' 
                        : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                    {day.substring(0, 1)}
                </button>
            ))}
        </div>
        <div className="flex gap-2">
            <button type="button" onClick={onSelectAll} className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600 transition-colors">Todos</button>
            <button type="button" onClick={onSelectWeekdays} className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600 transition-colors">Dias Úteis</button>
            <button type="button" onClick={onSelectWeekend} className="text-[10px] uppercase font-bold px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600 transition-colors">Fim de Semana</button>
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Meus Medicamentos</h1>
      
      {/* FORMULÁRIO DE CADASTRO */}
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl ring-1 ring-slate-700 border-l-4 border-brand-blue overflow-hidden">
        <h2 className="text-xl font-bold mb-6 text-slate-100 flex items-center gap-2">
            {editingId ? <EditIcon className="w-5 h-5 text-yellow-400" /> : <PlusIcon className="w-5 h-5 text-brand-blue-light" />} 
            {editingId ? 'Editar Medicamento' : 'Adicionar Medicamento'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Foto */}
            <div className="flex-shrink-0">
               <div className="relative w-32 h-32 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-sky-500/50 transition-all">
                  {photo ? (
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                      <>
                        <CameraIcon className="w-8 h-8 text-slate-600 group-hover:text-sky-500 transition-colors mb-2" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Foto</span>
                      </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
               </div>
            </div>

            {/* Dados Básicos */}
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nome do Medicamento</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 transition-all outline-none" placeholder="Ex: Metformina, Januvia..."/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Dosagem</label>
                    <input required type="text" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 transition-all outline-none" placeholder="Ex: 500mg, 5ml..."/>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Frequência</label>
                    <input required type="text" value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-sky-500 transition-all outline-none" placeholder="Ex: 2x ao dia, 8h/8h..."/>
                </div>
            </div>
          </div>

          {/* Programação de Horários */}
          <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-sky-500/10 p-2 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-tight">Programação de Uso</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Defina quando tomar e receba alertas</p>
                    </div>
                </div>
                <ToggleSwitch enabled={reminderEnabled} onChange={setReminderEnabled} />
            </div>

            {reminderEnabled && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">1. Selecione o Horário</label>
                                <input type="time" value={newReminderTime} onChange={e => setNewReminderTime(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xl font-bold text-sky-400 outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-auto"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">2. Nota (Opcional)</label>
                                <input type="text" value={newReminderNote} onChange={e => setNewReminderNote(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-sky-500" placeholder="Ex: Tomar após o almoço"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">3. Escolha os Dias</label>
                            <DaySelector 
                                selectedDays={newReminderDays}
                                onToggle={(d) => handleToggleDay(d, newReminderDays, setNewReminderDays)}
                                onSelectAll={() => setNewReminderDays(daysOfWeek)}
                                onSelectWeekdays={() => setNewReminderDays(weekDays)}
                                onSelectWeekend={() => setNewReminderDays(weekendDays)}
                            />
                            <div className="mt-6 flex justify-end">
                                <button type="button" onClick={handleAddReminderTime} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-sky-600/20 active:scale-95">
                                    Adicionar Horário
                                </button>
                            </div>
                        </div>
                    </div>

                    {reminderTimes.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                            {reminderTimes.map((rt, idx) => (
                                <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-4 shadow-sm group hover:border-sky-500/30 transition-all">
                                    <div className="bg-sky-500/10 p-2 rounded-lg">
                                        <ClockIcon className="w-4 h-4 text-sky-400" />
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-white leading-none">{rt.time}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{formatDays(rt.days)}</p>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveReminderTime(rt.time)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
          </div>

          <div className="flex justify-end pt-2 gap-3">
            {editingId && (
                <button type="button" onClick={resetForm} className="bg-slate-600 hover:bg-slate-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-xl active:scale-95 uppercase text-xs tracking-widest">
                    Cancelar
                </button>
            )}
            <button type="submit" className={`bg-brand-blue hover:bg-brand-blue-light text-white font-black py-4 px-10 rounded-2xl transition-all shadow-xl hover:shadow-brand-blue/20 active:scale-95 uppercase text-xs tracking-[0.2em] flex items-center gap-3 ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}>
                {editingId ? <SaveIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />} 
                {editingId ? 'Salvar Alterações' : 'Salvar Medicamento'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE MEDICAMENTOS */}
      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-white">Medicamentos Cadastrados</h2>
            <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 outline-none"/>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
              <tr>
                <th className="p-4">Medicamento</th>
                <th className="p-4">Dosagem / Frequência</th>
                <th className="p-4">Programação</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredMedications.map(med => (
                <tr key={med.id} onClick={() => setViewingMedication(med)} className="hover:bg-slate-700/20 transition-colors cursor-pointer group">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                            {med.photo ? <img src={med.photo} className="w-full h-full object-cover"/> : <MedicationIcon className="w-6 h-6 text-slate-600" />}
                        </div>
                        <div>
                            <p className="font-bold text-white group-hover:text-sky-400 transition-colors">{med.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">ID: {med.id.substring(0, 8)}</p>
                        </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-200">{med.dosage}</p>
                    <p className="text-xs text-slate-500 mt-1">{med.frequency}</p>
                  </td>
                  <td className="p-4">
                    {med.reminderEnabled && med.reminderTimes && med.reminderTimes.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {med.reminderTimes.slice(0, 2).map((rt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs font-black text-sky-400 font-mono">{rt.time}</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{formatDays(rt.days)}</span>
                                </div>
                            ))}
                            {med.reminderTimes.length > 2 && <span className="text-[9px] text-slate-600 font-bold">+ {med.reminderTimes.length - 2} horários</span>}
                        </div>
                    ) : <span className="text-xs text-slate-600 italic">Sem lembretes</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-slate-500 hover:text-sky-400 rounded-lg transition-colors"><ChevronRightIcon className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALHES */}
      {viewingMedication && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewingMedication(null)}>
            <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-5/12 bg-slate-800 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-700/50">
                    <div className="w-48 h-48 rounded-3xl bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-2xl mb-6 flex items-center justify-center">
                        {viewingMedication.photo ? <img src={viewingMedication.photo} className="w-full h-full object-cover"/> : <MedicationIcon className="w-20 h-20 text-slate-700" />}
                    </div>
                    <h3 className="text-3xl font-black text-white text-center leading-tight mb-2">{viewingMedication.name}</h3>
                    <span className="bg-sky-500/10 text-sky-400 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest border border-sky-500/20">{viewingMedication.dosage}</span>
                </div>
                
                <div className="flex-grow p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-6 h-6 text-slate-500" />
                            <h4 className="text-xl font-bold text-slate-200">Programação de Uso</h4>
                        </div>
                        <button onClick={() => setViewingMedication(null)} className="text-slate-500 hover:text-white transition-colors"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    <div className="flex-grow space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                        {viewingMedication.reminderEnabled && viewingMedication.reminderTimes && viewingMedication.reminderTimes.length > 0 ? (
                            viewingMedication.reminderTimes.map((rt, i) => (
                                <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center group hover:border-sky-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="text-3xl font-black text-sky-400 font-mono">{rt.time}</div>
                                        <div>
                                            <div className="flex gap-1 mb-1">
                                                {daysOfWeek.map(d => (
                                                    <span key={d} className={`text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full ${rt.days?.includes(d) ? 'bg-sky-500 text-white' : 'bg-slate-700 text-slate-600'}`}>{d.substring(0, 1)}</span>
                                                ))}
                                            </div>
                                            {rt.note && <p className="text-xs text-slate-400 italic">"{rt.note}"</p>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-10 italic">Nenhum alerta configurado.</p>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex gap-3">
                        <button onClick={() => { setViewingMedication(null); handleEditStart(viewingMedication!); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl border border-slate-700 transition-all active:scale-95">Editar Dados</button>
                        <button onClick={() => setDeleteId(viewingMedication!.id)} className="px-5 bg-red-600/10 hover:bg-red-600/20 text-red-500 py-3 rounded-xl border border-red-500/20 transition-all active:scale-95"><TrashIcon className="w-6 h-6" /></button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modais Complementares */}
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Remover Medicamento" message="Tem certeza? Todos os horários e fotos deste medicamento serão excluídos permanentemente." />
      {leafletMedication && <LeafletModal medication={leafletMedication} onClose={() => setLeafletMedication(null)} />}
      {isSearchModalOpen && medicationToSearch && <PharmacyModal medication={medicationToSearch} onClose={() => setIsSearchModalOpen(false)} />}
    </div>
  );
};
