import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon } from './icons/CloseIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { Spinner } from './Spinner';
import { generateContent } from '../services/geminiService';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ManualModalProps {
  onClose: () => void;
}

const manualPrompt = `Aja como um redator técnico criando um manual do usuário completo e amigável para um aplicativo de controle de diabetes chamado 'GlicoSync'. O manual deve ser formatado em Markdown e ser fácil de ler e imprimir.

O manual deve cobrir as seguintes seções em detalhes:

1.  **Introdução ao GlicoSync:**
    *   O que é o GlicoSync e qual seu objetivo.
    *   Breve visão geral das principais funcionalidades.

2.  **Primeiros Passos:**
    *   Como configurar seu 'Meu Perfil' (nome, idade, tipo de diabetes, etc.).

3.  **Painel de Controle (Dashboard):**
    *   Explicação de cada widget: Ação Rápida, Alertas do Dia, Resumo do Perfil, estatísticas de glicemia e os gráficos.

4.  **Agenda:**
    *   Como visualizar seus eventos diários no calendário.
    *   Como adicionar novos compromissos (consultas, exames, etc.).

5.  **Controle de Glicemia:**
    *   Como registrar uma nova leitura de glicemia.
    *   Como visualizar o histórico e o gráfico de tendência.
    *   Como exportar os dados em CSV.
    *   Como configurar os alertas de hipoglicemia e hiperglicemia.

6.  **Registro de Refeições:**
    *   Como adicionar refeições e informações nutricionais.
    *   Como filtrar e visualizar o histórico de refeições.

7.  **Controle de Medicamentos:**
    *   Como cadastrar um novo medicamento.
    *   Como configurar e gerenciar lembretes (horários e dias da semana).
    *   Como editar e excluir medicamentos.

8.  **Histórico de Exames:**
    *   Como registrar resultados de exames.
    *   Como visualizar o gráfico de evolução da Hemoglobina Glicada (HbA1c).
    *   Como filtrar o histórico.

9.  **Contatos Importantes:**
    *   Como adicionar e gerenciar contatos (médicos, familiares, emergência, etc.).
    *   Como visualizar a lista telefônica organizada por categoria.

10. **Recursos Online:**
    *   Explicação de como usar a IA para gerar receitas, planos de exercícios, dicas e outras informações úteis.
    *   Como salvar o conteúdo gerado.

11. **Configurações:**
    *   Como fazer backup de todos os seus dados para um arquivo JSON.
    *   Como personalizar quais informações aparecem no seu Painel de Controle.

12. **Dicas Finais e Avisos:**
    *   Reforce que o GlicoSync é uma ferramenta de apoio e não substitui o acompanhamento médico profissional.

Use títulos (##) e subtítulos (###) claros para cada seção e listas com marcadores (*) para facilitar a leitura. Mantenha uma linguagem simples e encorajadora.`;

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const printableContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchManual = async () => {
      try {
        const cachedManual = localStorage.getItem('glicosync-manual');
        if (cachedManual) {
          setContent(cachedManual);
        } else {
          const result = await generateContent(manualPrompt);
          setContent(result);
          localStorage.setItem('glicosync-manual', result);
        }
      } catch (error) {
        console.error("Failed to fetch user manual:", error);
        setContent("Não foi possível carregar o manual. Por favor, tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchManual();
  }, []);

  const handlePrint = () => {
    const contentEl = printableContentRef.current;
    if (!contentEl) {
      console.error("Elemento para impressão não encontrado.");
      return;
    }
    const title = "Manual do Usuário GlicoSync";

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 print:hidden" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-100">Manual do Usuário GlicoSync</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} disabled={isLoading || !content} className="flex items-center gap-2 bg-slate-600 text-white font-bold py-2 px-3 rounded-md hover:bg-slate-500 transition-colors disabled:bg-slate-600/50 disabled:cursor-not-allowed" title="Salvar ou Imprimir">
              <PrinterIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Salvar / Imprimir</span>
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 rounded-full hover:bg-slate-700">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner size="lg" color="sky" />
            </div>
          ) : (
            <div ref={printableContentRef}>
                <MarkdownRenderer content={content} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};