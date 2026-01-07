
import React, { useState, useEffect } from 'react';
import { generateContentWithGrounding } from '../services/geminiService';
import { Spinner } from './Spinner';
import { NewsIcon } from './icons/NewsIcon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { WifiIcon } from './icons/WifiIcon';

export const HealthNews: React.FC = () => {
  const [newsItems, setNewsItems] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    const fetchNews = async () => {
      if (!navigator.onLine) {
        setIsLoading(false);
        return;
      }

      // Check local storage cache first
      const cachedNews = localStorage.getItem('glicosync-health-news-items');
      const cachedTime = localStorage.getItem('glicosync-health-news-time');
      const now = new Date().getTime();

      // Cache for 1 hour (3600000 ms)
      if (cachedNews && cachedTime && (now - parseInt(cachedTime) < 3600000)) {
        try {
            const parsedItems = JSON.parse(cachedNews);
            if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                setNewsItems(parsedItems);
                setIsLoading(false);
                return;
            }
        } catch (e) {
            console.error("Error parsing cached news", e);
        }
      }

      const prompt = `
        Use a ferramenta de busca do Google para encontrar 10 notícias muito recentes e relevantes sobre "Diabetes", "Tratamento Diabetes", "Avanços Insulina" ou "Tecnologia para Diabéticos".
        
        Sua resposta deve ser OBRIGATORIAMENTE uma lista formatada em Markdown.
        NÃO adicione texto introdutório ou conclusivo antes ou depois da lista.
        
        Siga estritamente este formato para cada item (inicie com hífen):
        - [Título da Notícia Aqui](URL_DA_FONTE)
          Escreva aqui um resumo curto e direto da notícia com no máximo 25 palavras.
      `;
      
      try {
        const response = await generateContentWithGrounding(prompt);
        let items: string[] = [];

        if (response && response.text) {
             const rawText = response.text.trim();
             
             const lines = rawText.split('\n');
             let currentItem = '';
             
             lines.forEach(line => {
                 const trimmed = line.trim();
                 // Detect start of new item
                 if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                     if (currentItem) items.push(currentItem);
                     currentItem = line;
                 } else {
                     if (currentItem) {
                         currentItem += '\n' + line;
                     } else if (trimmed.length > 0) {
                         currentItem = line;
                     }
                 }
             });
             if (currentItem) items.push(currentItem);

             if (items.length === 0 && rawText.length > 0) items = [rawText];
        } else {
            items = ["Não foi possível buscar notícias atualizadas no momento."];
        }

        setNewsItems(items);
        localStorage.setItem('glicosync-health-news-items', JSON.stringify(items));
        localStorage.setItem('glicosync-health-news-time', now.toString());
      } catch (error) {
        console.error("Error fetching news:", error);
        setNewsItems(["Erro ao carregar notícias. Verifique sua conexão."]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();

    return () => {
        window.removeEventListener('online', handleStatusChange);
        window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    if (isLoading || newsItems.length <= 1 || isPaused || !isOnline) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % newsItems.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [isLoading, newsItems.length, isPaused, isOnline]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % newsItems.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length);
  };

  return (
    <div 
        className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 h-full flex flex-col overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center">
            <NewsIcon className="w-6 h-6 text-sky-400 mr-3" />
            <h2 className="text-xl font-semibold text-slate-100">Notícias Online</h2>
        </div>
        {!isLoading && newsItems.length > 1 && isOnline && (
            <div className="flex items-center gap-2">
                <div className="flex space-x-1.5">
                  {newsItems.map((_, idx) => (
                    <button
                      key={idx} 
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-sky-400 w-3' : 'bg-slate-600 hover:bg-slate-500'}`}
                      aria-label={`Ir para notícia ${idx + 1}`}
                    />
                  ))}
                </div>
            </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center flex-grow min-h-[120px]">
          <Spinner size="md" color="sky" />
        </div>
      ) : !isOnline && newsItems.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <WifiIcon className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">
                Para visualizar as notícias mais recentes, o <strong className="text-slate-200">GlicoSync deve estar conectado à internet</strong>.
            </p>
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-center min-h-[120px] relative group px-1 min-w-0 overflow-hidden">
           <div className="transition-opacity duration-300 ease-in-out h-full overflow-y-auto custom-scrollbar">
                <MarkdownRenderer content={newsItems[currentIndex]} />
           </div>
           
           {newsItems.length > 1 && (
               <>
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-[-10px] top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    aria-label="Notícia anterior"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    aria-label="Próxima notícia"
                >
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
               </>
           )}
        </div>
      )}
      
       <div className="mt-auto pt-3 text-right border-t border-slate-700/50 flex-shrink-0 flex justify-between items-center">
         <span className="text-xs text-slate-500 transition-opacity duration-300">
             {!isOnline ? "Modo Offline" : (isPaused ? "Pausado" : "Atualiza em 15s")}
         </span>
         <span className="text-xs text-slate-500">Fonte: Google Gemini</span>
      </div>
    </div>
  );
};
