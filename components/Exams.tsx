
import React, { useState, useMemo, useEffect } from 'react';
import type { Exam, Contact, UserProfile, GlucoseReading } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ExamChart } from './ExamChart';
import { ToggleSwitch } from './ToggleSwitch';
import { ClockIcon } from './icons/ClockIcon';
import { EditIcon } from './icons/EditIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ExportIcon } from './icons/ExportIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { generateContent, generateDocumentAnalysis } from '../services/geminiService';
import { Spinner } from './Spinner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { HealthIcon } from './icons/HealthIcon';
import { BookIcon } from './icons/BookIcon';
import { AlertIcon } from './icons/AlertIcon';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SearchIcon } from './icons/SearchIcon';
import { ConfirmModal } from './ConfirmModal';
import { PdfIcon } from './icons/PdfIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { HelpIcon } from './icons/HelpIcon';
import { WifiIcon } from './icons/WifiIcon';

interface ExamsProps {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  contacts: Contact[];
  profile: UserProfile;
  glucoseReadings: GlucoseReading[];
}

const DEFAULT_EXAM_DEFINITIONS: Record<string, string> = {
  'Albumina': 'Avalia o estado nutricional e a função do fígado e rins.',
  'Amilase e Lipase': 'Enzimas digestivas usadas para diagnosticar pancreatite e outras doenças pancreáticas.',
  'Anticorpos anti-HIV': 'Rastreamento e diagnóstico da infecção pelo vírus HIV.',
  'Anticorpos antinucleares (FAN)': 'Utilizado na investigação de doenças autoimunes, como Lupus.',
  'Anticorpos para hepatite B e C': 'Rastreamento de infecções virais hepáticas.',
  'Antiestreptolisina O (ASLO)': 'Detecta infecções estreptocócicas recentes, útil em febre reumática.',
  'AST e ALT (TGO/TGP)': 'Enzimas marcadoras de lesão nas células do fígado (hepatocelular).',
  'Beta-HCG (Gravidez)': 'Confirmação e monitoramento de gravidez (Qualitativo ou Quantitativo).',
  'Bilirrubinas': 'Avalia a função hepática e problemas nas vias biliares (icterícia).',
  'Cálcio': 'Essencial para saúde óssea, função muscular e nervosa.',
  'CK-MB': 'Enzima cardíaca utilizada para investigar infarto do miocárdio.',
  'Colesterol VLDL': 'Lipoproteína de muito baixa densidade, transporta triglicerídeos.',
  'Creatinina': 'Principal marcador da função renal (filtração dos rins).',
  'Cultura de escarro': 'Identifica bactérias ou fungos em infecções respiratórias.',
  'Dímero D': 'Usado para excluir a presença de trombose venosa ou embolia pulmonar.',
  'Eletroforese de hemoglobina': 'Identifica tipos anormais de hemoglobina (ex: anemia falciforme).',
  'Estradiol': 'Hormônio sexual importante para função ovariana e saúde óssea.',
  'Exame de fezes (Sangue Oculto)': 'Rastreamento de sangramentos gastrointestinais invisíveis.',
  'Fósforo': 'Mineral importante para ossos e metabolismo energético.',
  'FSH e LH': 'Hormônios que regulam a função reprodutiva e gonadal.',
  'Gasometria arterial': 'Mede pH, oxigênio e CO2 no sangue. Avalia função pulmonar e metabólica.',
  'Glicemia de Jejum': 'Mede o nível de glicose no sangue após período sem comer. Básico para diabetes.',
  'Hemoglobina Glicada (HbA1c)': 'Média da glicemia nos últimos 3 meses. Padrão ouro para controle do diabetes.',
  'Hemograma Completo': 'Avalia células sanguíneas: anemia (hemácias), infecções (leucócitos) e coagulação (plaquetas).',
  'Magnésio': 'Importante para função muscular, nervosa e controle glicêmico.',
  'Perfil Lipídico': 'Conjunto completo: Colesterol Total, HDL, LDL, VLDL e Triglicerídeos.',
  'Perfil Reumático': 'Conjunto de exames para investigar doenças reumatológicas/inflamatórias.',
  'Prolactina': 'Hormônio responsável pela produção de leite; níveis altos afetam a fertilidade.',
  'Proteína C-reativa (PCR)': 'Marcador sensível de inflamação ou infecção aguda no corpo.',
  'PSA': 'Antígeno Prostático Específico, usado no rastreio de câncer de próstata.',
  'Sódio e Potássio': 'Eletrólitos vitais para hidratação, pressão arterial e função cardíaca.',
  'Tempo de protrombina (TP)': 'Avalia a via extrínseca da coagulação sanguínea.',
  'Tempo de tromboplastina parcial ativada (TTPA)': 'Avalia a via intrínseca da coagulação sanguínea.',
  'Teste de tolerância à glicose (TTG)': 'Curva glicêmica. Avalia a resposta do corpo a uma sobrecarga de açúcar.',
  'Testosterona': 'Principal hormônio sexual masculino, afeta libido, massa muscular e energia.',
  'Toxoplasmose (IgM e IgG)': 'Detecta infecção pelo parasita Toxoplasma gondii.',
  'Triglicerídeos': 'Tipo de gordura no sangue, associado a risco cardíaco e dieta.',
  'Troponinas': 'Marcador mais específico para diagnóstico de infarto agudo do miocárdio.',
  'TSH e T4 livre': 'Avaliam o funcionamento da tireoide (hipo ou hipertireoidismo).',
  'Ureia e Creatinina': 'Avaliação conjunta da função renal.',
  'Urina tipo I (EAS)': 'Análise física, química e microscópica da urina. Detecta infecções e problemas renais.',
  'VDRL': 'Teste de triagem para Sífilis.',
  'Vitamina D': 'Importante para absorção de cálcio, saúde óssea e sistema imune.',
};

