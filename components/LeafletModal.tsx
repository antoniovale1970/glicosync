
import React, { useState, useEffect, useRef } from 'react';
import { generateContentWithGrounding } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Spinner } from './Spinner';
import { CloseIcon } from './icons/CloseIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { WifiIcon } from './icons/WifiIcon';
import type { Medication } from '../types';

interface LeafletModalProps {
  medication: Medication;
  onClose: () => void;
}

export const LeafletModal: React.FC<LeafletModalProps> = ({ medication, onClose }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const printableContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const fetchLeaflet = async () => {
      if (medication.leaflet) {
          setContent(medication.leaflet);
          setIsLoading(false);
          return;
      }

      if (!navigator.onLine) {
        setIsLoading(false);
        return;
      }

      const prompt = `Gere resumo da bula para: "${medication.name}" (${medication.dosage}) em Markdown.`;
      try {
        const response = await generateContentWithGrounding(prompt);
        setContent(response?.text || "Bula não encontrada.");
      } catch (error) {
        setContent("Erro ao buscar bula.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaflet();

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, [medication]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-xl font-bold text-slate-100">Bula Online: <span className="text-sky-400">{medication.name}</span></h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="flex-grow p-6 overflow-y-auto bg-slate-900/50">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4"><Spinner size="lg" color="sky" /><p className="text-slate-400 animate-pulse">Buscando informações...</p></div>
            ) : !isOnline && !content ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <WifiIcon className="w-12 h-12 text-slate-700 opacity-50" />
                    <p className="text-slate-300 max-w-md">
                        Para buscar informações da bula online, o <strong className="text-slate-100">GlicoSync deve estar conectado à internet</strong>.
                    </p>
                </div>
            ) : (
                <MarkdownRenderer content={content} />
            )}
        </div>
      </div>
    </div>
  );
};
