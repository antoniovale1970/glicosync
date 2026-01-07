import React, { useMemo, useState, useEffect } from 'react';
import type {
  UserProfile,
  GlucoseReading,
  Medication,
  Exam,
  Appointment,
  GlucoseAlertsConfig,
  DashboardConfig,
  HydrationRecord,
  UserAccount,
} from '../types';
import { GlucoseChart } from './GlucoseChart';
import { GlucoseIcon } from './icons/GlucoseIcon';
import { TargetIcon } from './icons/TargetIcon';
import { ProfileSummary } from './ProfileSummary';
import { DashboardIcon } from './icons/DashboardIcon';
import { AlertIcon } from './icons/AlertIcon';
import { CheckIcon } from './icons/CheckIcon';
import { MedicationIcon } from './icons/MedicationIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { WaterDropIcon } from './icons/WaterDropIcon';
import { HealthNews } from './HealthNews';
import { HydrationWidget } from './HydrationWidget';
import { AppleIcon } from './icons/AppleIcon';
import { SyringeIcon } from './icons/SyringeIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { GlicoSyncIcon } from './icons/GlicoSyncIcon';

interface DashboardProps {
  profile: UserProfile;
  glucoseReadings: GlucoseReading[];
  medications: Medication[];
  exams: Exam[];
  appointments: Appointment[];
  setCurrentView: (view: string) => void;
  glucoseAlertsConfig: GlucoseAlertsConfig;
  dashboardConfig: DashboardConfig;
  hydrationRecords: HydrationRecord[];
  setHydrationRecords: React.Dispatch<React.SetStateAction<HydrationRecord[]>>;
  user?: UserAccount;
}

// Tipagem explícita para evitar "type never" no build (Netlify/tsc)
type NextMedication = {
  name: string;
  time: string;
  dosage: string;
};

