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

  const handleContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    const contact = medicalContacts.find(c => c.id === contactId);
    setNewAppt(prev => ({
        ...prev,
        contactId,
        title: contact ? `Consulta com ${contact.name}` : prev.title
    }));
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

  const handleOpenModal = () => {
      resetForm();
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


  const eventsByDate = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    glucoseReadings.forEach(r => {
        const d = new Date(r.date);
        allEvents.push({
            id: r.id,
            fullDate: d,
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().slice(0,5),
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
        const d = new Date(e.date);
        const adjustedDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
        allEvents.push({
            id: e.id,
            fullDate: adjustedDate,
            date: adjustedDate.toISOString().split('T')[0],
            time: '00:00',
            description: `Exame Registrado: ${e.name}`,
            type: 'exam',
        });
    });

    meals.forEach(ml => {
        const d = new Date(ml.date);
        allEvents.push({
            id: ml.id,
            fullDate: d,
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().slice(0,5),
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
          date: d.toISOString().split('T')[0],
          time: d.toTimeString().slice(0, 5),
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
            const dateKey = tempDate.toISOString().split('T')[0];
            if (!grouped.has(dateKey)) grouped.set(dateKey, []);
            recurringMeds.forEach(med => {
                grouped.get(dateKey)!.push({...med, date: dateKey, id: `${med.id}-${dateKey}`});
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
    const dateKey = date.toISOString().split('T')[0];
    const isToday = new Date().toISOString().split('T')[0] === dateKey;
    const isSelected = selectedDate.toISOString().split('T')[0] === dateKey;
    const eventsOnDay = eventsByDate.get(dateKey) || [];
    const eventTypesOnDay = new Set(eventsOnDay.map(e => e.type));

    calendarDays.push(
      <div
        key={day}
        className={`p-2 border-r border-b border-slate-700 cursor-pointer transition-colors ${isSelected ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
        onClick={() => setSelectedDate(date)}
      >
        <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm text-slate-100 ${isToday ? 'bg-brand-blue' : ''} ${isSelected ? 'ring-2 ring-brand-blue-light' : ''}`}>
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

  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDayEvents = eventsByDate.get(selectedDateKey) || [];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1">
             <button
                onClick={handleOpenModal}
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
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-2 border-b border-slate-700">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[50vh] border-l border-slate-700">
          {calendarDays}
        </div>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
         <h3 className="text-xl font-semibold text-slate-100 mb-4">
            Eventos para {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
         </h3>
         <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
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
                <select id="contactId" name="contactId" value={newAppt.contactId} onChange={handleContactChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" required>
                  <option value="">Selecione um médico...</option>
                  {medicalContacts.map(c => <option key={c.id} value={c.id}>{c.name} - {c.specialty}</option>)}
                </select>
              </div>
            )}

            {(newAppt.type !== 'Consulta Médica') && (
              <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-400">Título / Descrição</label>
                  <input id="title" name="title" type="text" value={newAppt.title} onChange={handleInputChange} placeholder={newAppt.type === 'Exercício' ? 'Ex: Caminhada de 30 min' : 'Nome do compromisso'} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
              </div>
            )}

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-400">Data e Hora</label>
              <input id="date" name="date" type="datetime-local" value={newAppt.date} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" required />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-400">Notas (Opcional)</label>
              <textarea id="notes" name="notes" value={newAppt.notes} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500" placeholder="Ex: Levar resultados dos últimos exames"></textarea>
            </div>
            
            <div className="flex items-center space-x-3 pt-2">
              <label htmlFor="reminderEnabled" className="text-sm font-medium text-slate-300 select-none">Ativar lembrete</label>
              <ToggleSwitch enabled={newAppt.reminderEnabled} onChange={(enabled) => setNewAppt(p => ({...p, reminderEnabled: enabled}))} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleCloseModal} className="bg-slate-600 text-slate-100 font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
              <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm">Salvar Compromisso</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};