
import React, { useState, useRef } from 'react';
import type { DashboardConfig, GlucoseAlertsConfig, UserAccount } from '../types';
import { ToggleSwitch } from './ToggleSwitch';
import { ManualModal } from './ManualModal';
import { DownloadIcon } from './icons/DownloadIcon';
import { BookIcon } from './icons/BookIcon';
import { EditIcon } from './icons/EditIcon';
import { AlertIcon } from './icons/AlertIcon';
import JSZip from 'jszip';
import { Spinner } from './Spinner';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface SettingsProps {
  allData: Record<string, any>;
  dashboardConfig: DashboardConfig;
  setDashboardConfig: React.Dispatch<React.SetStateAction<DashboardConfig>>;
  glucoseAlertsConfig: GlucoseAlertsConfig;
  setGlucoseAlertsConfig: React.Dispatch<React.SetStateAction<GlucoseAlertsConfig>>;
  user: UserAccount;
}

export const Settings: React.FC<SettingsProps> = ({ allData, dashboardConfig, setDashboardConfig, glucoseAlertsConfig, setGlucoseAlertsConfig, user }) => {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    try {
      const dataString = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `GlicoSync_Backup_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
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

  const handleRestoreClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!window.confirm("ATENÇÃO: Importar dados irá SUBSTITUIR os dados atuais do seu perfil. Deseja continuar?")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              if (typeof data !== 'object') throw new Error("Arquivo inválido");

              const userId = user.id;
              const saveIf = (key: string, val: any) => {
                  if (val) localStorage.setItem(`glicosync-cache-${userId}-${key}`, JSON.stringify(val));
              }
              
              saveIf('profile', data.profile);
              saveIf('glucose', data.glucoseReadings);
              saveIf('medications', data.medications);
              saveIf('insulin-schedules', data.insulinSchedules);
              saveIf('insulin-records', data.insulinRecords);
              saveIf('contacts', data.contacts);
              saveIf('exams', data.exams);
              saveIf('meals', data.meals);
              saveIf('appointments', data.appointments);
              saveIf('hydration', data.hydrationRecords);
              saveIf('glucose-alerts', data.glucoseAlertsConfig);
              saveIf('dashboard-config', data.dashboardConfig);

              alert("Dados importados com sucesso! A página será recarregada.");
              window.location.reload();
          } catch (err) {
              alert("Erro ao ler o arquivo de backup.");
              console.error(err);
          }
      };
      reader.readAsText(file);
  };
  
  const handleProjectDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const filePaths = ['index.html', 'index.tsx', 'metadata.json', 'App.tsx', 'types.ts', 'sw.js', 'glicosync-icon.svg', 'manifest.webmanifest'];
      for (const path of filePaths) {
        const response = await fetch(`/${path}`);
        if (response.ok) {
            const content = await response.text();
            zip.file(path, content);
        }
      }
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "glicosync-publish.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erro ao gerar zip.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDashboardConfigChange = (key: keyof DashboardConfig, value: any) => {
    setDashboardConfig(prev => ({ ...prev, [key]: value }));
  };

  const dashboardOptions: { key: keyof DashboardConfig; label: string; description: string }[] = [
    { key: 'showQuickActions', label: 'Painel de Ações Rápidas', description: 'Exibir o cartão de atalhos no topo do dashboard.' },
    { key: 'showQuickGlucose', label: 'Botão: Registrar Glicemia', description: 'Atalho rápido para registrar níveis de glicose.' },
    { key: 'showQuickMeal', label: 'Botão: Adicionar Refeição', description: 'Atalho rápido para o diário alimentar.' },
    { key: 'showQuickMedication', label: 'Botão: Marcar Medicamento', description: 'Atalho rápido para controle de medicamentos.' },
    { key: 'showQuickInsulin', label: 'Botão: Controle de Insulina', description: 'Atalho rápido para registro de insulina.' },
    { key: 'showAlerts', label: 'Alertas do Dia', description: 'Mostrar o quadro de alertas e lembretes diários.' },
    { key: 'showProfileSummary', label: 'Dicas do Dia (IA)', description: 'Exibir dicas de bons hábitos geradas por inteligência artificial.' },
    { key: 'showHydration', label: 'Hidratação Diária', description: 'Mostrar o controle de ingestão de líquidos.' },
    { key: 'showHealthNews', label: 'Notícias Online (IA)', description: 'Exibir notícias recentes sobre diabetes e saúde.' },
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
                enabled={dashboardConfig[key] !== false}
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
        <p className="text-slate-400 mb-6">Receba avisos no painel de controle quando seus níveis de glicemia estiverem fora do intervalo.</p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              <ToggleSwitch
                enabled={glucoseAlertsConfig.lowEnabled}
                onChange={(enabled) => setGlucoseAlertsConfig(prev => ({ ...prev, lowEnabled: enabled }))}
              />
              <label className="font-medium text-slate-300">Alerta de Glicemia Baixa</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={glucoseAlertsConfig.lowThreshold}
                onChange={(e) => setGlucoseAlertsConfig(prev => ({ ...prev, lowThreshold: parseInt(e.target.value, 10) || 0 }))}
                className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
                disabled={!glucoseAlertsConfig.lowEnabled}
              />
              <span className="text-sm text-slate-400">mg/dL</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3 mb-2 sm:mb-0">
              <ToggleSwitch
                enabled={glucoseAlertsConfig.highEnabled}
                onChange={(enabled) => setGlucoseAlertsConfig(prev => ({ ...prev, highEnabled: enabled }))}
              />
              <label className="font-medium text-slate-300">Alerta de Glicemia Alta</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={glucoseAlertsConfig.highThreshold}
                onChange={(e) => setGlucoseAlertsConfig(prev => ({ ...prev, highThreshold: parseInt(e.target.value, 10) || 0 }))}
                className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
                disabled={!glucoseAlertsConfig.highEnabled}
              />
              <span className="text-sm text-slate-400">mg/dL</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <DownloadIcon className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Sincronização e Backup</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-white font-bold mb-2">Exportar Dados</h3>
                <button onClick={handleBackup} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                  Baixar Backup
                </button>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
                <h3 className="text-white font-bold mb-2">Restaurar Dados</h3>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                <button onClick={handleRestoreClick} className="w-full bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 transition-colors">
                  Importar Arquivo
                </button>
            </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <BookIcon className="h-6 w-6 text-sky-400" />
          <h2 className="text-xl font-semibold text-slate-200">Manual do Usuário</h2>
        </div>
        <button onClick={() => setIsManualOpen(true)} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors">
          Visualizar e Imprimir Manual
        </button>
      </div>

      {isManualOpen && <ManualModal onClose={() => setIsManualOpen(false)} />}
    </div>
  );
};
