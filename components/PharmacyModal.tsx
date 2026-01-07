
import React, { useState, useEffect } from 'react';
import { searchPharmaciesNearby } from '../services/geminiService';
import { Spinner } from './Spinner';
import { CloseIcon } from './icons/CloseIcon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { PharmacyIcon } from './icons/PharmacyIcon';
import { WifiIcon } from './icons/WifiIcon';
import type { Medication } from '../types';

interface PharmacyModalProps {
  medication: Medication;
  onClose: () => void;
}

export const PharmacyModal: React.FC<PharmacyModalProps> = ({ medication, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const fetchPharmacies = async () => {
      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      if (!navigator.geolocation) {
        setError("Geolocalização não suportada.");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await searchPharmaciesNearby(position.coords.latitude, position.coords.longitude, medication.name);
            setContent(response?.text || "Nenhuma farmácia encontrada.");
          } catch (err) {
            setError("Erro ao buscar farmácias.");
          } finally {
            setLoading(false);
          }
        },
        () => { setError("Permissão de localização negada."); setLoading(false); }
      );
    };

    fetchPharmacies();

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, [medication]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900/50">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2"><PharmacyIcon className="w-6 h-6 text-green-400" /> Farmácias Próximas</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4"><Spinner size="lg" color="green" /><p className="text-slate-300 animate-pulse">Localizando...</p></div>
            ) : !isOnline ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <WifiIcon className="w-12 h-12 text-slate-700 opacity-50" />
                    <p className="text-slate-300 max-w-md">
                        Para buscar farmácias e drogarias próximas, o <strong className="text-slate-100">GlicoSync deve estar conectado à internet</strong>.
                    </p>
                </div>
            ) : error ? (
                <div className="text-center p-6"><p className="text-red-400">{error}</p></div>
            ) : (
                <div className="prose prose-invert max-w-none"><MarkdownRenderer content={content} /></div>
            )}
        </div>
      </div>
    </div>
  );
};