// Botão de Ação Rápida Padrão
const QuickActionButton = ({
  icon: Icon,
  label,
  colorClass,
  onClick,
}: {
  icon: React.FC<any>;
  label: string;
  colorClass: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="relative group overflow-hidden flex flex-col items-center justify-center gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all shadow-md active:scale-95 h-28 w-full"
  >
    <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-').replace('/20', '')}`} />
    </div>
    <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{label}</span>
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  glucoseReadings,
  medications,
  exams,
  appointments,
  setCurrentView,
  glucoseAlertsConfig,
  dashboardConfig,
  hydrationRecords,
  setHydrationRecords,
  user,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // LOGICA ATUALIZADA: Verifica localStorage para descarte permanente E sessionStorage para descarte na sessão atual
  const [showStorageNotice, setShowStorageNotice] = useState(() => {
    if (!user) return false;
    const dismissKey = `glicosync-storage-notice-dismissed-${user.id}`;
    const sessionKey = `glicosync-storage-notice-session-seen-${user.id}`;

    // Se já marcou para não ver mais (localStorage)
    if (localStorage.getItem(dismissKey)) return false;

    // Se já viu nesta sessão/após o login (sessionStorage)
    if (sessionStorage.getItem(sessionKey)) return false;

    return true;
  });

  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const dismissStorageNotice = () => {
    setShowStorageNotice(false);
    if (user) {
      // Sempre marca no sessionStorage para não aparecer mais nesta sessão de uso
      sessionStorage.setItem(`glicosync-storage-notice-session-seen-${user.id}`, 'true');

      // Se o checkbox estiver marcado, salva no localStorage para nunca mais aparecer
      if (dontShowAgain) {
        localStorage.setItem(`glicosync-storage-notice-dismissed-${user.id}`, 'true');
      }
    }
  };

  const latestReading = glucoseReadings.length > 0 ? glucoseReadings[0] : null;

  // Calculate Average Glucose (Numeric)
  const averageGlucoseValue =
    glucoseReadings.length > 0 ? glucoseReadings.reduce((acc, r) => acc + r.value, 0) / glucoseReadings.length : 0;

  const averageGlucoseDisplay = glucoseReadings.length > 0 ? averageGlucoseValue.toFixed(0) : 'N/A';

  const getGlucoseStatus = (value: number) => {
    if (value < glucoseAlertsConfig.lowThreshold) return { text: 'Baixa', color: 'text-cyan-400', bg: 'bg-cyan-400/20' };
    if (value > glucoseAlertsConfig.highThreshold) return { text: 'Alta', color: 'text-red-400', bg: 'bg-red-400/20' };
    return { text: 'Normal', color: 'text-green-400', bg: 'bg-green-400/20' };
  };

  const latestStatus = latestReading ? getGlucoseStatus(latestReading.value) : null;

  const last7DaysReadings = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return glucoseReadings
      .filter((reading) => new Date(reading.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [glucoseReadings]);

  // --- New Calculations for Progress Summary ---

  const hydrationProgress = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
    const todayTotal = hydrationRecords
      .filter((r) => new Date(r.date).toLocaleDateString('sv-SE') === todayStr)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const goal = 2500;
    const percent = Math.min(100, Math.round((todayTotal / goal) * 100));
    return { total: todayTotal, percent };
  }, [hydrationRecords]);

  const timeInRangeToday = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const todayReadings = glucoseReadings.filter((r) => new Date(r.date).toLocaleDateString('sv-SE') === todayStr);

    if (todayReadings.length === 0) return 0;

    const inRangeCount = todayReadings.filter(
      (r) => r.value >= glucoseAlertsConfig.lowThreshold && r.value <= glucoseAlertsConfig.highThreshold
    ).length;

    return Math.round((inRangeCount / todayReadings.length) * 100);
  }, [glucoseReadings, glucoseAlertsConfig]);

  const recentReadings = useMemo(() => glucoseReadings.slice(0, 5), [glucoseReadings]);

  // Encontra o próximo medicamento para exibição rápida (tipado para evitar "never")
  const nextScheduledMedication = useMemo<NextMedication | null>(() => {
    const todayDayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentTime.getDay()];
    const nowTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    let nextMed: NextMedication | null = null;
    let minTimeDiff = Infinity;

    medications.forEach((med) => {
      if (med.reminderEnabled && med.reminderTimes) {
        med.reminderTimes.forEach((reminder) => {
          if (!reminder.days || reminder.days.length === 0 || reminder.days.includes(todayDayName)) {
            const [remH, remM] = reminder.time.split(':').map(Number);
            const remTotalMinutes = remH * 60 + remM;
            const diff = remTotalMinutes - nowTotalMinutes;

            if (diff > 0 && diff < minTimeDiff) {
              minTimeDiff = diff;
              nextMed = {
                name: med.name,
                time: reminder.time,
                dosage: med.dosage,
              };
            }
          }
        });
      }
    });

    return nextMed;
  }, [medications, currentTime]);

  const dailyAlerts = useMemo(() => {
    const alerts: { text: string; type: 'info' | 'warning'; icon: React.FC<any>; time?: string }[] = [];
    const today = currentTime.toISOString().split('T')[0];
    const todayDayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][currentTime.getDay()];

    const todaysAppointments = appointments.filter((a) => new Date(a.date).toISOString().split('T')[0] === today);
    if (todaysAppointments.length > 0) {
      alerts.push({ text: `Você tem ${todaysAppointments.length} compromisso(s) hoje.`, type: 'info', icon: ClipboardIcon });
    }

    const todaysExams = exams.filter((e) => e.date === today);
    if (todaysExams.length > 0) {
      alerts.push({ text: `Você tem ${todaysExams.length} exame(s) hoje.`, type: 'info', icon: TestTubeIcon });
    }

    // Melhora Alertas de Medicamentos: Especifica Horários e Nomes
    medications.forEach((m) => {
      if (m.reminderEnabled && m.reminderTimes) {
        m.reminderTimes.forEach((rt) => {
          if (!rt.days || rt.days.length === 0 || rt.days.includes(todayDayName)) {
            alerts.push({
              text: `${rt.time} - Tomar ${m.name} (${m.dosage})`,
              type: 'info',
              icon: MedicationIcon,
              time: rt.time,
            });
          }
        });
      }
    });

    const todaysReadings = glucoseReadings.filter((r) => new Date(r.date).toISOString().split('T')[0] === today);

    if (glucoseAlertsConfig.lowEnabled) {
      const lowReadings = todaysReadings.filter((r) => r.value < glucoseAlertsConfig.lowThreshold).length;
      if (lowReadings > 0) {
        alerts.push({
          text: `Atenção: ${lowReadings} leitura(s) abaixo de ${glucoseAlertsConfig.lowThreshold}mg/dL hoje.`,
          type: 'warning',
          icon: GlucoseIcon,
        });
      }
    }

    if (glucoseAlertsConfig.highEnabled) {
      const highReadings = todaysReadings.filter((r) => r.value > glucoseAlertsConfig.highThreshold).length;
      if (highReadings > 0) {
        alerts.push({
          text: `Atenção: ${highReadings} leitura(s) acima de ${glucoseAlertsConfig.highThreshold}mg/dL hoje.`,
          type: 'warning',
          icon: GlucoseIcon,
        });
      }
    }

    // Ordena os alertas por horário se disponível
    return alerts.sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
  }, [glucoseReadings, medications, exams, appointments, currentTime, glucoseAlertsConfig]);

  const bottomWidgets: React.ReactNode[] = [];

  if (dashboardConfig.showProfileSummary) bottomWidgets.push(<ProfileSummary key="profile" profile={profile} />);
  if (dashboardConfig.showHealthNews) bottomWidgets.push(<HealthNews key="news" />);

  const activeQuickActions = [
    dashboardConfig.showQuickGlucose !== false,
    dashboardConfig.showQuickMeal !== false,
    dashboardConfig.showQuickMedication !== false,
    dashboardConfig.showQuickInsulin !== false,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DashboardIcon className="h-8 w-8 text-sky-400" />
          <h1 className="text-3xl font-bold text-slate-100">Painel de Controle</h1>
        </div>
      </div>

      {/* STORAGE NOTICE MODAL */}
      {showStorageNotice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-brand-blue/50 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.2)] max-w-md w-full p-0 relative overflow-hidden flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-blue to-sky-400"></div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="bg-brand-blue/10 p-4 rounded-full mb-5 ring-1 ring-brand-blue/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <GlicoSyncIcon className="w-12 h-12 text-brand-blue-light" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Armazenamento Local</h3>

              <div className="text-slate-300 text-sm space-y-4 mb-6 leading-relaxed">
                <p>
                  Para garantir sua privacidade e acesso offline, o <strong>GlicoSync</strong> salva todos os seus dados{' '}
                  <strong>exclusivamente neste dispositivo</strong>.
                </p>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 text-left">
                  <p className="text-sky-300 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckIcon className="w-3 h-3" /> Como trocar de aparelho?
                  </p>
                  <p className="text-xs text-slate-400">
                    Vá em <strong>Configurações &gt; Backup</strong>, baixe seus dados e importe no novo dispositivo se precisar trocar.
                  </p>
                </div>
              </div>

              {/* OPÇÃO DE NÃO EXIBIR NOVAMENTE */}
              <label className="flex items-center gap-3 mb-8 cursor-pointer group self-start ml-1">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-brand-blue-light focus:ring-brand-blue-light focus:ring-offset-slate-900 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors select-none">
                  Não exibir mais esta mensagem
                </span>
              </label>

              <button
                onClick={dismissStorageNotice}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-brand-blue/25 active:scale-95 text-sm uppercase tracking-wide"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP SECTION: Quick Actions & Daily Progress --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        {dashboardConfig.showQuickActions && (
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Ações Rápidas</h2>
              <button
                onClick={() => setCurrentView('configuracoes')}
                className="text-slate-400 hover:text-white transition-colors"
                title="Configurar atalhos"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>

            <div className={`grid gap-3 ${activeQuickActions > 2 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2'}`}>
              {dashboardConfig.showQuickGlucose !== false && (
                <QuickActionButton icon={GlucoseIcon} label="Glicemia" colorClass="bg-blue-500" onClick={() => setCurrentView('glicemia')} />
              )}

              {dashboardConfig.showQuickInsulin !== false && (
                <QuickActionButton icon={SyringeIcon} label="Insulina" colorClass="bg-purple-500" onClick={() => setCurrentView('insulina')} />
              )}

              {dashboardConfig.showQuickMeal !== false && (
                <QuickActionButton icon={AppleIcon} label="Refeição" colorClass="bg-green-500" onClick={() => setCurrentView('refeicoes')} />
              )}

              {dashboardConfig.showQuickMedication !== false && (
                <QuickActionButton icon={MedicationIcon} label="Remédio" colorClass="bg-orange-500" onClick={() => setCurrentView('medicamentos')} />
              )}
            </div>
          </div>
        )}

        {/* Daily Progress Summary */}
        <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 flex flex-col justify-between overflow-hidden">
          <h2 className="text-lg font-semibold text-slate-100 mb-3">Progresso do Dia</h2>

          {/* Hydration Bar */}
          {dashboardConfig.showHydration && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <WaterDropIcon className="w-3 h-3 text-blue-400" /> Hidratação
                </span>
                <span className="text-xs font-bold text-slate-200">{hydrationProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${hydrationProgress.percent}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-right">{hydrationProgress.total}ml / 2500ml</p>
            </div>
          )}

          {/* Time in Range Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <TargetIcon className="w-3 h-3 text-green-400" /> Tempo no Alvo (Hoje)
              </span>
              <span className="text-xs font-bold text-slate-200">{timeInRangeToday}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  timeInRangeToday > 70 ? 'bg-green-500' : timeInRangeToday > 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${timeInRangeToday}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MIDDLE SECTION: Stats & Recent Readings --- */}
      {dashboardConfig.showGlucoseStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Last Reading */}
          <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400 mb-1">Última Glicemia</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{latestReading ? latestReading.value : '--'}</span>
                  <span className="text-xs text-slate-500">mg/dL</span>
                </div>
                {latestStatus && (
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${latestStatus.bg} ${latestStatus.color}`}>
                    {latestStatus.text}
                  </span>
                )}
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <GlucoseIcon className="w-6 h-6 text-sky-400" />
              </div>
            </div>
          </div>

          {/* Card 2: Avg Stats */}
          <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-400 mb-1">Média Geral</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{averageGlucoseDisplay}</span>
                  <span className="text-xs text-slate-500">mg/dL</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Baseado em {glucoseReadings.length} registros</p>
              </div>
              <div className="bg-slate-700/50 p-2 rounded-lg">
                <TargetIcon className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          {/* NOVO CARD: Próximo Medicamento - ALTA VISIBILIDADE */}
          <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 overflow-hidden border-l-4 border-emerald-500">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-sm text-slate-400 mb-1 uppercase tracking-tight font-bold">Próximo Medicamento</p>
                {nextScheduledMedication ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400 font-mono">{nextScheduledMedication.time}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-1 truncate">{nextScheduledMedication.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase">{nextScheduledMedication.dosage}</p>
                  </>
                ) : (
                  <div className="flex flex-col mt-2">
                    <span className="text-slate-500 text-sm italic">Nada para hoje</span>
                    <span className="text-[10px] text-slate-600">Confira sua agenda</span>
                  </div>
                )}
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-lg flex-shrink-0">
                <MedicationIcon className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Card 4: Recent List */}
          <div className="bg-slate-800 p-0 rounded-xl shadow-lg ring-1 ring-slate-700 flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <HistoryIcon className="w-4 h-4" /> Últimos Registros
              </h3>
              <button onClick={() => setCurrentView('glicemia')} className="text-[10px] text-sky-400 hover:underline">
                Ver tudo
              </button>
            </div>
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1 max-h-[100px]">
              {recentReadings.length > 0 ? (
                recentReadings.map((r) => {
                  const status = getGlucoseStatus(r.value);
                  return (
                    <div key={r.id} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-700/50 rounded transition-colors">
                      <span className="text-slate-400 font-mono">
                        {new Date(r.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                        {new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`font-bold ${status.color}`}>{r.value}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Sem dados recentes</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION: ALERTS & HYDRATION (Side by Side) --- */}
      {(dashboardConfig.showAlerts || dashboardConfig.showHydration) && (
        <div className={`grid grid-cols-1 ${dashboardConfig.showAlerts && dashboardConfig.showHydration ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Alerts Column */}
          {dashboardConfig.showAlerts && (
            <div className="h-full min-h-[300px] min-w-0">
              <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 h-full overflow-hidden flex flex-col">
                <div className="flex items-center mb-4 pb-2 border-b border-slate-700 shrink-0">
                  <AlertIcon className="w-5 h-5 text-sky-400 mr-2" />
                  <h2 className="text-lg font-semibold text-slate-200">Alertas e Lembretes</h2>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-1">
                  {dailyAlerts.length > 0 ? (
                    <ul className="space-y-3">
                      {dailyAlerts.map((alert, index) => {
                        const Icon = alert.icon;
                        const isMedAlert = alert.icon === MedicationIcon;
                        return (
                          <li
                            key={index}
                            className={`flex items-start p-3 rounded-xl border ${
                              isMedAlert ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-700/30 border-slate-700/50'
                            }`}
                          >
                            <div className={`flex-shrink-0 p-2 rounded-lg ${isMedAlert ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                              <Icon className={`w-5 h-5 ${isMedAlert ? 'text-emerald-400' : alert.type === 'warning' ? 'text-red-400' : 'text-sky-400'}`} />
                            </div>
                            <div className="ml-4 overflow-hidden">
                              <span className="text-sm font-bold text-slate-100 block leading-tight">{alert.text}</span>
                              {alert.time && (
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 inline-block bg-emerald-500/10 px-1.5 rounded">
                                  Hoje às {alert.time}
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                      <CheckIcon className="w-10 h-10 text-green-500/20 mb-2" />
                      <span className="text-sm text-slate-400">Tudo tranquilo por aqui!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hydration Widget Column */}
          {dashboardConfig.showHydration && (
            <div className="h-full min-h-[300px] min-w-0">
              <HydrationWidget records={hydrationRecords} setRecords={setHydrationRecords} />
            </div>
          )}
        </div>
      )}

      {/* --- SECTION: CHARTS (Side by Side) --- */}
      {(dashboardConfig.show7DayChart || dashboardConfig.showFullHistoryChart) && (
        <div className={`grid grid-cols-1 ${dashboardConfig.show7DayChart && dashboardConfig.showFullHistoryChart ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* 7-Day Chart Column */}
          {dashboardConfig.show7DayChart && (
            <div className="h-full min-h-[350px] min-w-0">
              <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 h-full overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h2 className="text-lg font-semibold text-slate-200">Tendência (7 Dias)</h2>
                </div>
                {last7DaysReadings.length > 0 ? (
                  <div className="flex-grow min-h-0">
                    <GlucoseChart data={last7DaysReadings} />
                  </div>
                ) : (
                  <div className="flex-grow flex items-center justify-center bg-slate-900/30 rounded-lg border border-slate-700 border-dashed">
                    <p className="text-slate-500 text-sm">Insira dados de glicemia para ver o gráfico.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full History Chart Column */}
          {dashboardConfig.showFullHistoryChart && (
            <div className="h-full min-h-[350px] min-w-0">
              <div className="bg-slate-800 p-5 rounded-xl shadow-lg ring-1 ring-slate-700 h-full overflow-hidden flex flex-col">
                <h2 className="text-lg font-semibold mb-4 text-slate-200 shrink-0">Histórico Completo</h2>
                <div className="flex-grow min-h-0">
                  {glucoseReadings.length > 0 ? (
                    <GlucoseChart data={glucoseReadings} />
                  ) : (
                    <p className="text-center text-slate-500 py-10">Sem dados suficientes.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- BOTTOM WIDGETS --- */}
      {bottomWidgets.length > 0 && (
        <div className={`grid grid-cols-1 ${bottomWidgets.length >= 2 ? 'lg:grid-cols-2' : ''} gap-6`}>
          {bottomWidgets.map((widget, index) => (
            <div key={index} className="h-full min-h-[300px] min-w-0">
              {widget}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
