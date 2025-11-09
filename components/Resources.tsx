import React, { useState, useRef } from 'react';
import { generateContent } from '../services/geminiService';
import { Spinner } from './Spinner';
import type { GlucoseReading, Medication, Meal, UserProfile, Exam } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { DownloadIcon } from './icons/DownloadIcon';
import { PrinterIcon } from './icons/PrinterIcon';


interface ResourcesProps {
    profile: UserProfile;
    glucoseReadings: GlucoseReading[];
    medications: Medication[];
    meals: Meal[];
    exams: Exam[];
}

type ResourceType = 'recipes' | 'diet' | 'mealHistory' | 'exercises' | 'foods' | 'tips' | 'examSuggestions';
type MealTypeFilter = 'Todos' | 'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche';


const resourceConfig: Record<ResourceType, { title: string; buttonText: string; }> = {
    recipes: {
        title: 'Receitas para Diabéticos',
        buttonText: "Gerar Novas Receitas",
    },
    diet: {
        title: 'Dieta e Calorias',
        buttonText: "Gerar Novo Plano Semanal",
    },
    mealHistory: {
        title: 'Análise de Refeições',
        buttonText: "Gerar Análise",
    },
    exercises: {
        title: 'Dicas de Exercícios',
        buttonText: "Gerar Novas Dicas de Exercícios",
    },
    foods: {
        title: 'Lista de Alimentos',
        buttonText: "Gerar Nova Lista de Alimentos",
    },
    tips: {
        title: 'Dicas de Controle',
        buttonText: "Gerar Novas Dicas",
    },
    examSuggestions: {
        title: 'Sugestões de Exames',
        buttonText: "Gerar Sugestões",
    }
};

const initialContentState: Record<ResourceType, string> = {
    recipes: '',
    diet: '',
    mealHistory: '',
    exercises: '',
    foods: '',
    tips: '',
    examSuggestions: '',
};

const initialLoadingState: Record<ResourceType, boolean> = {
    recipes: false,
    diet: false,
    mealHistory: false,
    exercises: false,
    foods: false,
    tips: false,
    examSuggestions: false,
};

