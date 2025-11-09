import React, { useState } from 'react';
import type { DashboardConfig, GlucoseAlertsConfig } from '../types';
import { ToggleSwitch } from './ToggleSwitch';
import { ManualModal } from './ManualModal';
import { DownloadIcon } from './icons/DownloadIcon';
import { BookIcon } from './icons/BookIcon';
import { EditIcon } from './icons/EditIcon';
import { AlertIcon } from './icons/AlertIcon';
import JSZip from 'jszip';
import { Spinner } from './Spinner';
import { ShareIcon } from './icons/ShareIcon';

interface SettingsProps {
  allData: Record<string, any>;
  dashboardConfig: DashboardConfig;
  setDashboardConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>;
  glucoseAlertsConfig: GlucoseAlertsConfig;
  setGlucoseAlertsConfig: React.Dispatch<React.SetStateAction<GlucoseAlertsConfig>>;
}

export const Settings: React.FC<SettingsProps> = ({ allData, dashboardConfig, setDashboardConfig, glucoseAlertsConfig, setGlucoseAlertsConfig }) => {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleBackup = () => {
    try {
      const dataString = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `glicosync_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create backup:", error);
      alert("Ocorreu um erro ao gerar o arquivo de backup.");
    }
  };
  
  const handleProjectDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      const filePaths = [
        'index.html', 'index.tsx', 'metadata.json', 'App.tsx', 'types.ts',
        'sw.js', 'glicosync-icon.svg', 'manifest.webmanifest',
        'hooks/useLocalStorage.ts', 'hooks/useCurrentTime.ts',
        'services/geminiService.ts',
        'components/Sidebar.tsx', 'components/Dashboard.tsx', 'components/GlucoseLog.tsx',
        'components/Profile.tsx', 'components/Medications.tsx', 'components/Contacts.tsx',
        'components/Resources.tsx', 'components/Exams.tsx', 'components/MealLog.tsx',
        'components/CalendarView.tsx', 'components/PhoneList.tsx', 'components/Settings.tsx',
        'components/GlucoseChart.tsx', 'components/ProfileSummary.tsx', 'components/ExamChart.tsx',
        'components/ToggleSwitch.tsx', 'components/Spinner.tsx', 'components/MarkdownRenderer.tsx',
        'components/LocationWeather.tsx', 'components/ManualModal.tsx',
        // All icons
        'components/icons/AlertIcon.tsx', 'components/icons/AppleIcon.tsx',
        'components/icons/BookIcon.tsx', 'components/icons/CalendarIcon.tsx',
        'components/icons/CheckIcon.tsx', 'components/icons/ChevronLeftIcon.tsx',
        'components/icons/ChevronRightIcon.tsx', 'components/icons/ChevronsLeftIcon.tsx',
        'components/icons/ChevronsRightIcon.tsx', 'components/icons/ClipboardIcon.tsx',
        'components/icons/ClockIcon.tsx', 'components/icons/CloseIcon.tsx',
        'components/icons/ContactIcon.tsx', 'components/icons/DashboardIcon.tsx',
        'components/icons/DownloadIcon.tsx', 'components/icons/EditIcon.tsx',
        'components/icons/EmailIcon.tsx', 'components/icons/ExportIcon.tsx',
        'components/icons/GlicoSyncIcon.tsx', 'components/icons/GlobeIcon.tsx',
        'components/icons/GlucoseIcon.tsx', 'components/icons/HealthIcon.tsx',
        'components/icons/HospitalIcon.tsx', 'components/icons/InstallIcon.tsx',
        'components/icons/MapPinIcon.tsx', 'components/icons/MealIcon.tsx',
        'components/icons/MedicationIcon.tsx', 'components/icons/MenuIcon.tsx',
        'components/icons/PharmacyIcon.tsx', 'components/icons/PhoneBookIcon.tsx',
        'components/icons/PlusIcon.tsx', 'components/icons/PrinterIcon.tsx',
        'components/icons/SaveIcon.tsx', 'components/icons/SettingsIcon.tsx',
        'components/icons/ShareIcon.tsx',
        'components/icons/TargetIcon.tsx', 'components/icons/TestTubeIcon.tsx',
        'components/icons/TrashIcon.tsx', 'components/icons/UserIcon.tsx',
        'components/icons/WaterDropIcon.tsx', 'components/icons/WeatherIcon.tsx',
        'components/icons/WifiIcon.tsx'
      ];

      for (const path of filePaths) {
        // Use a try-catch block for each file to handle potential 404s gracefully
        try {
            const response = await fetch(`/${path}`);
            if (response.ok) {
                const content = await response.text();
                zip.file(path, content);
            } else {
                console.warn(`Could not fetch file: ${path}, status: ${response.status}`);
            }
        } catch (fileError) {
             console.error(`Error fetching file ${path}:`, fileError);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "glicosync-publish.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to create project zip:", error);
      alert("Ocorreu um erro ao gerar o arquivo .zip do projeto.");
    } finally {
      setIsDownloading(false);
    }
  };


  const handleDashboardConfigChange = (key: keyof DashboardConfig, value: boolean) => {
    setDashboardConfig(prev => ({ ...prev, [key]: value }));
  };

  const dashboardOptions: { key: keyof DashboardConfig; label: string; description: string }[] = [
    { key: 'showQuickActions', label: 'Ação Rápida', description: 'Exibir o botão "Registrar Glicemia" para acesso rápido.' },
    { key: 'showAlerts', label: 'Alertas do Dia', description: 'Mostrar o quadro de alertas e lembretes diários.' },
    { key: 'showProfileSummary', label: 'Resumo do Perfil (IA)', description: 'Exibir o resumo motivacional gerado pela inteligência artificial.' },
    { key: 'showGlucoseStats', label: 'Estatísticas Gerais', description: 'Mostrar os cartões com a última glicemia, média e tipo de diabetes.' },
    { key: 'show7DayChart', label: 'Gráfico de 7 Dias', description: 'Exibir o gráfico com a tendência de glicemia da última semana.' },
    { key: 'showFullHistoryChart', label: 'Gráfico de Histórico Completo', description: 'Mostrar o gráfico com todos os registros de glicemia.' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Configurações</h1>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <EditIcon className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Personalização do Painel de Controle</h2>
        </div>
        <p className="text-slate-400 mb-6">Escolha quais informações você deseja visualizar na sua tela inicial.</p>
        <div className="space-y-4">
          {dashboardOptions.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <h3 className="font-medium text-slate-200">{label}</h3>
                <p className="text-sm text-slate-400">{description}</p>
              </div>
              <ToggleSwitch
                enabled={dashboardConfig[key]}
                onChange={(enabled) => handleDashboardConfigChange(key, enabled)}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <AlertIcon className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Configuração de Alertas de Glicemia</h2>
        </div>
        <p className="text-slate-400 mb-6">Receba avisos no painel de controle quando seus níveis de glicemia estiverem fora do intervalo desejado.</p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              <ToggleSwitch
                enabled={glucoseAlertsConfig.lowEnabled}
                onChange={(enabled) => setGlucoseAlertsConfig(prev => ({ ...prev, lowEnabled: enabled }))}
              />
              <label className="font-medium text-slate-300 select-none">Alerta de Glicemia Baixa (Hipoglicemia)</label>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <label htmlFor="lowThreshold" className="text-sm text-slate-400">Abaixo de:</label>
              <input
                id="lowThreshold"
                type="number"
                value={glucoseAlertsConfig.lowThreshold}
                onChange={(e) => setGlucoseAlertsConfig(prev => ({ ...prev, lowThreshold: parseInt(e.target.value, 10) || 0 }))}
                className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500"
                disabled={!glucoseAlertsConfig.lowEnabled}
              />
              <span className="text-sm font-semibold text-slate-400">mg/dL</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              <ToggleSwitch
                enabled={glucoseAlertsConfig.highEnabled}
                onChange={(enabled) => setGlucoseAlertsConfig(prev => ({ ...prev, highEnabled: enabled }))}
              />
              <label className="font-medium text-slate-300 select-none">Alerta de Glicemia Alta (Hiperglicemia)</label>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <label htmlFor="highThreshold" className="text-sm text-slate-400">Acima de:</label>
              <input
                id="highThreshold"
                type="number"
                value={glucoseAlertsConfig.highThreshold}
                onChange={(e) => setGlucoseAlertsConfig(prev => ({ ...prev, highThreshold: parseInt(e.target.value, 10) || 0 }))}
                className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-sky-500 focus:border-sky-500"
                disabled={!glucoseAlertsConfig.highEnabled}
              />
              <span className="text-sm font-semibold text-slate-400">mg/dL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <DownloadIcon className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Backup de Dados</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Exporte todos os seus dados (perfil, registros, contatos, etc.) para um arquivo JSON. Guarde este arquivo em um local seguro.
        </p>
        <button
          onClick={handleBackup}
          className="flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors shadow-sm"
        >
          Exportar Dados Locais (JSON)
        </button>
      </div>

       <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <ShareIcon className="h-6 w-6 text-sky-400 -rotate-90" />
          <h2 className="text-xl font-semibold text-slate-200">Publicar Aplicação</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Baixe todos os arquivos da aplicação em um formato .zip. Você pode usar este arquivo para hospedar o GlicoSync em um serviço web como Netlify ou Vercel e acessá-lo de qualquer lugar.
        </p>
        <button
          onClick={handleProjectDownload}
          disabled={isDownloading}
          className="flex items-center justify-center bg-brand-blue-light text-white font-bold py-2 px-4 rounded-md hover:bg-sky-600 transition-colors shadow-sm disabled:bg-slate-600"
        >
          {isDownloading ? <Spinner size="sm" /> : 'Baixar Arquivos para Publicação (.zip)'}
        </button>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <BookIcon className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Manual do Usuário</h2>
        </div>
        <p className="text-slate-400 mb-4">
          Aprenda a usar todas as funcionalidades do GlicoSync com nosso manual completo. Você pode visualizar e imprimir para referência.
        </p>
        <button
          onClick={() => setIsManualOpen(true)}
          className="flex items-center justify-center bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm"
        >
          Visualizar e Imprimir Manual
        </button>
      </div>

      {isManualOpen && <ManualModal onClose={() => setIsManualOpen(false)} />}
    </div>
  );
};