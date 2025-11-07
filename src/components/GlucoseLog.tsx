import React, { useState, useMemo } from 'react';
import type { GlucoseReading } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExportIcon } from './icons/ExportIcon';
import { GlucoseChart } from './GlucoseChart';


interface GlucoseLogProps {
  readings: GlucoseReading[];
  setReadings: React.Dispatch<React.SetStateAction<GlucoseReading[]>>;
}

type ChartPeriod = '7d' | '30d' | 'all';

export const GlucoseLog: React.FC<GlucoseLogProps> = ({ readings, setReadings }) => {
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');

  const chartData = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    
    if (chartPeriod === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (chartPeriod === '30d') {
      startDate.setDate(now.getDate() - 30);
    }

    if (chartPeriod === 'all') {
      return readings;
    }

    return readings.filter(r => new Date(r.date) >= startDate);

  }, [readings, chartPeriod]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !date) return;
    const newReading: GlucoseReading = {
      id: new Date().toISOString(),
      value: parseInt(value, 10),
      date,
      notes,
    };
    setReadings([newReading, ...readings]);
    setValue('');
    setNotes('');
    setDate(new Date().toISOString().slice(0, 16));
  };

  const handleDelete = (id: string) => {
    setReadings(readings.filter(r => r.id !== id));
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString));
  }

  const handleExportCSV = () => {
    if (readings.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Sort readings chronologically for export
    const sortedReadings = [...readings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const headers = ['Data e Hora', 'Valor (mg/dL)', 'Notas'];
    const csvContent = '\uFEFF' + [ // BOM for Excel UTF-8 compatibility
      headers.join(','),
      ...sortedReadings.map(r => {
        const formattedDate = formatDate(r.date);
        const value = r.value.toString();
        // Escape commas and quotes in notes
        const notes = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '';
        return [formattedDate, value, notes].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "registros_glicemia.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Controle de Glicemia</h1>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Novo Registro</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="glucoseValue" className="block text-sm font-medium text-slate-400">Valor (mg/dL)</label>
            <input
              id="glucoseValue"
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Ex: 95"
              required
            />
          </div>
          <div>
            <label htmlFor="glucoseDate" className="block text-sm font-medium text-slate-400">Data e Hora</label>
            <input
              id="glucoseDate"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              required
            />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <label htmlFor="glucoseNotes" className="block text-sm font-medium text-slate-400">Notas</label>
            <input
              id="glucoseNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Ex: Após o almoço"
            />
          </div>
          <button type="submit" className="flex items-center justify-center w-full bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm">
            <PlusIcon className="w-5 h-5 mr-2" />
            Adicionar
          </button>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-slate-200">Tendência da Glicemia</h2>
            <div className="flex items-center gap-2 bg-slate-700 p-1 rounded-lg">
                <button
                    onClick={() => setChartPeriod('7d')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${chartPeriod === '7d' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                    7 dias
                </button>
                <button
                    onClick={() => setChartPeriod('30d')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${chartPeriod === '30d' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                    30 dias
                </button>
                 <button
                    onClick={() => setChartPeriod('all')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${chartPeriod === 'all' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                    Tudo
                </button>
            </div>
        </div>
        <div className="h-80">
            {chartData.length > 1 ? (
                <GlucoseChart data={chartData} />
            ) : (
                <p className="text-center text-slate-400 pt-16">
                    Não há dados suficientes neste período para exibir o gráfico.
                    <br/>
                    Adicione pelo menos dois registros.
                </p>
            )}
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-200">Histórico de Registros</h2>
            <button
                onClick={handleExportCSV}
                disabled={readings.length === 0}
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
                <th className="py-2 px-4">Data e Hora</th>
                <th className="py-2 px-4">Valor (mg/dL)</th>
                <th className="py-2 px-4">Notas</th>
                <th className="py-2 px-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {readings.map(reading => (
                <tr key={reading.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                  <td className="py-3 px-4">{formatDate(reading.date)}</td>
                  <td className="py-3 px-4 font-semibold">{reading.value}</td>
                  <td className="py-3 px-4 text-slate-300">{reading.notes}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(reading.id)} className="text-red-500 hover:text-red-400 p-1">
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {readings.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum registro encontrado.</p>}
        </div>
      </div>
    </div>
  );
};