export const Resources: React.FC<ResourcesProps> = ({ profile, glucoseReadings, medications, meals, exams }) => {
  const [activeTab, setActiveTab] = useState<ResourceType>('recipes');
  const [content, setContent] = useState<Record<ResourceType, string>>(initialContentState);
  const [isLoading, setIsLoading] = useState<Record<ResourceType, boolean>>(initialLoadingState);
  
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);
  const [analysisMealType, setAnalysisMealType] = useState<MealTypeFilter>('Todos');

  const printableContentRef = useRef<HTMLDivElement>(null);


  const getPromptForType = (type: ResourceType): string => {
    switch (type) {
        case 'recipes':
            return "Gere 3 receitas de pratos principais e 2 de sobremesas para diabéticos. Inclua uma lista de ingredientes e um passo a passo para o preparo. Formate a resposta em Markdown com títulos para cada receita.";
        case 'diet':
            return "Gere um plano de refeições semanal para uma pessoa com diabetes, focado no controle de calorias (aproximadamente 1500-1800 calorias por dia). O plano deve incluir sugestões para café da manhã, almoço, jantar e dois lanches para cada dia da semana (Segunda a Domingo). Apresente opções variadas e saudáveis. Formate a resposta em Markdown, com um título para cada dia da semana.";
        case 'exercises':
            return `
              Com base no perfil de um usuário com diabetes, gere 5 dicas personalizadas de exercícios físicos.
              O usuário tem ${profile.age || 'idade não informada'} anos, pesa ${profile.weight || 'peso não informado'} kg e tem diabetes ${profile.diabetesType}.
              Para cada dica, explique os benefícios específicos para o controle da diabetes, inclua sugestões práticas para iniciantes e forneça orientações sobre como e quando monitorar a glicemia durante a atividade física.
              Mantenha um tom encorajador e seguro.
              Formate toda a resposta em Markdown, com títulos claros para cada dica.
            `;
        case 'foods':
            return "Crie uma lista de alimentos para diabéticos. Divida a lista em três seções: 'Alimentos Recomendados', 'Alimentos a Evitar', e 'Alimentos Ricos em Fibras'. Para cada alimento nas duas primeiras seções, forneça uma breve explicação. Para a seção de fibras, liste exemplos de alimentos e explique os benefícios específicos das fibras para o controle da diabetes. Formate toda a resposta em Markdown.";
        case 'tips':
            return "Gere uma lista com 7 dicas práticas e importantes para o controle diário da diabetes, abordando alimentação, monitoramento, medicação e bem-estar. Formate a resposta em Markdown.";
        case 'mealHistory':
            const filterDateObj = new Date(analysisDate + 'T00:00:00');

            const filteredGlucose = glucoseReadings
                .filter(r => new Date(r.date).toISOString().split('T')[0] === analysisDate)
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(r => `- ${new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}: ${r.value} mg/dL ${r.notes ? `(Notas: ${r.notes})` : ''}`)
                .join('\n');

            const filteredMeals = meals
                .filter(m => {
                    const mealDateMatches = new Date(m.date).toISOString().split('T')[0] === analysisDate;
                    const mealTypeMatches = analysisMealType === 'Todos' || m.type === analysisMealType;
                    return mealDateMatches && mealTypeMatches;
                })
                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(m => {
                  const nutritionalInfo = [
                      m.calories ? `${m.calories} kcal` : null,
                      m.carbs ? `${m.carbs}g C` : null,
                      m.proteins ? `${m.proteins}g P` : null,
                      m.fats ? `${m.fats}g G` : null,
                  ].filter(Boolean).join(', ');

                  return `- ${new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${m.type}): ${m.description} ${nutritionalInfo ? `(${nutritionalInfo})` : ''}`;
                })
                .join('\n');

            const allMedications = medications.length > 0
                ? medications.map(m => `- ${m.name}, ${m.dosage}, ${m.frequency}`).join('\n')
                : 'Nenhum medicamento cadastrado.';

            if (!filteredGlucose && !filteredMeals) {
                return `Nenhum dado de refeição ou glicemia registrado para ${new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC'}).format(filterDateObj)}. Por favor, selecione outra data ou adicione registros para obter uma análise.`;
            }

            return `
              Analise o diário de diabetes para a data ${new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC'}).format(filterDateObj)} e forneça um resumo com insights e sugestões.
              ${analysisMealType !== 'Todos' ? `A análise deve focar no tipo de refeição: ${analysisMealType}.` : ''}
              O objetivo é ajudar o usuário a entender a relação entre sua alimentação (incluindo macronutrientes, se disponíveis) e os níveis de glicose.

              **Dados de Glicemia do Dia:**
              ${filteredGlucose || 'Nenhum registro de glicemia para esta data.'}

              **Refeições do Dia (Filtrado):**
              ${filteredMeals || 'Nenhuma refeição registrada para esta data/filtro.'}

              **Lista de Medicamentos Atuais:**
              ${allMedications}

              Com base nestes dados, gere um resumo conciso em Markdown que:
              1.  Identifique correlações entre as refeições registradas e os níveis de glicose subsequentes (picos ou quedas).
              2.  Ofereça insights práticos sobre como os alimentos e sua composição (carboidratos, proteínas, etc.) podem ter influenciado a glicose.
              3.  Sugira pequenos ajustes nas próximas refeições ou no horário das medições para melhorar o controle. Por exemplo, "O pico de glicose após o almoço pode estar relacionado à quantidade de carboidratos. Tente uma porção menor ou adicionar mais fibras na próxima vez."
              
              Mantenha um tom positivo, educativo e encorajador. Evite dar conselhos médicos diretos, use frases como "Pode ser interessante observar..." ou "Converse com seu médico sobre...".
              Se não houver dados suficientes para uma análise clara, mencione isso de forma amigável.
            `;
        case 'examSuggestions':
            const latestGlucose = glucoseReadings.length > 0 ? `Última glicemia: ${glucoseReadings[0].value} mg/dL.` : 'Nenhum registro de glicemia recente.';
            const averageGlucose = glucoseReadings.length > 0 ? `Média glicêmica: ${(glucoseReadings.reduce((acc, r) => acc + r.value, 0) / glucoseReadings.length).toFixed(1)} mg/dL.` : '';
            
            const existingExams = exams.length > 0 
                ? `Exames já registrados:\n${exams.map(e => `- ${e.name} (realizado em: ${new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC'}).format(new Date(e.date))})`).join('\n')}`
                : 'Nenhum exame registrado ainda.';
    
            return `
                Aja como um assistente de saúde virtual para um aplicativo de controle de diabetes.
                Com base no perfil e nos dados de saúde do usuário, sugira de 2 a 4 exames médicos adicionais que poderiam ser importantes para o monitoramento completo de sua saúde.
    
                **Dados do Usuário:**
                - Idade: ${profile.age || 'Não informada'}
                - Tipo de Diabetes: ${profile.diabetesType}
                - ${latestGlucose}
                - ${averageGlucose}
                - ${existingExams}
    
                **Sua Tarefa:**
                1. Analise os dados fornecidos.
                2. Sugira exames relevantes que ainda não foram registrados ou que complementem os existentes. Considere exames comuns para monitoramento de complicações do diabetes (ex: exame de fundo de olho, microalbuminúria, perfil lipídico, função renal).
                3. Para cada sugestão, explique em 1-2 frases claras e simples o porquê do exame ser importante para uma pessoa com diabetes.
                4. Formate a resposta em Markdown, usando títulos para cada exame sugerido.
                5. **IMPORTANTE:** Termine a resposta com um aviso claro: "Lembre-se: estas são apenas sugestões com base nos dados fornecidos. Consulte sempre seu médico para decidir quais exames são apropriados para você e para interpretar seus resultados."
            `;
        default:
            return "";
    }
  }

  const fetchContent = async (type: ResourceType) => {
    setIsLoading(prev => ({ ...prev, [type]: true }));
    
    const prompt = getPromptForType(type);

    if (type === 'mealHistory' && prompt.startsWith("Nenhum dado")) {
        setContent(prev => ({ ...prev, [type]: prompt }));
        setIsLoading(prev => ({ ...prev, [type]: false }));
        return;
    }
    
    const result = await generateContent(prompt);
    setContent(prev => ({ ...prev, [type]: result }));
    setIsLoading(prev => ({ ...prev, [type]: false }));
  };

  const handleTabClick = (type: ResourceType) => {
    setActiveTab(type);
    if (!content[type] && !isLoading[type]) {
      fetchContent(type);
    }
  }

  const handlePrint = () => {
    const contentEl = printableContentRef.current;
    if (!contentEl) {
      console.error("Elemento para impressão não encontrado.");
      return;
    }
    const title = resourceConfig[activeTab]?.title || "GlicoSync";

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Por favor, habilite os pop-ups para que a impressão funcione.");
      return;
    }

    const stylesHtml = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('');

    const contentHtml = contentEl.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @media print {
              body {
                margin: 1.5rem;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Force light mode for printing */
              body, div, p, h1, h2, h3, h4, li, strong, table, th, td, span {
                background: transparent !important;
                color: #000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              a, a:visited {
                text-decoration: none;
                color: #000 !important;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };
  
  const currentConfig = resourceConfig[activeTab];
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Recursos Online</h1>
      
      <div className="bg-slate-800 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="border-b border-slate-700">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto" aria-label="Tabs">
            {(Object.keys(resourceConfig) as ResourceType[]).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-sky-400 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {resourceConfig[tab].title}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
             <>
                {activeTab === 'mealHistory' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-700">
                    <div>
                      <label htmlFor="analysisDate" className="block text-sm font-medium text-slate-400">Selecione a Data</label>
                      <input id="analysisDate" type="date" value={analysisDate} onChange={(e) => setAnalysisDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100"/>
                    </div>
                    <div>
                      <label htmlFor="analysisMealType" className="block text-sm font-medium text-slate-400">Filtrar por Refeição</label>
                      <select id="analysisMealType" value={analysisMealType} onChange={(e) => setAnalysisMealType(e.target.value as MealTypeFilter)} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100">
                        <option value="Todos">Todas</option>
                        <option value="Café da Manhã">Café da Manhã</option>
                        <option value="Almoço">Almoço</option>
                        <option value="Jantar">Jantar</option>
                        <option value="Lanche">Lanche</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-slate-200">{currentConfig?.title}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            disabled={isLoading[activeTab] || !content[activeTab]}
                            className="flex items-center bg-slate-600 text-white font-bold py-2 px-3 rounded-md hover:bg-slate-500 transition-colors shadow-sm disabled:bg-slate-600/50 disabled:cursor-not-allowed"
                            title="Salvar ou Imprimir"
                        >
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Salvar / Imprimir
                        </button>
                        <button onClick={() => fetchContent(activeTab)} disabled={isLoading[activeTab]} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light disabled:bg-slate-600 flex items-center min-w-[120px] justify-center">{isLoading[activeTab] ? <Spinner/> : currentConfig?.buttonText}</button>
                    </div>
                </div>

                <div className="mt-4 p-4 border border-slate-700 rounded-lg bg-slate-900 min-h-[300px]">
                  {isLoading[activeTab] ? (
                    <div className="flex justify-center items-center h-full"><Spinner size="lg" color="sky"/></div>
                  ) : content[activeTab] ? (
                    <div ref={printableContentRef}>
                        <MarkdownRenderer content={content[activeTab]} />
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 py-10">Clique no botão para gerar o conteúdo.</p>
                  )}
                </div>
             </>
        </div>
      </div>
    </div>
  );
};