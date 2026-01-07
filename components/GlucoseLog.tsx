
import React, { useState, useMemo } from 'react';
import type { GlucoseReading, UserAccount } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExportIcon } from './icons/ExportIcon';
import { GlucoseChart } from './GlucoseChart';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { CloseIcon } from './icons/CloseIcon';
import { EditIcon } from './icons/EditIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ConfirmModal } from './ConfirmModal';


interface GlucoseLogProps {
  readings: GlucoseReading[];
  setReadings: React.Dispatch<React.SetStateAction<GlucoseReading[]>>;
  user?: UserAccount;
}

type ChartPeriod = '7d' | '30d' | 'all';
type SortKey = 'date' | 'value';
type SortDirection = 'asc' | 'desc';

const NOTE_OPTIONS = ['Jejum', 'Pós almoço', 'Pós jantar', 'Aleatório', 'Outro'];

export const GlucoseLog: React.FC<GlucoseLogProps> = ({ readings, setReadings, user }) => {
  // Form State
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [isCustomNote, setIsCustomNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Chart State
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('7d');

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [listPeriod, setListPeriod] = useState<ChartPeriod>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date',
    direction: 'desc'
  });

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Logic for Chart Data
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


  // Logic for List Data (Filtering and Sorting)
  const filteredAndSortedReadings = useMemo(() => {
    let data = [...readings];

    // 1. Filter by Period
    const now = new Date();
    if (listPeriod !== 'all') {
        const startDate = new Date();
        if (listPeriod === '7d') {
            startDate.setDate(now.getDate() - 7);
        } else if (listPeriod === '30d') {
            startDate.setDate(now.getDate() - 30);
        }
        startDate.setHours(0,0,0,0);
        data = data.filter(r => new Date(r.date) >= startDate);
    }

    // 2. Filter by Search Term (Notes)
    if (searchTerm) {
        data = data.filter(r => 
            (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.value.toString().includes(searchTerm)
        );
    }

    // 3. Sort
    data.sort((a, b) => {
        if (sortConfig.key === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
            return sortConfig.direction === 'asc' ? a.value - b.value : b.value - a.value;
        }
    });

    return data;
  }, [readings, listPeriod, sortConfig, searchTerm]);


  const handleSort = (key: SortKey) => {
      setSortConfig(current => ({
          key,
          direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
      }));
  };

  const handleNoteOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.target.value;
      if (selected === 'Outro') {
          setIsCustomNote(true);
          setNotes('');
      } else {
          setIsCustomNote(false);
          setNotes(selected === 'Selecione...' ? '' : selected);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || !date) return;
    
    const readingData: GlucoseReading = {
      id: editingId || new Date().toISOString(),
      value: parseInt(value, 10),
      date,
      notes,
    };

    if (editingId) {
        setReadings(prev => prev.map(r => r.id === editingId ? readingData : r));
        setEditingId(null);
    } else {
        setReadings(prev => [readingData, ...prev]);
    }
    
    // Reset
    setValue('');
    setNotes('');
    setIsCustomNote(false);
    setDate(new Date().toISOString().slice(0, 16));
  };

  const handleEdit = (reading: GlucoseReading) => {
      setEditingId(reading.id);
      setValue(reading.value.toString());
      setDate(reading.date);
      
      if (NOTE_OPTIONS.includes(reading.notes || '')) {
          setNotes(reading.notes || '');
          setIsCustomNote(false);
      } else {
          setNotes(reading.notes || '');
          setIsCustomNote(true);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setValue('');
      setNotes('');
      setIsCustomNote(false);
      setDate(new Date().toISOString().slice(0, 16));
  };

  // --- DELETE HANDLER: Opens Modal ---
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  // --- CONFIRM DELETE: Executes Action ---
  const confirmDelete = () => {
    if (deleteId) {
        setReadings(prev => prev.filter(r => r.id !== deleteId));
        if (editingId === deleteId) handleCancelEdit();
        setDeleteId(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString));
  }

  const handleExportCSV = () => {
    if (filteredAndSortedReadings.length === 0) {
      alert("Não há dados para exportar na visualização atual.");
      return;
    }

    const headers = ['Data e Hora', 'Valor (mg/dL)', 'Notas'];
    const csvContent = '\uFEFF' + [ 
      headers.join(','),
      ...filteredAndSortedReadings.map(r => {
        const formattedDate = formatDate(r.date);
        const value = r.value.toString();
        const notes = r.notes ? `"${r.notes.replace(/"/g, '""')}"` : '';
        return [formattedDate, value, notes].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "registros_glicemia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
          alert("Habilite pop-ups para imprimir.");
          return;
      }
      
      const rows = filteredAndSortedReadings.map(r => `
        <tr>
            <td>${formatDate(r.date)}</td>
            <td><strong>${r.value}</strong> mg/dL</td>
            <td>${r.notes || '-'}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
            <head>
                <title>Relatório de Glicemia</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background: #f0f0f0; }
                </style>
            </head>
            <body>
                <h1>Relatório de Glicemia - GlicoSync</h1>
                <p>Gerado em: ${new Date().toLocaleString()}</p>
                <table>
                    <thead>
                        <tr><th>Data/Hora</th><th>Valor</th><th>Notas</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>window.print();</script>
            </body>
        </html>
      `);
      printWindow.document.close();
  };

  const renderSortIcon = (key: SortKey) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'asc' 
        ? <ArrowUpIcon className="w-4 h-4 ml-1 inline" /> 
        : <ArrowDownIcon className="w-4 h-4 ml-1 inline" />;
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Controle de Glicemia</h1>
      
      {/* FORMULÁRIO (NOVO / EDITAR) */}
      <div className={`bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700 border-l-4 ${editingId ? 'border-yellow-500' : 'border-brand-blue'} relative overflow-hidden`}>
        
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${editingId ? 'text-yellow-400' : 'text-slate-200'}`}>
                {editingId ? 'Editar Registro' : 'Novo Registro'}
            </h2>
            {editingId && (
                <button onClick={handleCancelEdit} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
            )}
        </div>
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
            <label htmlFor="glucoseNotes" className="block text-sm font-medium text-slate-400">Notas / Situação</label>
            {!isCustomNote ? (
                <select
                    id="glucoseNotes"
                    value={notes && NOTE_OPTIONS.includes(notes) ? notes : (notes ? 'Outro' : '')}
                    onChange={handleNoteOptionChange}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                    <option value="">Selecione...</option>
                    {NOTE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <div className="relative mt-1">
                    <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full px-3 py-2 pr-8 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        placeholder="Digite a situação..."
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => { setIsCustomNote(false); setNotes(''); }}
                        className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 hover:text-white"
                        title="Voltar para lista"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
          </div>
          <button 
            type="submit" 
            className={`flex items-center justify-center w-full font-bold py-2 px-4 rounded-md transition-colors shadow-sm ${editingId ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-brand-blue hover:bg-brand-blue-light text-white'}`}
          >
            {editingId ? <SaveIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
            {editingId ? 'Salvar' : 'Adicionar'}
          </button>
        </form>
      </div>

      {/* HISTÓRICO DE REGISTROS */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-200">
                    Histórico de Registros
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        disabled={filteredAndSortedReadings.length === 0}
                        className="flex items-center justify-center bg-slate-600 text-white font-bold py-2 px-3 rounded-md hover:bg-slate-500 transition-colors shadow-sm disabled:bg-slate-600/50 disabled:cursor-not-allowed text-sm"
                    >
                        <PrinterIcon className="w-4 h-4 mr-2" />
                        Imprimir
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={filteredAndSortedReadings.length === 0}
                        className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-3 rounded-md hover:bg-green-700 transition-colors shadow-sm disabled:bg-slate-600/50 disabled:cursor-not-allowed text-sm"
                    >
                        <ExportIcon className="w-4 h-4 mr-2" />
                        Exportar
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                {/* Filtro de Período */}
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-700/30 p-2 rounded-lg border border-slate-700 w-full md:w-auto">
                    <span className="text-sm font-medium text-slate-400 px-2">Período:</span>
                    <div className="flex gap-1 w-full sm:w-auto">
                        {['7d', '30d', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setListPeriod(p as ChartPeriod)}
                                className={`flex-1 sm:flex-none px-3 py-1 text-sm font-semibold rounded-md transition-colors ${listPeriod === p ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                {p === 'all' ? 'Todos' : p === '7d' ? '7 dias' : '30 dias'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campo de Busca */}
                <div className="relative w-full md:w-64">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar em notas ou valor..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
                    />
                </div>
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-200">
            <thead className="border-b-2 border-slate-700">
              <tr>
                <th 
                    className="py-2 px-4 cursor-pointer hover:text-white hover:bg-slate-700/50 transition-colors rounded-t-lg select-none"
                    onClick={() => handleSort('date')}
                >
                    Data e Hora {renderSortIcon('date')}
                </th>
                <th 
                    className="py-2 px-4 cursor-pointer hover:text-white hover:bg-slate-700/50 transition-colors rounded-t-lg select-none"
                    onClick={() => handleSort('value')}
                >
                    Valor (mg/dL) {renderSortIcon('value')}
                </th>
                <th className="py-2 px-4">Notas</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedReadings.map(reading => (
                <tr key={reading.id} className={`border-b border-slate-800 hover:bg-slate-700/50 ${editingId === reading.id ? 'bg-slate-700 border-l-2 border-yellow-500' : ''}`}>
                  <td className="py-3 px-4">{formatDate(reading.date)}</td>
                  <td className="py-3 px-4 font-semibold text-sky-300">{reading.value}</td>
                  <td className="py-3 px-4 text-slate-300">{reading.notes || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => handleEdit(reading)} 
                            className="text-sky-500 hover:text-sky-400 p-1.5 hover:bg-sky-500/10 rounded-lg transition-colors" 
                            title="Editar"
                            disabled={!!editingId && editingId !== reading.id}
                        >
                            <EditIcon className="w-4 h-4"/>
                        </button>
                        <button 
                            onClick={(e) => handleDeleteClick(e, reading.id)} 
                            className="text-red-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" 
                            title="Excluir"
                            disabled={!!editingId && editingId !== reading.id}
                        >
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {readings.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum registro encontrado.</p>}
          {readings.length > 0 && filteredAndSortedReadings.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum registro encontrado para o filtro selecionado.</p>}
        </div>
      </div>

      {/* TENDÊNCIA DA GLICEMIA (GRÁFICO) */}
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-slate-200">Tendência da Glicemia</h2>
            <div className="flex items-center gap-2 bg-slate-700 p-1 rounded-lg">
                <button
                    onClick={() => setChartPeriod('7d')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${chartPeriod === '7d' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                    7d
                </button>
                <button
                    onClick={() => setChartPeriod('30d')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${chartPeriod === '30d' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
                >
                    30d
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro de glicemia?"
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};
