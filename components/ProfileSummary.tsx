
import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { generateContent } from '../services/geminiService';
import { Spinner } from './Spinner';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { WifiIcon } from './icons/WifiIcon';

interface ProfileSummaryProps {
  profile: UserProfile;
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
  const [tip, setTip] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const fetchTip = async () => {
    if (!navigator.onLine) {
      setIsLoading(false);
      setTip("offline");
      return;
    }

    setIsLoading(true);
    const prompt = `
      Atue como um educador em diabetes e especialista em estilo de vida saudável. 
      Gere uma dica curta, prática e motivacional (máximo de 2 frases curtas) para ajudar uma pessoa com diabetes ${profile.diabetesType || 'tipo 1 ou 2'} a manter a saúde em dia. 
      O tema deve ser variado e escolhido aleatoriamente entre: alimentação inteligente (baixo índice glicêmico), benefícios de exercícios físicos, importância do sono reparador, manejo do estresse, hidratação adequada, bons hábitos de higiene ou consistência no monitoramento.
      Seja direto e inspirador.
    `;
    
    try {
      const result = await generateContent(prompt);
      setTip(result);
      setLastUpdated(Date.now());
    } catch (error) {
      setTip("Mantenha o foco no seu monitoramento hoje para um dia mais saudável!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    fetchTip();

    // Intervalo de 1 minuto (60.000 ms)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        fetchTip();
      }
    }, 60000);

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
        clearInterval(interval);
    };
  }, [profile.diabetesType]);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center">
            <LightbulbIcon className="w-6 h-6 text-yellow-400 mr-3" />
            <h2 className="text-xl font-semibold text-slate-100">Dicas do Dia</h2>
        </div>
        {isOnline && !isLoading && (
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest animate-pulse">IA Ativa</span>
        )}
      </div>
      <div className="flex-grow flex flex-col justify-center overflow-y-auto custom-scrollbar">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[80px] gap-2">
                <Spinner size="md" color="sky" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Consultando Especialista IA...</p>
            </div>
        ) : tip === "offline" ? (
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
                <WifiIcon className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-slate-400 leading-relaxed">
                    Para visualizar as <strong className="text-slate-300">Dicas do Dia</strong> personalizadas, o <strong className="text-slate-300">GlicoSync deve estar conectado à internet</strong>.
                </p>
            </div>
        ) : (
            <div className="animate-fadeIn">
                <p className="text-slate-300 italic leading-relaxed text-base">
                "{tip}"
                </p>
                <div className="flex items-center gap-2 mt-4">
                    <div className="h-1 flex-grow bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 animate-[progress_60s_linear_infinite]"></div>
                    </div>
                    <p className="text-[9px] text-slate-600 uppercase font-bold tracking-widest whitespace-nowrap">
                        Nova dica em 1 min
                    </p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// Adição de estilo para a barra de progresso no Dashboard (opcional, mas melhora a UX)
