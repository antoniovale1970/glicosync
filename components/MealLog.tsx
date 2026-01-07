
import React, { useState, useMemo, useEffect } from 'react';
import type { Meal } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CameraIcon } from './icons/CameraIcon';
import { CheckIcon } from './icons/CheckIcon';
import { AppleIcon } from './icons/AppleIcon';
import { generateContent, generateImageAnalysis } from '../services/geminiService';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ConfirmModal } from './ConfirmModal';
import { WifiIcon } from './icons/WifiIcon';
import { AlertIcon } from './icons/AlertIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';

interface MealLogProps {
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
}

interface ImpactAnalysis {
  impact: 'VERDE' | 'AMARELO' | 'LARANJA';
  reason: string;
  suggestions: string;
}

export const MealLog: React.FC<MealLogProps> = ({ meals, setMeals }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Form State
  const [type, setType] = useState<Meal['type']>('Almoço');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState('');
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [impactResult, setImpactResult] = useState<ImpactAnalysis | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto('');
  };

  const handleImpactAnalysis = async () => {
    if (!isOnline) return;
    if (!description && !photo) {
        alert("Descreva os alimentos ou tire uma foto para analisar o impacto.");
        return;
    }

    setIsAnalyzing(true);
    setImpactResult(null);

    const prompt = `
      Atue como um nutricionista especializado em diabetes. Analise esta refeição.
      Descrição: "${description}". ${photo ? "O usuário também enviou uma foto do prato." : ""}
      
      Preveja o impacto glicêmico.
      Sua resposta deve seguir OBRIGATORIAMENTE este formato JSON (apenas o json puro):
      {
        "impact": "VERDE" | "AMARELO" | "LARANJA",
        "reason": "Explicação curta sobre por que esse impacto foi escolhido.",
        "suggestions": "Markdown com 2 ou 3 dicas curtas de ajustes (ex: mudar ordem, trocar ingrediente, adicionar fibra)."
      }

      Critérios:
      - VERDE: Impacto menor (baixo índice glicêmico, equilibrado).
      - AMARELO: Impacto moderado (carboidratos complexos ou simples com fibras/proteínas).
      - LARANJA: Impacto maior (alto índice glicêmico, excesso de açúcares/carboidratos simples).
    `;

    try {
        let result = photo ? await generateImageAnalysis(photo, prompt) : await generateContent(prompt);
        const cleanedResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed: ImpactAnalysis = JSON.parse(cleanedResult);
        setImpactResult(parsed);
    } catch (error) {
        console.error(error);
        alert("Erro ao realizar a previsão de impacto. Tente descrever com mais detalhes.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description && !photo) return;

    // Se houver uma análise, salvamos ela formatada no campo aiAnalysis do tipo Meal
    const formattedAnalysis = impactResult ? 
        `### Impacto Glicêmico: ${impactResult.impact === 'VERDE' ? 'Baixo' : impactResult.impact === 'AMARELO' ? 'Moderado' : 'Alto'}\n${impactResult.reason}\n\n${impactResult.suggestions}` 
        : undefined;

    const mealData: Meal = {
      id: editingId || new Date().toISOString(),
      type, 
      date, 
      description, 
      photo: photo || undefined,
      aiAnalysis: formattedAnalysis,
      aiStatus: impactResult?.impact === 'VERDE' ? 'POSITIVE' : impactResult?.impact === 'AMARELO' ? 'WARNING' : impactResult?.impact === 'LARANJA' ? 'NEGATIVE' : undefined,
    };

    if (editingId) setMeals(prev => prev.map(m => m.id === editingId ? mealData : m));
    else setMeals(prev => [mealData, ...prev]);
    
    resetForm();
  };

  const resetForm = () => {
    setDescription(''); 
    setPhoto(''); 
    setImpactResult(null);
    setEditingId(null);
    setDate(new Date().toISOString().slice(0, 16));
  };

  const handleEdit = (meal: Meal) => {
      setEditingId(meal.id); 
      setType(meal.type); 
      setDate(meal.date); 
      setDescription(meal.description);
      setPhoto(meal.photo || ''); 
      setImpactResult(null); // Reset analysis on edit unless we want to parse the old one back
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = () => {
    if (deleteId) {
        setMeals(prev => prev.filter(m => m.id !== deleteId));
        if (editingId === deleteId) resetForm();
        setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Diário Alimentar</h1>
      
      {/* --- FORMULÁRIO UNIFICADO: REGISTRO E ANÁLISE --- */}
      <div className={`bg-slate-800 p-6 rounded-2xl shadow-2xl ring-1 ring-slate-700 border-l-4 ${editingId ? 'border-yellow-500' : 'border-brand-blue'}`}>
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingId ? 'bg-yellow-500/20' : 'bg-brand-blue/20'}`}>
                    <AppleIcon className={`w-6 h-6 ${editingId ? 'text-yellow-400' : 'text-sky-400'}`} />
                </div>
                <h2 className="text-xl font-bold text-slate-100">{editingId ? 'Editar Registro' : 'O que você vai comer?'}</h2>
            </div>
            {!isOnline && (
                <div className="flex items-center gap-2 text-[10px] text-orange-400 uppercase font-black tracking-widest bg-orange-400/10 px-3 py-1.5 rounded-full border border-orange-400/20">
                    <WifiIcon className="w-3 h-3" /> Offline
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Momento</label>
                    <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all">
                        <option>Café da Manhã</option><option>Almoço</option><option>Jantar</option><option>Lanche</option><option>Sobremesa</option><option>Ceia</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Data e Hora</label>
                    <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all" required />
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Lado Esquerdo: Input de Dados */}
                <div className="flex flex-col h-full gap-5">
                    {/* FOTO DO PRATO (ALTURA MENOR E ALINHADA) */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Foto do Prato (Opcional)</label>
                        <div className="bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-700 overflow-hidden relative group aspect-[21/9] w-full">
                            {!photo ? (
                                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                    <CameraIcon className="h-8 w-8 text-slate-700 mb-1 group-hover:text-sky-500 transition-colors" />
                                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-750 text-sky-400 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-lg transition-all border border-slate-700 uppercase tracking-wider">
                                        Carregar Foto
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <img src={photo} className="w-full h-full object-cover" />
                                    <button type="button" onClick={handleRemovePhoto} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full shadow-lg hover:bg-red-500 transition-colors">
                                        <TrashIcon className="w-4 h-4 text-white" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ALIMENTOS E QUANTIDADES (ALTURA MAIOR E ALINHADA AO BLOCO DA IA) */}
                    <div className="flex flex-col flex-grow">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Alimentos e Quantidades</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Descreva seu prato (ex: 3 colheres de arroz integral, salada de alface e um bife grelhado...)" 
                            className="w-full flex-grow min-h-[160px] bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none transition-all resize-none shadow-inner"
                        />
                    </div>
                </div>

                {/* Lado Direito: Análise da IA */}
                <div className="flex flex-col h-full min-h-[400px]">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Previsão Nutricional por IA</label>
                    <div className="flex-grow bg-slate-900 rounded-2xl border border-slate-700 flex flex-col overflow-hidden shadow-2xl relative">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4">
                                <Spinner size="lg" color="sky" />
                                <p className="text-sky-400 text-sm font-bold animate-pulse uppercase tracking-widest">Consultando Nutricionista IA...</p>
                            </div>
                        ) : impactResult ? (
                            <div className="h-full flex flex-col animate-fadeIn">
                                {/* Impact Header Card */}
                                <div className={`p-5 flex items-start gap-4 ${
                                    impactResult.impact === 'VERDE' ? 'bg-green-600/10' :
                                    impactResult.impact === 'AMARELO' ? 'bg-yellow-600/10' :
                                    'bg-orange-600/10'
                                }`}>
                                    <div className={`mt-1 h-5 w-5 rounded-full shrink-0 shadow-lg ${
                                        impactResult.impact === 'VERDE' ? 'bg-green-500 shadow-green-500/50' :
                                        impactResult.impact === 'AMARELO' ? 'bg-yellow-500 shadow-yellow-500/50' :
                                        'bg-orange-500 shadow-orange-500/50'
                                    }`}></div>
                                    <div className="flex-grow">
                                        <h3 className={`font-black uppercase tracking-tighter text-sm mb-1 ${
                                            impactResult.impact === 'VERDE' ? 'text-green-400' :
                                            impactResult.impact === 'AMARELO' ? 'text-yellow-400' :
                                            'text-orange-400'
                                        }`}>
                                            Impacto Glicêmico: {
                                                impactResult.impact === 'VERDE' ? 'Baixo' :
                                                impactResult.impact === 'AMARELO' ? 'Moderado' : 'Alto'
                                            }
                                        </h3>
                                        <p className="text-slate-200 text-xs leading-relaxed">{impactResult.reason}</p>
                                    </div>
                                    <button type="button" onClick={() => setImpactResult(null)} className="text-slate-600 hover:text-slate-400 transition-colors"><CloseIcon className="w-5 h-5"/></button>
                                </div>
                                {/* Suggestions Body */}
                                <div className="p-5 flex-grow overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center gap-2 mb-3">
                                        <LightbulbIcon className="w-4 h-4 text-sky-400" />
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sugestões de Ajuste</h4>
                                    </div>
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <MarkdownRenderer content={impactResult.suggestions} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <AlertIcon className="w-12 h-12 text-slate-800 mb-4" />
                                <p className="text-slate-400 text-sm mb-8 max-w-[280px] leading-relaxed">
                                    Preencha a descrição ou foto ao lado e clique no botão para prever o impacto glicêmico antes de comer.
                                </p>
                                <button 
                                    type="button" 
                                    onClick={handleImpactAnalysis}
                                    disabled={!isOnline || (!description && !photo)}
                                    className="bg-purple-600 hover:bg-purple-500 text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-[0.15em] shadow-xl disabled:opacity-30 transition-all active:scale-95 flex items-center gap-2 border border-purple-500/30"
                                >
                                    <LightbulbIcon className="w-4 h-4" /> Analisar Impacto
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-700/50">
                {editingId && (
                    <button type="button" onClick={resetForm} className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3.5 px-6 rounded-xl text-sm transition-all border border-slate-600 order-2 sm:order-1">
                        Cancelar Edição
                    </button>
                )}
                <button type="submit" className={`bg-brand-blue hover:bg-brand-blue-light text-white font-black py-3.5 px-12 rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest order-1 sm:order-2 flex items-center justify-center gap-2 ${editingId ? 'bg-yellow-600 hover:bg-yellow-500' : ''}`}>
                    {editingId ? <SaveIcon className="w-4 h-4" /> : <CheckIcon className="w-4 h-4" />}
                    {editingId ? 'Salvar Alterações' : 'Salvar no Diário'}
                </button>
            </div>
        </form>
      </div>

      {/* --- LISTA DE REFEIÇÕES (HISTÓRICO) --- */}
      <div className="bg-slate-800 rounded-2xl shadow-xl ring-1 ring-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700 bg-slate-900/30 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-slate-100">Histórico de Refeições</h2>
            <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Filtrar histórico..." 
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-sky-500 outline-none"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {meals
                .filter(m => m.description.toLowerCase().includes(searchTerm.toLowerCase()) || m.type.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(meal => (
                <div key={meal.id} className="bg-slate-900/40 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 transition-all group flex flex-col h-full shadow-lg shadow-black/20">
                    {meal.photo ? (
                        <div className="aspect-square w-full relative overflow-hidden shrink-0">
                            <img src={meal.photo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                            {meal.aiStatus && (
                                <div className={`absolute top-4 left-4 h-3 w-3 rounded-full shadow-lg ${
                                    meal.aiStatus === 'POSITIVE' ? 'bg-green-500' :
                                    meal.aiStatus === 'WARNING' ? 'bg-yellow-500' : 'bg-orange-500'
                                }`}></div>
                            )}
                        </div>
                    ) : (
                        <div className="aspect-square w-full bg-slate-800 flex items-center justify-center shrink-0">
                            <AppleIcon className="w-8 h-8 text-slate-700" />
                        </div>
                    )}
                    
                    <div className="p-5 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded border border-sky-500/20">{meal.type}</span>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">{new Date(meal.date).toLocaleString('pt-BR')}</span>
                        </div>
                        
                        <h3 className="text-white font-bold mb-3 leading-tight text-lg">{meal.description}</h3>
                        
                        {meal.aiAnalysis && (
                            <div className="mt-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs">
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <LightbulbIcon className="w-3 h-3" /> Insights da IA
                                </h4>
                                <div className="text-slate-400 max-h-32 overflow-y-auto custom-scrollbar italic leading-relaxed">
                                    <MarkdownRenderer content={meal.aiAnalysis} />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-auto pt-4">
                            <button onClick={() => handleEdit(meal)} className="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all" title="Editar">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setDeleteId(meal.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all" title="Excluir">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {meals.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-600">
                <AppleIcon className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-bold uppercase tracking-widest text-sm opacity-50">Nenhuma refeição registrada</p>
            </div>
        )}
      </div>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Excluir Refeição" message="Tem certeza que deseja apagar este registro permanentemente?" />
    </div>
  );
};
