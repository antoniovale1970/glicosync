
import React, { useState, useMemo } from 'react';
import type { GlucoseReading, Medication, Exam, Meal, CalendarEvent, Appointment, Contact } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { GlucoseIcon } from './icons/GlucoseIcon';
import { MedicationIcon } from './icons/MedicationIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { AppleIcon } from './icons/AppleIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ToggleSwitch } from './ToggleSwitch';
import { CalendarIcon } from './icons/CalendarIcon';
import { ClockIcon } from './icons/ClockIcon';


interface CalendarViewProps {
  glucoseReadings: GlucoseReading[];
  medications: Medication[];
  exams: Exam[];
  meals: Meal[];
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  contacts: Contact[];
}

const eventColors = {
  glucose: 'bg-sky-500',
  medication: 'bg-emerald-500',
  exam: 'bg-violet-500',
  meal: 'bg-orange-500',
  appointment: 'bg-rose-500',
};

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EventIcon = ({ type }: { type: CalendarEvent['type'] }) => {
    switch(type) {
        case 'glucose': return <GlucoseIcon className="w-5 h-5 text-sky-400" />;
        case 'medication': return <MedicationIcon className="w-5 h-5 text-emerald-400" />;
        case 'exam': return <TestTubeIcon className="w-5 h-5 text-violet-400" />;
        case 'meal': return <AppleIcon className="w-5 h-5 text-orange-400" />;
        case 'appointment': return <ClipboardIcon className="w-5 h-5 text-rose-400" />;
        default: return null;
    }
};