export const Exams: React.FC<ExamsProps> = ({ exams, setExams, contacts, profile, glucoseReadings }) => {
  const [customExamDefinitions, setCustomExamDefinitions] = useLocalStorage<Record<string, string>>('glicosync-custom-exams', {});
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

  const allExamDefinitions = useMemo(() => {
      return { ...DEFAULT_EXAM_DEFINITIONS, ...customExamDefinitions };
  }, [customExamDefinitions]);

  const sortedExamNames = useMemo(() => {
      const names = Object.keys(allExamDefinitions).sort();
      return [...names, 'Outro'];
  }, [allExamDefinitions]);

  const [examType, setExamType] = useState(sortedExamNames[0]);
  const [previousExamType, setPreviousExamType] = useState(sortedExamNames[0]);
  const [examSearch, setExamSearch] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState('');
  const [unit, setUnit] = useState('');
  const [resultStatus, setResultStatus] = useState<'normal' | 'borderline' | 'abnormal' | undefined>(undefined);
  const [location, setLocation] = useState('');
  
  const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderType, setReminderType] = useState<'daysBefore' | 'specificDate'>('daysBefore');
  const [reminderValue, setReminderValue] = useState<string>('1');

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzingExam, setIsAnalyzingExam] = useState(false);

  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');

  const [nameFilter, setNameFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const [exportFormat, setExportFormat] = useState('csv');

  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [suggestions, setSuggestions] = useState('');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const laboratories = useMemo(() => {
    return contacts.filter(c => c.type === 'Laboratório' || c.type === 'Clínica' || c.type === 'Hospital');
  }, [contacts]);

  const statusCounts = useMemo(() => {
    return {
        all: exams.length,
        pending: exams.filter(e => !e.completed).length,
        completed: exams.filter(e => e.completed).length
    };
  }, [exams]);

  const uniqueExamTypesInHistory = useMemo(() => {
      return [...new Set(exams.map(e => e.name))].sort();
  }, [exams]);

  const filteredExamOptions = useMemo(() => {
      if (!examSearch) return sortedExamNames;
      return sortedExamNames.filter(name => 
          name.toLowerCase().includes(examSearch.toLowerCase())
      );
  }, [examSearch, sortedExamNames]);

  const isNumericExam = useMemo(() => {
      return [
          'Hemoglobina Glicada (HbA1c)',
          'Glicemia de Jejum',
          'Colesterol Total',
          'Colesterol HDL',
          'Colesterol LDL',
          'Triglicerídeos',
          'Creatinina',
          'Microalbuminúria',
          'Vitamina D',
          'PSA'
      ].includes(examType);
  }, [examType]);

  useEffect(() => {
      if (examType === 'Hemoglobina Glicada (HbA1c)' && !unit) setUnit('%');
      if (['Glicemia de Jejum', 'Colesterol Total', 'Triglicerídeos'].includes(examType) && !unit) setUnit('mg/dL');
  }, [examType]);

  const handleExamTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = e.target.value;
      if (selected === 'Outro') {
          setPreviousExamType(examType);
          setExamType(selected);
          setNewTypeName('');
          setNewTypeDesc('');
          setIsNewTypeModalOpen(true);
      } else {
          setExamType(selected);
      }
  };

  const handleSaveNewType = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = newTypeName.trim();
      if (!trimmedName) return;
      const exists = Object.keys(allExamDefinitions).some(k => k.toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
          alert(`O tipo de exame "${trimmedName}" já consta na lista.`);
          return;
      }
      setCustomExamDefinitions(prev => ({
          ...prev,
          [trimmedName]: newTypeDesc.trim() || 'Tipo de exame personalizado.'
      }));
      setExamType(trimmedName);
      setIsNewTypeModalOpen(false);
  };

  const handleCancelNewType = () => {
      if (previousExamType) setExamType(previousExamType);
      setIsNewTypeModalOpen(false);
  };

  const handleReminderTypeChange = (type: 'daysBefore' | 'specificDate') => {
      setReminderType(type);
      if (type === 'daysBefore') {
          setReminderValue('1');
      } else {
          try {
              const examDateObj = new Date(date);
              examDateObj.setDate(examDateObj.getDate() - 1);
              setReminderValue(examDateObj.toISOString().split('T')[0]);
          } catch (e) {
              setReminderValue(new Date().toISOString().split('T')[0]);
          }
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) {
              alert("O arquivo é muito grande (Máx: 5MB).");
              e.target.value = '';
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setFileData(reader.result as string);
              setFileName(file.name);
              setFileType(file.type);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveFile = () => {
      setFileData(null);
      setFileName('');
      setFileType('');
  };

  const resetForm = () => {
    setExamType(sortedExamNames[0]);
    setExamSearch('');
    setDate(new Date().toISOString().split('T')[0]);
    setResult('');
    setUnit('');
    setResultStatus(undefined);
    setLocation('');
    setReminderEnabled(false);
    setReminderType('daysBefore');
    setReminderValue('1');
    setAiAnalysis('');
    setIsAnalyzingExam(false);
    setEditingId(null);
    handleRemoveFile();
  };

  const handleEditStart = (exam: Exam) => {
    setEditingId(exam.id);
    setDate(exam.date);
    setResult(exam.result);
    setUnit(exam.unit || '');
    setResultStatus(exam.resultStatus);
    setAiAnalysis(exam.aiAnalysis || '');
    
    if (exam.location) {
        setLocation(exam.location);
    } else if (exam.laboratoryId) {
        const lab = contacts.find(c => c.id === exam.laboratoryId);
        setLocation(lab ? lab.name : '');
    } else {
        setLocation('');
    }
    
    if (allExamDefinitions[exam.name]) {
        setExamType(exam.name);
    } else {
        setCustomExamDefinitions(prev => ({ ...prev, [exam.name]: 'Exame importado/antigo' }));
        setExamType(exam.name);
    }

    if (exam.reminderEnabled) {
        setReminderEnabled(true);
        if (exam.reminderConfig) {
            setReminderType(exam.reminderConfig.type);
            setReminderValue(String(exam.reminderConfig.value));
        } else {
            setReminderType('daysBefore');
            setReminderValue('0'); 
        }
    } else {
        setReminderEnabled(false);
        setReminderType('daysBefore');
        setReminderValue('1');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditCancel = () => {
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examType || !date || !result) return;
    if (examType === 'Outro') return;

    const matchedLabId = laboratories.find(l => l.name.toLowerCase() === location.trim().toLowerCase())?.id;

    const examData: Exam = {
      id: editingId || new Date().toISOString(),
      name: examType,
      date,
      result,
      unit,
      resultStatus,
      reminderEnabled,
      reminderConfig: reminderEnabled ? {
          type: reminderType,
          value: reminderType === 'daysBefore' ? (parseInt(reminderValue, 10) || 1) : reminderValue,
      } : undefined,
      location: location.trim() || undefined,
      laboratoryId: matchedLabId, 
      completed: editingId ? (exams.find(e => e.id === editingId)?.completed || false) : false,
      aiAnalysis: aiAnalysis || undefined,
    };
    
    if (editingId) {
        setExams(prev => prev.map(e => e.id === editingId ? examData : e).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } else {
        setExams(prev => [examData, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    
    resetForm();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          setExams(prev => prev.filter(e => e.id !== deleteId));
          if (editingId === deleteId) resetForm();
          setDeleteId(null);
      }
  };

  const handleToggleCompleted = (id: string) => {
    setExams(prev => 
      prev.map(exam =>
        exam.id === id ? { ...exam, completed: !exam.completed } : exam
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const handleClearFilters = () => {
      setNameFilter('');
      setStartDateFilter('');
      setEndDateFilter('');
      setStatusFilter('all');
  };

  const runExamAnalysis = async () => {
      if (!isOnline) return;
      if ((!result && !fileData) || !examType || examType === 'Outro') {
          alert("Preencha o resultado ou anexe um arquivo (PDF/Imagem) para gerar a análise.");
          return;
      }

      setIsAnalyzingExam(true);
      setAiAnalysis('');

      const prompt = `
        Atue como um médico endocrinologista e especialista em análises clínicas focado no cuidado do diabetes.
        Realize uma interpretação detalhada e educativa do resultado de exame fornecido.
        
        ${fileData ? `O usuário forneceu um arquivo (PDF ou Imagem) do exame. Extraia as informações relevantes dele.` : ''}

        **DADOS DO EXAME (Inseridos Manualmente):**
        - Nome: ${examType}
        - Resultado: ${result} ${unit ? `(${unit})` : ''}

        **PERFIL DO PACIENTE:**
        - Idade: ${profile.age || 'Não informada'}
        - Sexo: ${profile.gender || 'Não informado'}
        - Condição: ${profile.diabetesType}
        ${profile.healthConditions && profile.healthConditions.length > 0 ? `- Outras Condições: ${profile.healthConditions.join(', ')}` : ''}

        **SUA TAREFA (Retorne a resposta formatada em Markdown):**

        1. **Valores de Referência e Metas:**
           - Apresente os valores de referência para a população geral.
           - **IMPORTANTE:** Se aplicável, destaque as metas terapêuticas específicas para diabéticos (baseado nas diretrizes da SBD ou ADA).
           - Compare explicitamente o resultado do paciente com esses valores.

        2. **Interpretação Clínica:**
           - Classifique o resultado (Baixo, Normal, Limítrofe, Elevado).
           - Explique de forma fisiológica o que esse resultado indica no contexto do paciente.

        3. **Contexto do Diabetes:**
           - Explique como esse marcador específico se relaciona com o controle glicêmico ou riscos associados (ex: função renal, risco cardiovascular, etc.).

        4. **Orientações e Próximos Passos:**
           - Sugira medidas de estilo de vida (nutrição, atividade física) que podem ajudar a melhorar ou manter esse resultado.
           - Indique perguntas relevantes para o paciente fazer ao seu médico na próxima consulta.
           - *Não prescreva medicamentos nem altere dosagens.*

        Seja claro, empático e preciso. Use negrito para destacar pontos chave.
        Termine com um aviso claro de que esta análise é informativa e não substitui consulta médica.
      `;

      try {
          let analysisResult = '';
          if (fileData) {
              analysisResult = await generateDocumentAnalysis(fileData, fileType, prompt);
              if (!result) {
                 const numberMatch = analysisResult.match(/resultado.*?(\d+([.,]\d+)?)/i);
                 if (numberMatch) setResult(numberMatch[1].replace(',', '.'));
              }
          } else {
              analysisResult = await generateContent(prompt);
          }
          setAiAnalysis(analysisResult);
      } catch (error) {
          console.error("Erro na análise:", error);
          setAiAnalysis("Não foi possível gerar a análise no momento.");
      } finally {
          setIsAnalyzingExam(false);
      }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const timeZoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + timeZoneOffset);
    return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
  }
  
  const formatReminder = (exam: Exam) => {
    if (!exam.reminderEnabled) return <span className="text-slate-500 italic">Desativado</span>;
    if (exam.reminderConfig) {
      if (exam.reminderConfig.type === 'daysBefore') {
        const days = exam.reminderConfig.value;
        const plural = Number(days) > 1 ? 's' : '';
        const dayText = Number(days) === 0 ? 'No dia' : `${days} dia${plural} antes`;
        return <span className="text-sky-400 font-medium">Ativado ({dayText})</span>;
      }
      if (exam.reminderConfig.type === 'specificDate') {
        return <span className="text-sky-400 font-medium">Ativado ({formatDate(exam.reminderConfig.value as string)})</span>;
      }
    }
    return <span className="text-sky-400 font-medium">Ativado (No dia)</span>;
  };

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const nameMatch = exam.name.toLowerCase().includes(nameFilter.toLowerCase());
      const examDate = exam.date;
      let dateMatch = true;
      if (startDateFilter) dateMatch = dateMatch && examDate >= startDateFilter;
      if (endDateFilter) dateMatch = dateMatch && examDate <= endDateFilter;
      let statusMatch = true;
      if (statusFilter === 'pending') statusMatch = !exam.completed;
      else if (statusFilter === 'completed') statusMatch = !!exam.completed;
      return nameMatch && dateMatch && statusMatch;
    });
  }, [exams, nameFilter, startDateFilter, endDateFilter, statusFilter]);

  const chartData = useMemo(() => {
    let targetExams: Exam[] = [];
    let chartTitle = "Evolução do Resultado";
    let chartUnit = "";
    const isFiltering = nameFilter || startDateFilter || endDateFilter || statusFilter !== 'all';
    if (isFiltering) {
        targetExams = filteredExams;
        chartTitle = nameFilter ? `Evolução: ${nameFilter}` : "Evolução (Filtro Atual)";
    } else if (examType && examType !== 'Outro') {
        targetExams = exams.filter(e => e.name === examType);
        chartTitle = `Histórico: ${examType}`;
    } else {
        targetExams = exams.filter(e => e.name.toLowerCase().includes('hemoglobina glicada'));
        chartTitle = "Evolução: Hemoglobina Glicada (HbA1c)";
    }
    const units = targetExams.map(e => e.unit).filter(Boolean);
    if (units.length > 0) chartUnit = units[0] as string;
    return { data: targetExams.slice(0, 15).reverse(), title: chartTitle, unit: chartUnit };
  }, [exams, filteredExams, nameFilter, startDateFilter, endDateFilter, statusFilter, examType]);

  const generateSuggestions = async () => {
      if (!isOnline) return;
      setIsLoadingSuggestions(true);
      setSuggestions('');
      const averageGlucose = glucoseReadings.length > 0 
        ? `${(glucoseReadings.reduce((acc, r) => acc + r.value, 0) / glucoseReadings.length).toFixed(1)} mg/dL`
        : 'N/A';
      const prompt = `
        Aja como um assistente de saúde especializado em diabetes.
        Analise o seguinte perfil de paciente:
        - Tipo de Diabetes: ${profile.diabetesType}
        - Média de Glicemia Recente: ${averageGlucose}
        Exames já registrados no sistema:
        ${exams.length > 0 ? exams.map(e => `- ${e.name} (Data: ${e.date})`).join('\n') : 'Nenhum exame registrado.'}
        Sugerir de 3 a 5 exames recomendados. Formate em Markdown.
      `;
      try {
          const result = await generateContent(prompt);
          setSuggestions(result);
      } catch (e) {
          setSuggestions("Erro ao gerar sugestões. Tente novamente mais tarde.");
      } finally {
          setIsLoadingSuggestions(false);
      }
  };

  const renderStatusBadge = (status?: 'normal' | 'borderline' | 'abnormal') => {
      if (status === 'normal') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">Normal</span>;
      if (status === 'borderline') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-300 border border-yellow-700">Atenção</span>;
      if (status === 'abnormal') return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">Alterado</span>;
      return null;
  };

  const getTrendIcon = (currentExam: Exam, allExams: Exam[]) => {
      const history = allExams
        .filter(e => e.name === currentExam.name && e.id !== currentExam.id && new Date(e.date) < new Date(currentExam.date))
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (history.length === 0) return null;
      const prevExam = history[0];
      const currentVal = parseFloat(currentExam.result.replace(/[^0-9.,]/g, '').replace(',', '.'));
      const prevVal = parseFloat(prevExam.result.replace(/[^0-9.,]/g, '').replace(',', '.'));
      if (isNaN(currentVal) || isNaN(prevVal)) return null;
      if (currentVal > prevVal) return <ArrowUpIcon className="w-4 h-4 text-slate-400 inline" />;
      if (currentVal < prevVal) return <ArrowDownIcon className="w-4 h-4 text-slate-400 inline" />;
      return <span className="text-slate-500 font-bold text-xs px-1">=</span>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Meus Exames</h1>
      
      <div className={`bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 border-l-4 ${editingId ? 'border-yellow-500' : 'border-brand-blue'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${editingId ? 'text-yellow-400' : 'text-slate-200'}`}>
                {editingId ? 'Editar Exame' : 'Adicionar Exame'}
            </h2>
            {editingId && (
                <button onClick={handleEditCancel} className="text-slate-400 hover:text-white">
                    <CloseIcon className="w-6 h-6" />
                </button>
            )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="examType" className="block text-sm font-medium text-slate-400 mb-1">Tipo de Exame</label>
                  <select
                    id="examType"
                    value={examType}
                    onChange={handleExamTypeChange}
                    className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  >
                    {filteredExamOptions.length > 0 ? (
                        filteredExamOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)
                    ) : (
                        <option disabled>Nenhum exame encontrado</option>
                    )}
                  </select>
                </div>
                <div>
                    <label htmlFor="examSearch" className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                        <SearchIcon className="w-4 h-4" />
                        Buscar tipo de exame
                    </label>
                    <input
                        id="examSearch"
                        type="text"
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        placeholder="Digite para buscar..."
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-4">
                    {examType && allExamDefinitions[examType] && (
                        <div className="bg-sky-900/30 border border-sky-700/50 p-3 rounded-lg flex items-start gap-3 h-full">
                            <BookIcon className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <span className="text-sky-300 font-bold text-sm block mb-1">{examType}</span>
                                <p className="text-sky-100 text-sm">{allExamDefinitions[examType]}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="examDate" className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                    <input
                        id="examDate"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        required
                    />
                </div>
                <div className="md:col-span-1">
                  <label htmlFor="examUnit" className="block text-sm font-medium text-slate-400 mb-1">Unidade (Opcional)</label>
                  <input
                    id="examUnit"
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ex: %, mg/dL"
                  />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="examLocation" className="block text-sm font-medium text-slate-400 mb-1">Local do Exame (Opcional)</label>
                    <input
                        id="examLocation"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        placeholder="Ex: Laboratório São Lucas..."
                    />
                    <div className="mt-2 flex items-center gap-3">
                        <label className="text-sm text-slate-400 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-700 transition-colors">
                             <PdfIcon className="w-5 h-5 text-red-400" />
                             <span className="text-xs font-medium text-slate-300">Enviar PDF/Imagem</span>
                             <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                        {fileName && (
                            <div className="flex items-center gap-2 bg-slate-700 px-2 py-1 rounded-md border border-slate-600">
                                <span className="text-xs text-slate-300 truncate max-w-[150px]">{fileName}</span>
                                <button type="button" onClick={handleRemoveFile} className="text-slate-400 hover:text-white"><CloseIcon className="w-3 h-3" /></button>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Status do Resultado</label>
                    <div className="flex gap-2 bg-slate-700 p-1 rounded-lg border border-slate-600">
                        {['normal', 'borderline', 'abnormal'].map(s => (
                            <button key={s} type="button" onClick={() => setResultStatus(s as any)} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${resultStatus === s ? (s === 'normal' ? 'bg-green-600' : s === 'borderline' ? 'bg-yellow-600' : 'bg-red-600') + ' text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                                {s === 'normal' ? 'Normal' : s === 'borderline' ? 'Atenção' : 'Alterado'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-700 pt-4 mt-2">
                <div className="flex flex-col h-full">
                  <label htmlFor="examResult" className="block text-sm font-medium text-slate-400 mb-1">Resultado</label>
                  {isNumericExam ? (
                      <input id="examResult" type="number" step="0.01" value={result} onChange={(e) => setResult(e.target.value)} className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-lg" required />
                  ) : (
                      <textarea id="examResult" value={result} onChange={(e) => setResult(e.target.value)} className="block w-full h-[200px] px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-none" required />
                  )}
                </div>

                <div className="flex flex-col h-full">
                    <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
                        <HealthIcon className="w-4 h-4 text-purple-400" />
                        Análise de Resultado por IA
                    </label>
                    <div className="flex-grow bg-slate-900/50 border border-slate-600 rounded-lg overflow-hidden relative h-[200px] flex flex-col">
                        {isAnalyzingExam ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-3">
                                <Spinner size="lg" color="blue" />
                                <p className="text-sm text-slate-400 animate-pulse">Interpretando resultado...</p>
                            </div>
                        ) : !isOnline && !aiAnalysis ? (
                            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                <WifiIcon className="w-8 h-8 text-slate-600 mb-3" />
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Para analisar seu exame com IA, o <strong className="text-slate-200">GlicoSync deve estar conectado à internet</strong>.
                                </p>
                            </div>
                        ) : aiAnalysis ? (
                            <div className="flex flex-col h-full">
                                <div className="flex-grow overflow-y-auto p-3 custom-scrollbar">
                                    <MarkdownRenderer content={aiAnalysis} />
                                </div>
                                <div className="p-3 bg-yellow-900/40 border-t border-yellow-700/50 text-xs text-yellow-200 flex items-start gap-2">
                                    <AlertIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                                    <span className="font-medium leading-snug">Aviso: Análise automática. Consulte seu médico.</span>
                                </div>
                                <button type="button" onClick={() => setAiAnalysis('')} className="absolute top-2 right-2 text-slate-500 hover:text-white bg-slate-800 rounded-full p-1"><CloseIcon className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                <p className="text-slate-500 text-sm mb-3">Preencha o resultado e clique abaixo para analisar.</p>
                                <button
                                    type="button"
                                    onClick={runExamAnalysis}
                                    disabled={!result && !fileData || !isOnline}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                >
                                    <HealthIcon className="w-4 h-4" /> Gerar Análise IA
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                {editingId && <button type="button" onClick={handleEditCancel} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500">Cancelar</button>}
                <button type="submit" className={`${editingId ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-blue hover:bg-brand-blue-light'} text-white font-bold py-2 px-4 rounded-md transition-colors shadow-sm min-w-[120px]`}>
                    {editingId ? 'Salvar' : 'Adicionar'}
                </button>
            </div>
        </form>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                  <HealthIcon className="w-8 h-8 text-sky-400" />
                  <div>
                      <h2 className="text-xl font-semibold text-slate-100">Sugestões de Exames com IA</h2>
                      <p className="text-sm text-slate-400">Receba recomendações baseadas no seu perfil.</p>
                  </div>
              </div>
              <button
                  onClick={generateSuggestions}
                  disabled={isLoadingSuggestions || !isOnline}
                  className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light disabled:bg-slate-600 flex items-center min-w-[160px] justify-center"
              >
                  {isLoadingSuggestions ? <Spinner size="sm" /> : 'Gerar Sugestões'}
              </button>
          </div>
          {!isOnline && !suggestions && (
              <div className="mt-6 p-6 flex flex-col items-center justify-center bg-slate-900/50 rounded-lg border border-slate-700 border-dashed text-center">
                  <WifiIcon className="w-8 h-8 text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400">
                      Para gerar sugestões de exames, o <strong className="text-slate-300">GlicoSync deve estar conectado à internet</strong>.
                  </p>
              </div>
          )}
          {suggestions && (
              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 animate-fadeIn">
                  <MarkdownRenderer content={suggestions} />
              </div>
          )}
      </div>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Excluir Exame" message="Deseja excluir este registro de exame?" />
    </div>
  );
};
