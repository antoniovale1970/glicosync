import React, { useState } from 'react';
import type { Medication, Reminder } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ToggleSwitch } from './ToggleSwitch';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ExportIcon } from './icons/ExportIcon';
import { PharmacyIcon } from './icons/PharmacyIcon';
import { generateContentWithGrounding } from '../services/geminiService';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MedicationsProps {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const Medications: React.FC<MedicationsProps> = ({ medications, setMedications }) => {
  // State for adding new medication
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<Reminder[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [newReminderNote, setNewReminderNote] = useState('');
  const [newReminderDays, setNewReminderDays] = useState<string[]>(daysOfWeek);


  // State for editing existing medication
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editNewReminderTime, setEditNewReminderTime] = useState('08:00');
  const [editNewReminderNote, setEditNewReminderNote] = useState('');
  const [editNewReminderDays, setEditNewReminderDays] = useState<string[]>(daysOfWeek);


  // State for pharmacy search modal
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [medicationToSearch, setMedicationToSearch] = useState<Medication | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{text: string; sources: any[]}>({ text: '', sources: [] });
  const [searchError, setSearchError] = useState('');


  const handleToggleDay = (day: string, currentDays: string[], setCurrentDays: React.Dispatch<React.SetStateAction<string[]>>) => {
    const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
    setCurrentDays(newDays);
  };


  const handleAddReminderTime = () => {
    if (newReminderTime && !reminderTimes.some(rt => rt.time === newReminderTime)) {
        if (newReminderDays.length === 0) {
            alert('Por favor, selecione pelo menos um dia da semana.');
            return;
        }
      setReminderTimes(prev => [...prev, { time: newReminderTime, note: newReminderNote, days: newReminderDays }].sort((a,b) => a.time.localeCompare(b.time)));
      setNewReminderNote('');
      setNewReminderDays(daysOfWeek);
    }
  };

  const handleRemoveReminderTime = (timeToRemove: string) => {
    setReminderTimes(prev => prev.filter(rt => rt.time !== timeToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !frequency) return;
    const newMedication: Medication = {
      id: new Date().toISOString(),
      name,
      dosage,
      frequency,
      reminderEnabled,
      reminderTimes: reminderEnabled ? reminderTimes : [],
    };
    setMedications([newMedication, ...medications]);
    setName('');
    setDosage('');
    setFrequency('');
    setReminderEnabled(false);
    setReminderTimes([]);
    setNewReminderTime('08:00');
    setNewReminderNote('');
    setNewReminderDays(daysOfWeek);
  };

  const handleDelete = (id: string) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const handleToggleReminder = (id: string) => {
    setMedications(meds => meds.map(med =>
      med.id === id ? { ...med, reminderEnabled: !med.reminderEnabled } : med
    ));
  };

  // --- Edit Handlers ---
  const handleEditStart = (med: Medication) => {
    setEditingMedication({ ...med });
    setEditNewReminderTime('08:00');
    setEditNewReminderNote('');
    setEditNewReminderDays(daysOfWeek);
  };
  
  const handleEditCancel = () => {
    setEditingMedication(null);
  };

  const handleEditSave = () => {
    if (!editingMedication) return;
    // Validate that all reminders have at least one day selected
    if (editingMedication.reminderEnabled) {
      const invalidReminders = (editingMedication.reminderTimes || []).filter(rt => !rt.days || rt.days.length === 0);
      if(invalidReminders.length > 0) {
        alert(`O lembrete para ${invalidReminders[0].time} precisa ter pelo menos um dia da semana selecionado.`);
        return;
      }
    }
    setMedications(meds => meds.map(m => (m.id === editingMedication.id ? editingMedication : m)));
    setEditingMedication(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingMedication) return;
    const { name, value } = e.target;
    setEditingMedication({ ...editingMedication, [name]: value });
  };
  
  const handleEditToggleReminderEnabled = (enabled: boolean) => {
    if (!editingMedication) return;
    setEditingMedication({ ...editingMedication, reminderEnabled: enabled });
  };

  const handleEditAddReminderTime = () => {
    if (!editingMedication || !editNewReminderTime) return;
    const currentTimes = editingMedication.reminderTimes || [];
     if (editNewReminderDays.length === 0) {
        alert('Por favor, selecione pelo menos um dia da semana.');
        return;
    }
    if (!currentTimes.some(rt => rt.time === editNewReminderTime)) {
      setEditingMedication({
        ...editingMedication,
        reminderTimes: [...currentTimes, { time: editNewReminderTime, note: editNewReminderNote, days: editNewReminderDays }].sort((a,b) => a.time.localeCompare(b.time)),
      });
      setEditNewReminderNote('');
      setEditNewReminderDays(daysOfWeek);
    }
  };

  const handleEditRemoveReminderTime = (timeToRemove: string) => {
     if (!editingMedication) return;
     const currentTimes = editingMedication.reminderTimes || [];
     setEditingMedication({
       ...editingMedication,
       reminderTimes: currentTimes.filter(rt => rt.time !== timeToRemove)
     });
  };

  const handleEditReminderNoteChange = (timeToUpdate: string, newNote: string) => {
    if (!editingMedication) return;
    const updatedTimes = (editingMedication.reminderTimes || []).map(rt => 
      rt.time === timeToUpdate ? { ...rt, note: newNote } : rt
    );
    setEditingMedication({ ...editingMedication, reminderTimes: updatedTimes });
  };
  
  const handleEditReminderDaysChange = (timeToUpdate: string, toggledDay: string) => {
    if (!editingMedication) return;
    const updatedTimes = (editingMedication.reminderTimes || []).map(rt => {
      if (rt.time === timeToUpdate) {
        const currentDays = rt.days || [];
        const newDays = currentDays.includes(toggledDay)
            ? currentDays.filter(d => d !== toggledDay)
            : [...currentDays, toggledDay];
        return { ...rt, days: newDays };
      }
      return rt;
    });
    setEditingMedication({ ...editingMedication, reminderTimes: updatedTimes });
  };


  // --- Search Handlers ---
  const handleOpenSearchModal = (med: Medication) => {
    setMedicationToSearch(med);
    setIsSearchModalOpen(true);
    setSearchLocation('');
    setSearchResults({ text: '', sources: [] });
    setSearchError('');
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
    setMedicationToSearch(null);
  };

  const handleSearchPharmacies = async () => {
    if (!medicationToSearch || !searchLocation) return;
    
    setSearchError('');

    // Regex to validate CEP format (XXXXXXXX or XXXXX-XXX)
    const cepRegex = /^\d{5}-?\d{3}$/;
    
    // Heuristic: If the input consists only of digits and hyphens, treat it as a CEP validation attempt.
    const isCepAttempt = /^[0-9-]+$/.test(searchLocation.trim());

    if (isCepAttempt && !cepRegex.test(searchLocation.trim())) {
      setSearchError('Formato de CEP inválido. Use XXXXX-XXX ou XXXXXXXX.');
      return;
    }

    setIsSearching(true);
    setSearchResults({ text: '', sources: [] });

    const prompt = `Liste farmácias e drogarias perto de "${searchLocation}" que vendem o medicamento "${medicationToSearch.name}". Para cada uma, inclua o nome da farmácia e o preço aproximado, se encontrar. Formate a resposta como uma lista em Markdown.`;

    const response = await generateContentWithGrounding(prompt);

    if (response) {
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((chunk: any) => chunk.web)
        .filter(Boolean)
        .filter((source: any, index: number, self: any[]) => 
            index === self.findIndex((s) => s.uri === source.uri)
        );
      setSearchResults({ text: response.text, sources });
    } else {
      setSearchResults({ text: 'Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.', sources: [] });
    }
    setIsSearching(false);
  };

  const handleExportCSV = () => {
    if (medications.length === 0) {
        alert("Não há dados de medicamentos para exportar.");
        return;
    }

    const headers = ['Nome', 'Dosagem', 'Frequência', 'Lembretes Ativados', 'Horários dos Lembretes'];
    const csvContent = '\uFEFF' + [
        headers.join(','),
        ...medications.map(med => {
            const name = `"${med.name.replace(/"/g, '""')}"`;
            const dosage = `"${med.dosage.replace(/"/g, '""')}"`;
            const frequency = `"${med.frequency.replace(/"/g, '""')}"`;
            const reminderEnabled = med.reminderEnabled ? 'Sim' : 'Não';
            const reminderTimes = `"${(med.reminderTimes || [])
                .map(rt => `${rt.time} (${formatDays(rt.days)})${rt.note ? ` - ${rt.note.replace(/"/g, '""')}` : ''}`)
                .join('; ')
            }"`;

            return [name, dosage, frequency, reminderEnabled, reminderTimes].join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "lista_medicamentos.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
  };
  
  const formatDays = (days?: string[]) => {
    if (!days || days.length === 0 || days.length === 7) return 'Diariamente';
    // Sort days according to week order
    return [...days].sort((a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)).join(', ');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Meus Medicamentos</h1>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Adicionar Medicamento</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="medName" className="block text-sm font-medium text-slate-400">Nome</label>
              <input
                id="medName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ex: Metformina"
                required
              />
            </div>
            <div>
              <label htmlFor="medDosage" className="block text-sm font-medium text-slate-400">Dosagem</label>
              <input
                id="medDosage"
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ex: 500mg"
                required
              />
            </div>
            <div>
              <label htmlFor="medFrequency" className="block text-sm font-medium text-slate-400">Frequência</label>
              <input
                id="medFrequency"
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ex: 2x ao dia"
                required
              />
            </div>
          </div>
          
          <div className="space-y-4 border-t border-slate-700 pt-4">
            <div className="flex items-center space-x-3">
                <ToggleSwitch enabled={reminderEnabled} onChange={setReminderEnabled} />
              <label htmlFor="addReminder" className="text-sm font-medium text-slate-300 select-none" onClick={() => setReminderEnabled(!reminderEnabled)}>
                Ativar lembretes
              </label>
            </div>
            {reminderEnabled && (
              <div className="pl-7 space-y-3">
                <label className="block text-sm font-medium text-slate-400">Horários do Lembrete</label>
                  <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                              <label htmlFor="reminderTime" className="text-xs text-slate-400">Horário</label>
                              <input
                                  id="reminderTime"
                                  type="time"
                                  value={newReminderTime}
                                  onChange={(e) => setNewReminderTime(e.target.value)}
                                  className="block w-full max-w-[150px] px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                              />
                          </div>
                          <div>
                              <label htmlFor="reminderNote" className="text-xs text-slate-400">Nota (Opcional)</label>
                              <input
                              id="reminderNote"
                              type="text"
                              value={newReminderNote}
                              onChange={(e) => setNewReminderNote(e.target.value)}
                              className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                              placeholder="Ex: Tomar com comida"
                              />
                          </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-slate-400 mb-1">Dias da Semana</label>
                        <div className="flex flex-wrap gap-1">
                          {daysOfWeek.map(day => (
                              <button
                                  type="button"
                                  key={day}
                                  onClick={() => handleToggleDay(day, newReminderDays, setNewReminderDays)}
                                  className={`px-3 py-1 text-xs rounded-md transition-colors font-semibold ${newReminderDays.includes(day) ? 'bg-sky-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}
                              >
                                  {day}
                              </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                          <button
                              type="button"
                              onClick={handleAddReminderTime}
                              className="bg-slate-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-slate-500 transition-colors text-sm"
                          >
                              Adicionar Horário
                          </button>
                      </div>
                  </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {reminderTimes.map(rt => (
                        <span key={rt.time} className="flex items-center gap-2 bg-sky-900/50 text-sky-200 text-sm font-medium pl-2.5 pr-1 py-1 rounded-full ring-1 ring-sky-500/30">
                            {rt.time} ({formatDays(rt.days)}) {rt.note && <em className="text-sky-300 text-xs">({rt.note})</em>}
                            <button
                                type="button"
                                onClick={() => handleRemoveReminderTime(rt.time)}
                                className="text-sky-300 hover:bg-sky-700 rounded-full h-4 w-4 flex items-center justify-center"
                                aria-label={`Remover horário ${rt.time}`}
                            >
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center justify-center bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm">
              <PlusIcon className="w-5 h-5 mr-2" />
              Adicionar
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-200">Lista de Medicamentos</h2>
            <button
                onClick={handleExportCSV}
                disabled={medications.length === 0}
                className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-3 rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:bg-slate-600 disabled:cursor-not-allowed text-sm"
            >
                <ExportIcon className="w-4 h-4 mr-2" />
                Exportar CSV
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-200">
            <thead className="border-b-2 border-slate-700">
              <tr>
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Dosagem</th>
                <th className="py-2 px-4">Frequência</th>
                <th className="py-2 px-4">Lembretes</th>
                <th className="py-2 px-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {medications.map(med => (
                <tr key={med.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                  <td className="py-3 px-4 font-semibold align-top">{med.name}</td>
                  <td className="py-3 px-4 align-top">{med.dosage}</td>
                  <td className="py-3 px-4 text-slate-300 align-top">{med.frequency}</td>
                  <td className="py-3 px-4 align-top">
                    {med.reminderTimes && med.reminderTimes.length > 0 ? (
                      <div className="flex items-start space-x-3">
                        <ToggleSwitch
                          enabled={!!med.reminderEnabled}
                          onChange={() => handleToggleReminder(med.id)}
                        />
                        {med.reminderEnabled && (
                          <div className="flex flex-wrap gap-2">
                            {(med.reminderTimes || []).map(rt => (
                                <div key={rt.time} className="bg-slate-700 p-2 rounded-lg text-sm w-full max-w-[250px] ring-1 ring-slate-600">
                                  <div className="font-mono font-bold text-slate-200">{rt.time}</div>
                                  <div className="text-xs text-sky-400 font-semibold mt-1">{formatDays(rt.days)}</div>
                                  {rt.note && <div className="text-xs italic text-slate-400 mt-1 border-t border-slate-600 pt-1">Nota: {rt.note}</div>}
                                </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-sm">Não definido</span>
                    )}
                  </td>
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleOpenSearchModal(med)} className="text-green-500 hover:text-green-400 p-1" disabled={!!editingMedication} title="Buscar farmácias">
                          <PharmacyIcon className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleEditStart(med)} className="text-sky-400 hover:text-sky-300 p-1" disabled={!!editingMedication} title="Editar">
                        <EditIcon className="w-5 h-5"/>
                      </button>
                      <button onClick={() => handleDelete(med.id)} className="text-red-500 hover:text-red-400 p-1" disabled={!!editingMedication} title="Excluir">
                        <TrashIcon className="w-5 h-5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {medications.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum medicamento cadastrado.</p>}
        </div>
      </div>

      {editingMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={handleEditCancel}>
          <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }} className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-bold text-slate-100">Editar Medicamento</h3>
                <button type="button" onClick={handleEditCancel} className="text-slate-400 hover:text-slate-200">
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400">Nome</label>
                  <input name="name" value={editingMedication.name} onChange={handleEditChange} className="mt-1 w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-slate-100"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400">Dosagem</label>
                  <input name="dosage" value={editingMedication.dosage} onChange={handleEditChange} className="mt-1 w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-slate-100"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400">Frequência</label>
                  <input name="frequency" value={editingMedication.frequency} onChange={handleEditChange} className="mt-1 w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-slate-100"/>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-700 pt-4">
                <div className="flex items-center space-x-3">
                  <ToggleSwitch enabled={!!editingMedication.reminderEnabled} onChange={handleEditToggleReminderEnabled} />
                  <span className="text-sm font-medium text-slate-300 select-none">Ativar lembretes</span>
                </div>
                {editingMedication.reminderEnabled && (
                  <div className="pl-7 space-y-3">
                    <label className="block text-sm font-medium text-slate-400">Horários do Lembrete</label>
                    {(editingMedication.reminderTimes || []).map(rt => (
                      <div key={rt.time} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 space-y-2">
                          <div className="flex items-center gap-2">
                              <span className="font-mono text-base p-1 font-semibold">{rt.time}</span>
                              <input type="text" value={rt.note || ''} onChange={(e) => handleEditReminderNoteChange(rt.time, e.target.value)} placeholder="Nota (ex: com comida)" className="flex-grow p-1.5 border rounded-md text-sm bg-slate-700 border-slate-600 text-slate-100"/>
                              <button type="button" onClick={() => handleEditRemoveReminderTime(rt.time)} className="text-red-500 hover:text-red-400 p-1" aria-label={`Remover lembrete de ${rt.time}`}><TrashIcon className="w-5 h-5"/></button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                              {daysOfWeek.map(day => (
                                  <button
                                      type="button"
                                      key={day}
                                      onClick={() => handleEditReminderDaysChange(rt.time, day)}
                                      className={`px-3 py-1 text-xs rounded-md transition-colors font-semibold ${(rt.days || []).includes(day) ? 'bg-sky-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}
                                  >
                                      {day}
                                  </button>
                              ))}
                          </div>
                      </div>
                    ))}
                    <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-slate-400">Novo Horário</label>
                          <input type="time" value={editNewReminderTime} onChange={e => setEditNewReminderTime(e.target.value)} className="mt-1 block w-full max-w-[150px] px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100"/>
                        </div>
                        <div>
                           <label className="text-xs text-slate-400">Nova Nota (Opcional)</label>
                           <input type="text" value={editNewReminderNote} onChange={e => setEditNewReminderNote(e.target.value)} placeholder="Nova nota..." className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100"/>
                        </div>
                      </div>
                       <div className="mt-2">
                          <label className="block text-xs text-slate-400 mb-1">Dias da Semana</label>
                          <div className="flex flex-wrap gap-1">
                              {daysOfWeek.map(day => (
                                  <button
                                      type="button"
                                      key={day}
                                      onClick={() => handleToggleDay(day, editNewReminderDays, setEditNewReminderDays)}
                                      className={`px-3 py-1 text-xs rounded-md transition-colors font-semibold ${editNewReminderDays.includes(day) ? 'bg-sky-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'}`}
                                  >
                                      {day}
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div className="flex justify-end mt-2">
                         <button type="button" onClick={handleEditAddReminderTime} className="bg-slate-600 text-white p-2 rounded-md text-sm hover:bg-slate-500 px-3">Adicionar Horário</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-700">
                <button type="button" onClick={handleEditCancel} className="bg-slate-600 text-slate-100 font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSearchModalOpen && medicationToSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={handleCloseSearchModal}>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl space-y-4 transform transition-all ring-1 ring-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-slate-100">Buscar Farmácias para <span className="text-sky-400">{medicationToSearch.name}</span></h3>
                    <button onClick={handleCloseSearchModal} className="text-slate-400 hover:text-slate-200">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label htmlFor="searchLocation" className="block text-sm font-medium text-slate-400">Sua localização (Cidade, Estado ou CEP)</label>
                        <input
                            id="searchLocation"
                            type="text"
                            value={searchLocation}
                            onChange={(e) => {
                                setSearchLocation(e.target.value);
                                if (searchError) setSearchError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchPharmacies()}
                            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Ex: São Paulo, SP ou 01000-000"
                        />
                         {searchError && <p className="text-red-500 text-sm mt-1">{searchError}</p>}
                    </div>
                    <button onClick={handleSearchPharmacies} disabled={isSearching || !searchLocation} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm disabled:bg-slate-600 flex items-center justify-center h-[42px]">
                        {isSearching ? <Spinner size="sm" /> : "Buscar"}
                    </button>
                </div>
                
                <div className="mt-4 p-4 border border-slate-700 rounded-lg bg-slate-900 min-h-[200px] max-h-[40vh] overflow-y-auto">
                    {isSearching ? (
                        <div className="flex justify-center items-center h-full">
                            <Spinner size="lg" color="sky" />
                        </div>
                    ) : (
                        searchResults.text ? (
                            <div>
                                <MarkdownRenderer content={searchResults.text} />
                                {searchResults.sources.length > 0 && (
                                    <div className="mt-6 pt-3 border-t border-slate-600">
                                        <h4 className="font-semibold text-sm text-slate-400">Fontes da Pesquisa:</h4>
                                        <ul className="list-disc pl-5 text-sm mt-1 space-y-1">
                                            {searchResults.sources.map((source, index) => (
                                                <li key={index}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline break-all">
                                                        {source.title || source.uri}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 pt-10">Digite sua localização para buscar farmácias e preços.</p>
                        )
                    )}
                </div>

            </div>
        </div>
      )}
    </div>
  );
};