export const CalendarView: React.FC<CalendarViewProps> = ({ glucoseReadings, medications, exams, meals, appointments, setAppointments, contacts }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppt, setNewAppt] = useState({
      type: 'Consulta Médica' as Appointment['type'],
      title: '',
      date: new Date().toISOString().slice(0, 16),
      contactId: '',
      notes: '',
      reminderEnabled: true,
  });

  const medicalContacts = useMemo(() => contacts.filter(c => c.type === 'Médico'), [contacts]);

  // Helper para obter a chave de data (YYYY-MM-DD) baseada no horário LOCAL
  // Isso evita problemas onde toISOString() retorna o dia seguinte/anterior devido ao UTC
  const getLocalDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Logic for Monthly Calendar View ---
  const eventsByDate = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    glucoseReadings.forEach(r => {
        const d = new Date(r.date);
        allEvents.push({
            id: r.id,
            fullDate: d,
            date: getLocalDateKey(d),
            time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            description: `Glicemia: ${r.value} mg/dL`,
            type: 'glucose',
        });
    });
    
    medications.forEach(m => {
        if(m.reminderEnabled && m.reminderTimes) {
            m.reminderTimes.forEach(rt => {
                 allEvents.push({
                    id: `${m.id}-${rt.time}`,
                    fullDate: new Date(),
                    date: 'recurring',
                    time: rt.time,
                    description: `Lembrete: ${m.name} (${m.dosage})`,
                    type: 'medication'
                });
            });
        }
    });

    exams.forEach(e => {
        // Para exames, usamos a string de data original para garantir que caia no dia certo
        // Criamos uma data local fictícia apenas para ordenação
        const d = new Date(e.date + 'T00:00:00'); 
        allEvents.push({
            id: e.id,
            fullDate: d,
            date: e.date, // A data já está em YYYY-MM-DD
            time: '00:00',
            description: `Exame: ${e.name}`,
            type: 'exam',
        });
    });

    meals.forEach(ml => {
        const d = new Date(ml.date);
        allEvents.push({
            id: ml.id,
            fullDate: d,
            date: getLocalDateKey(d),
            time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            description: `${ml.type}: ${ml.description}`,
            type: 'meal',
        });
    });

    appointments.forEach(a => {
      const d = new Date(a.date);
      const contact = a.contactId ? contacts.find(c => c.id === a.contactId) : null;
      const contactInfo = contact ? ` com ${contact.name}` : '';
      allEvents.push({
          id: a.id,
          fullDate: d,
          date: getLocalDateKey(d),
          time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          description: `${a.title}${contactInfo}`,
          type: 'appointment',
      });
    });

    const grouped = new Map<string, CalendarEvent[]>();
    allEvents.forEach(event => {
        if (event.date !== 'recurring') {
           const dateKey = event.date;
           if (!grouped.has(dateKey)) grouped.set(dateKey, []);
           grouped.get(dateKey)!.push(event);
        }
    });
    
    const recurringMeds = allEvents.filter(e => e.date === 'recurring');
    if (recurringMeds.length > 0) {
        const tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        for(let i=0; i<31; i++) {
            const dateKey = getLocalDateKey(tempDate);
            if (!grouped.has(dateKey)) grouped.set(dateKey, []);
            
            recurringMeds.forEach(med => {
                // Re-find the med definition to check days
                const originalMedName = med.description.split('Lembrete: ')[1]?.split(' (')[0];
                const originalMed = medications.find(m => m.name === originalMedName);
                const reminderTime = originalMed?.reminderTimes?.find(rt => rt.time === med.time);
                
                const dayName = daysOfWeek[tempDate.getDay()];
                
                if (reminderTime && (!reminderTime.days || reminderTime.days.length === 0 || reminderTime.days.includes(dayName))) {
                     grouped.get(dateKey)!.push({...med, date: dateKey, id: `${med.id}-${dateKey}`});
                } else if (!originalMed) {
                    // Fallback for safety
                    grouped.get(dateKey)!.push({...med, date: dateKey, id: `${med.id}-${dateKey}`});
                }
            });
            tempDate.setDate(tempDate.getDate() + 1);
            if(tempDate.getMonth() !== currentDate.getMonth()) break;
        }
    }

    grouped.forEach((eventsOnDay) => {
        eventsOnDay.sort((a,b) => a.time.localeCompare(b.time));
    });

    return grouped;
  }, [glucoseReadings, medications, exams, meals, appointments, contacts, currentDate]);

  // --- Logic for Weekly Routine View ---
  const weeklyRoutine = useMemo(() => {
      const routine: Record<string, {time: string, title: string, detail: string, type: 'medication'}[]> = {};
      
      daysOfWeek.forEach(day => {
          routine[day] = [];
          medications.forEach(med => {
              if (med.reminderEnabled && med.reminderTimes) {
                  med.reminderTimes.forEach(rt => {
                      // If days is empty or undefined, it means every day. Or if it explicitly includes the day.
                      if (!rt.days || rt.days.length === 0 || rt.days.includes(day)) {
                          routine[day].push({
                              time: rt.time,
                              title: med.name,
                              detail: `${med.dosage} ${rt.note ? `(${rt.note})` : ''}`,
                              type: 'medication'
                          });
                      }
                  });
              }
          });
          routine[day].sort((a, b) => a.time.localeCompare(b.time));
      });
      return routine;
  }, [medications]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewAppt(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as Appointment['type'];
      let newTitle = newAppt.title;
      if (newType !== 'Outro' && newType !== 'Exercício') {
          newTitle = '';
      }
      setNewAppt(prev => ({...prev, type: newType, title: newTitle, contactId: ''}));
  };

  const resetForm = () => {
    setNewAppt({
      type: 'Consulta Médica',
      title: '',
      date: new Date().toISOString().slice(0, 16),
      contactId: '',
      notes: '',
      reminderEnabled: true,
  });
  };

  const handleOpenModal = (dateToUse?: Date) => {
      resetForm();
      
      if (dateToUse) {
        const now = new Date();
        const d = new Date(dateToUse);
        d.setHours(now.getHours(), now.getMinutes());
        const pad = (n: number) => n < 10 ? '0' + n : n;
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setNewAppt(prev => ({ ...prev, date: formatted }));
      }
      
      setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
      setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalTitle = newAppt.title;

    if (newAppt.type === 'Consulta Médica') {
        if (!newAppt.contactId) { alert("Por favor, selecione um médico."); return; }
        const contact = medicalContacts.find(c => c.id === newAppt.contactId);
        finalTitle = contact ? `Consulta com ${contact.name}` : 'Consulta Médica';
    } else if (newAppt.type === 'Exame Agendado' && !finalTitle) {
        alert("Por favor, preencha o nome do exame."); return;
    } else if (newAppt.type === 'Exercício' && !finalTitle) {
        alert("Por favor, descreva o exercício."); return;
    } else if (newAppt.type === 'Outro' && !finalTitle) {
        alert("Por favor, preencha o título do compromisso."); return;
    }

    const newAppointment: Appointment = {
        id: new Date().toISOString(),
        title: finalTitle,
        type: newAppt.type,
        date: newAppt.date,
        contactId: newAppt.contactId || undefined,
        notes: newAppt.notes,
        reminderEnabled: newAppt.reminderEnabled,
    };
    setAppointments(prev => [...prev, newAppointment]);
    handleCloseModal();
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDayOfWeek = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-slate-700"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateKey = getLocalDateKey(date);
    const isToday = getLocalDateKey(new Date()) === dateKey;
    const isSelected = getLocalDateKey(selectedDate) === dateKey;
    const eventsOnDay = eventsByDate.get(dateKey) || [];
    const eventTypesOnDay = new Set(eventsOnDay.map(e => e.type));
    const hasEvents = eventsOnDay.length > 0;

    calendarDays.push(
      <div
        key={day}
        className={`p-2 border-r border-b border-slate-700 cursor-pointer transition-colors ${isSelected ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
        onClick={() => setSelectedDate(date)}
        onDoubleClick={() => handleOpenModal(date)}
        title="Duplo clique para adicionar evento"
      >
        <div className={`
            flex items-center justify-center h-8 w-8 rounded-full text-sm text-slate-100 transition-all
            ${isToday ? 'bg-brand-blue font-bold shadow-md ring-2 ring-brand-blue-light' : (hasEvents ? 'bg-slate-700 font-bold border border-slate-600' : '')}
            ${isSelected && !isToday ? 'bg-slate-600 ring-1 ring-slate-500' : ''}
        `}>
          {day}
        </div>
        <div className="flex justify-center items-center mt-1 space-x-1 h-2">
            {Array.from(eventTypesOnDay).map((type: CalendarEvent['type']) => (
                <div key={type} className={`w-2 h-2 rounded-full ${eventColors[type]}`}></div>
            ))}
        </div>
      </div>
    );
  }

  const changeMonth = (amount: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + amount);
        return newDate;
    });
  };

  const selectedDateKey = getLocalDateKey(selectedDate);
  const selectedDayEvents = eventsByDate.get(selectedDateKey) || [];

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-slate-100">Agenda e Rotina</h1>
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button 
                    onClick={() => setViewMode('month')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-brand-blue text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <CalendarIcon className="w-4 h-4" /> Calendário
                </button>
                <button 
                    onClick={() => setViewMode('week')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-brand-blue text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ClockIcon className="w-4 h-4" /> Rotina Semanal
                </button>
            </div>
        </div>

        {viewMode === 'month' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700">
                <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                    <button
                        onClick={() => handleOpenModal(selectedDate)}
                        className="flex items-center justify-center bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Adicionar Compromisso
                    </button>
                </div>
                <div className="flex flex-1 justify-center items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-700">
                    <ChevronLeftIcon className="w-6 h-6 text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-100 text-center">
                    {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-700">
                    <ChevronRightIcon className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <div className="flex-1"></div>
                </div>
                <div className="grid grid-cols-7 text-center font-semibold text-sm text-slate-400 border-t border-r border-l border-slate-700">
                {daysOfWeek.map(day => (
                    <div key={day} className="py-2 border-b border-slate-700">{day}</div>
                ))}
                </div>
                <div className="grid grid-cols-7 min-h-[50vh] border-l border-slate-700">
                {calendarDays}
                </div>
            </div>
            
            <div className="bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-xl font-semibold text-slate-100">
                        Eventos para {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </h3>
                    <button 
                        onClick={() => handleOpenModal(selectedDate)}
                        className="text-sm bg-slate-700 hover:bg-slate-600 text-white py-2 px-3 rounded-md transition-colors flex items-center gap-2 border border-slate-600"
                        title={`Adicionar evento em ${selectedDate.toLocaleDateString()}`}
                    >
                        <PlusIcon className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-[300px]">
                    {selectedDayEvents.length > 0 ? (
                        selectedDayEvents.map(event => (
                            <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                <div className="flex-shrink-0 pt-1">
                                    <EventIcon type={event.type} />
                                </div>
                                <div>
                                    <p className="font-mono text-sm text-slate-400">{event.time}</p>
                                    <p className="font-medium text-slate-100">{event.description}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-400 py-6">Nenhum evento para este dia.</p>
                    )}
                </div>
            </div>
            </div>
        )}

        {viewMode === 'week' && (
            <div className="animate-fadeIn">
                <p className="text-slate-400 mb-4">Visualização da sua rotina semanal de medicamentos recorrentes.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    {daysOfWeek.map(day => (
                        <div key={day} className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col shadow-2xl shadow-black/50 h-full">
                            <div className="bg-slate-700 p-2 text-center font-bold text-slate-200 border-b border-slate-600">
                                {day}
                            </div>
                            <div className="p-2 space-y-2 flex-grow bg-slate-800/50 min-h-[150px]">
                                {weeklyRoutine[day].length > 0 ? (
                                    weeklyRoutine[day].map((item, idx) => (
                                        <div key={idx} className="bg-slate-700/50 border border-slate-600 p-2 rounded text-xs space-y-1 hover:bg-slate-700 transition-colors">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-sky-400 bg-sky-900/30 px-1 rounded">{item.time}</span>
                                                <MedicationIcon className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <p className="font-semibold text-slate-200 leading-tight">{item.title}</p>
                                            <p className="text-slate-400 italic leading-tight">{item.detail}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-slate-500 text-xs py-4">Sem lembretes</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-sm text-blue-200">
                    <p className="flex items-center gap-2">
                        <ClipboardIcon className="w-5 h-5" />
                        <strong>Nota:</strong> Esta visualização mostra apenas os lembretes recorrentes de medicamentos configurados para dias específicos da semana. Consultas e exames pontuais aparecem na visualização de Calendário.
                    </p>
                </div>
            </div>
        )}

        {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" onClick={handleCloseModal}>
            <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-100">Novo Compromisso</h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-200">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-400">Tipo</label>
                <select id="type" name="type" value={newAppt.type} onChange={handleTypeChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                    <option>Consulta Médica</option>
                    <option>Exercício</option>
                    <option>Exame Agendado</option>
                    <option>Outro</option>
                </select>
                </div>

                {newAppt.type === 'Consulta Médica' && (
                <div>
                    <label htmlFor="contactId" className="block text-sm font-medium text-slate-400">Médico</label>
                    <select id="contactId" name="contactId" value={newAppt.contactId} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                        <option value="">Selecione um médico...</option>
                        {medicalContacts.map(contact => (
                            <option key={contact.id} value={contact.id}>{contact.name} - {contact.specialty}</option>
                        ))}
                    </select>
                </div>
                )}

                {newAppt.type !== 'Consulta Médica' && (
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-400">Título</label>
                        <input type="text" id="title" name="title" value={newAppt.title} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" placeholder="Ex: Caminhada, Exame de Sangue..." required />
                    </div>
                )}

                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-400">Data e Hora</label>
                    <input type="datetime-local" id="date" name="date" value={newAppt.date} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-slate-400">Notas (Opcional)</label>
                    <textarea id="notes" name="notes" value={newAppt.notes} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" rows={3} />
                </div>

                <div className="flex items-center gap-3">
                    <ToggleSwitch enabled={!!newAppt.reminderEnabled} onChange={(val) => setNewAppt(prev => ({...prev, reminderEnabled: val}))} />
                    <span className="text-sm text-slate-300">Ativar lembrete</span>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-brand-blue hover:bg-brand-blue-light text-white px-4 py-2 rounded-lg font-bold shadow-md">Salvar</button>
                </div>
            </form>
            </div>
        </div>
        )}
    </div>
  );
};
