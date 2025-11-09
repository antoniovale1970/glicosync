import React, { useState, useMemo } from 'react';
import type { Exam, Contact } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExamChart } from './ExamChart';
import { ToggleSwitch } from './ToggleSwitch';

interface ExamsProps {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  contacts: Contact[];
}

const examOptions = [
  'Hemoglobina Glicada',
  'Hemograma Completo',
  'Colesterol Total',
  'Colesterol HDL/LDL',
  'Glicemia de Jejum',
  'Outro'
];

export const Exams: React.FC<ExamsProps> = ({ exams, setExams, contacts }) => {
  const [examType, setExamType] = useState(examOptions[0]);
  const [customName, setCustomName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState('');
  const [unit, setUnit] = useState('');
  const [laboratoryId, setLaboratoryId] = useState('');
  
  // Reminder State
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<'daysBefore' | 'specificDate'>('daysBefore');
  const [reminderValue, setReminderValue] = useState<string>('3');

  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const laboratories = useMemo(() => {
    return contacts.filter(c => c.type === 'Laboratório');
  }, [contacts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = examType === 'Outro' ? customName : examType;
    if (!finalName || !date || !result) return;
    
    const newExam: Exam = {
      id: new Date().toISOString(),
      name: finalName,
      date,
      result,
      unit,
      reminderEnabled,
      reminderConfig: reminderEnabled ? {
          type: reminderType,
          value: reminderType === 'daysBefore' ? parseInt(reminderValue, 10) || 1 : reminderValue,
      } : undefined,
      laboratoryId: laboratoryId || undefined,
      completed: false,
    };
    
    setExams([newExam, ...exams].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Reset form
    setExamType(examOptions[0]);
    setCustomName('');
    setDate(new Date().toISOString().split('T')[0]);
    setResult('');
    setUnit('');
    setReminderEnabled(false);
    setLaboratoryId('');
    setReminderType('daysBefore');
    setReminderValue('3');
  };

  const handleDelete = (id: string) => {
    setExams(exams.filter(e => e.id !== id));
  };

  const handleToggleCompleted = (id: string) => {
    setExams(
      exams.map(exam =>
        exam.id === id ? { ...exam, completed: !exam.completed } : exam
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const timeZoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + timeZoneOffset);
    return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
  }
  
  const formatReminder = (exam: Exam) => {
    if (!exam.reminderEnabled) {
      return <span className="text-slate-500 italic">Desativado</span>;
    }
    if (exam.reminderConfig) {
      if (exam.reminderConfig.type === 'daysBefore') {
        const days = exam.reminderConfig.value;
        const plural = Number(days) > 1 ? 's' : '';
        return `Ativado (${days} dia${plural} antes)`;
      }
      if (exam.reminderConfig.type === 'specificDate') {
        return `Ativado (em ${formatDate(exam.reminderConfig.value as string)})`;
      }
    }
    return 'Ativado (No dia)'; // Fallback for old data
  };


  const hba1cExams = useMemo(() => {
    return exams
        .filter(exam => exam.name.toLowerCase().includes('hemoglobina glicada'))
        .filter(exam => !isNaN(parseFloat(exam.result))) // Garante que o resultado é um número
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-5); // Pega os últimos 5 exames
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const nameMatch = exam.name.toLowerCase().includes(nameFilter.toLowerCase());
      const dateMatch = dateFilter ? exam.date === dateFilter : true;
      return nameMatch && dateMatch;
    });
  }, [exams, nameFilter, dateFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Meus Exames</h1>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Adicionar Exame</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="examType" className="block text-sm font-medium text-slate-400">Tipo de Exame</label>
              <select
                id="examType"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              >
                {examOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            {examType === 'Outro' && (
              <div>
                <label htmlFor="customExamName" className="block text-sm font-medium text-slate-400">Nome do Exame Personalizado</label>
                <input
                  id="customExamName"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Ex: Creatinina"
                  required
                />
              </div>
            )}
            
            <div className={examType === 'Outro' ? '' : 'md:col-start-2 md:row-start-1'}>
                <label htmlFor="examDate" className="block text-sm font-medium text-slate-400">Data</label>
                <input
                id="examDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                required
                />
            </div>
            
            <div>
              <label htmlFor="examUnit" className="block text-sm font-medium text-slate-400">Unidade (Opcional)</label>
              <input
                id="examUnit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ex: %, mg/dL"
              />
            </div>

            <div>
                <label htmlFor="laboratoryId" className="block text-sm font-medium text-slate-400">Local do Exame (Opcional)</label>
                <select
                  id="laboratoryId"
                  value={laboratoryId}
                  onChange={(e) => setLaboratoryId(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Selecione um laboratório</option>
                  {laboratories.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Laboratórios podem ser cadastrados na tela de Contatos.</p>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="examResult" className="block text-sm font-medium text-slate-400">Resultado</label>
              <textarea
                id="examResult"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ex: 5.7 ou HDL: 50, LDL: 120"
                rows={2}
                required
              />
            </div>
            
            <div className="md:col-span-2 space-y-4 border-t border-slate-700 pt-4">
              <div className="flex items-center space-x-3">
                <ToggleSwitch enabled={reminderEnabled} onChange={setReminderEnabled}/>
                <label className="text-sm font-medium text-slate-300 select-none" onClick={() => setReminderEnabled(!reminderEnabled)}>
                    Ativar lembrete para este exame
                </label>
              </div>

              {reminderEnabled && (
                  <div className="pl-8 space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <input type="radio" id="daysBefore" name="reminderType" value="daysBefore" checked={reminderType === 'daysBefore'} onChange={() => setReminderType('daysBefore')} className="h-4 w-4 text-sky-600 bg-slate-600 border-slate-500 focus:ring-sky-500" />
                          <label htmlFor="daysBefore" className="ml-2 text-sm font-medium text-slate-300">Lembrar</label>
                        </div>
                        <input
                          type="number"
                          value={reminderType === 'daysBefore' ? reminderValue : ''}
                          onChange={(e) => setReminderValue(e.target.value)}
                          disabled={reminderType !== 'daysBefore'}
                          className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-800 disabled:text-slate-500"
                        />
                        <span className={`text-sm text-slate-300 ${reminderType !== 'daysBefore' ? 'text-slate-500' : ''}`}>dias antes</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                            <input type="radio" id="specificDate" name="reminderType" value="specificDate" checked={reminderType === 'specificDate'} onChange={() => setReminderType('specificDate')} className="h-4 w-4 text-sky-600 bg-slate-600 border-slate-500 focus:ring-sky-500"/>
                            <label htmlFor="specificDate" className="ml-2 text-sm font-medium text-slate-300">Lembrar em</label>
                        </div>
                        <input
                          type="date"
                          value={reminderType === 'specificDate' ? reminderValue : ''}
                          onChange={(e) => setReminderValue(e.target.value)}
                          disabled={reminderType !== 'specificDate'}
                          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-800 disabled:text-slate-500"
                        />
                      </div>
                  </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="flex items-center justify-center bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm mt-2">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Adicionar
                </button>
            </div>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Últimos 5 Exames de Hemoglobina Glicada (HbA1c)</h2>
        {hba1cExams.length > 1 ? (
          <div className="h-80">
            <ExamChart data={hba1cExams} />
          </div>
        ) : (
          <p className="text-center text-slate-400 py-10">
            Adicione pelo menos dois resultados de "Hemoglobina Glicada" para visualizar o gráfico de evolução.
          </p>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Histórico de Exames</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label htmlFor="nameFilter" className="block text-sm font-medium text-slate-400">Filtrar por nome</label>
            <input
              id="nameFilter"
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Digite o nome do exame..."
            />
          </div>
          <div>
            <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-400">Filtrar por data</label>
            <input
              id="dateFilter"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-200">
            <thead className="border-b-2 border-slate-700">
              <tr>
                <th className="py-2 px-4">Data</th>
                <th className="py-2 px-4">Exame</th>
                <th className="py-2 px-4">Local</th>
                <th className="py-2 px-4">Resultado</th>
                <th className="py-2 px-4">Lembrete</th>
                <th className="py-2 px-4">Realizado</th>
                <th className="py-2 px-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.map(exam => {
                const lab = exam.laboratoryId ? contacts.find(c => c.id === exam.laboratoryId) : null;
                return (
                  <tr key={exam.id} className={`border-b border-slate-800 hover:bg-slate-700/50 transition-opacity ${exam.completed ? 'opacity-50 line-through' : ''}`}>
                    <td className="py-3 px-4">{formatDate(exam.date)}</td>
                    <td className="py-3 px-4 font-semibold">{exam.name}</td>
                    <td className="py-3 px-4 text-slate-300">{lab ? lab.name : <span className="text-slate-500 italic">N/A</span>}</td>
                    <td className="py-3 px-4 whitespace-pre-wrap">{exam.result} {exam.unit && <span className="text-slate-400 text-sm">({exam.unit})</span>}</td>
                    <td className="py-3 px-4 text-sm">{formatReminder(exam)}</td>
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={!!exam.completed}
                        onChange={() => handleToggleCompleted(exam.id)}
                        className="h-5 w-5 rounded bg-slate-700 border-slate-500 text-sky-500 focus:ring-sky-500 cursor-pointer"
                        aria-label={`Marcar exame ${exam.name} como realizado`}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleDelete(exam.id)} className="text-red-500 hover:text-red-400 p-1">
                        <TrashIcon className="w-5 h-5"/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {exams.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum exame cadastrado.</p>}
          {exams.length > 0 && filteredExams.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum resultado encontrado para os filtros aplicados.</p>}
        </div>
      </div>
    </div>
  );
};