import React, { useMemo, useState, useEffect } from 'react';
import type { UserProfile, GlucoseReading, Medication, Exam, Appointment, GlucoseAlertsConfig, DashboardConfig } from '../types';
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

interface DashboardProps {
  profile: UserProfile;
  glucoseReadings: GlucoseReading[];
  medications: Medication[];
  exams: Exam[];
  appointments: Appointment[];
  setCurrentView: (view: string) => void;
  glucoseAlertsConfig: GlucoseAlertsConfig;
  dashboardConfig: DashboardConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, glucoseReadings, medications, exams, appointments, setCurrentView, glucoseAlertsConfig, dashboardConfig }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // This timer will trigger a re-render every minute, which will update
    // any time-sensitive information on the dashboard, like the water reminder.
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); 

    return () => clearInterval(timer);
  }, []);

  const latestReading = glucoseReadings.length > 0 ? glucoseReadings[0] : null;
  const averageGlucose = glucoseReadings.length > 0
    ? (glucoseReadings.reduce((acc, r) => acc + r.value, 0) / glucoseReadings.length).toFixed(1)
    : 'N/A';

  const getGlucoseStatus = (value: number) => {
    if (value < 70) return { text: 'Baixa', color: 'text-cyan-400' };
    if (value > 180) return { text: 'Alta', color: 'text-red-400' };
    return { text: 'Normal', color: 'text-green-400' };
  };

  const latestStatus = latestReading ? getGlucoseStatus(latestReading.value) : null;
  
  const last7DaysReadings = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    return glucoseReadings
      .filter(reading => new Date(reading.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [glucoseReadings]);

  const dailyAlerts = useMemo(() => {
    const alerts: { text: string; type: 'info' | 'warning', icon: React.FC<any> }[] = [];
    const today = currentTime.toISOString().split('T')[0];
    const currentHour = currentTime.getHours(); // Use state for current hour

    const todaysAppointments = appointments.filter(a => new Date(a.date).toISOString().split('T')[0] === today);
    if (todaysAppointments.length > 0) {
      alerts.push({ text: `Você tem ${todaysAppointments.length} compromisso(s) hoje.`, type: 'info', icon: ClipboardIcon });
    }
    
    const todaysExams = exams.filter(e => e.date === today);
    if (todaysExams.length > 0) {
      alerts.push({ text: `Você tem ${todaysExams.length} exame(s) hoje.`, type: 'info', icon: TestTubeIcon });
    }

    if (medications.some(m => m.reminderEnabled)) {
        alerts.push({ text: 'Não se esqueça dos seus medicamentos hoje.', type: 'info', icon: MedicationIcon });
    }
    
    // Add periodic water reminder
    // Shows between 8am and 10pm (22h), on hours divisible by 4 (8, 12, 16, 20)
    if (currentHour >= 8 && currentHour <= 22 && currentHour % 4 === 0) {
        alerts.push({ text: 'Lembrete amigável: Beba água e mantenha-se hidratado!', type: 'info', icon: WaterDropIcon });
    }

    const todaysReadings = glucoseReadings.filter(r => new Date(r.date).toISOString().split('T')[0] === today);
    
    if (glucoseAlertsConfig.lowEnabled) {
      const lowReadings = todaysReadings.filter(r => r.value < glucoseAlertsConfig.lowThreshold).length;
      if (lowReadings > 0) {
        alerts.push({ 
          text: `Atenção: Você teve ${lowReadings} leitura(s) de glicemia abaixo de ${glucoseAlertsConfig.lowThreshold} mg/dL hoje.`, 
          type: 'warning', 
          icon: GlucoseIcon 
        });
      }
    }
    
    if (glucoseAlertsConfig.highEnabled) {
      const highReadings = todaysReadings.filter(r => r.value > glucoseAlertsConfig.highThreshold).length;
      if (highReadings > 0) {
        alerts.push({ 
          text: `Atenção: Você teve ${highReadings} leitura(s) de glicemia acima de ${glucoseAlertsConfig.highThreshold} mg/dL hoje.`, 
          type: 'warning', 
          icon: GlucoseIcon 
        });
      }
    }

    return alerts;
  }, [glucoseReadings, medications, exams, appointments, currentTime, glucoseAlertsConfig]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DashboardIcon className="h-8 w-8 text-sky-400" />
        <h1 className="text-3xl font-bold text-slate-100">Painel de Controle</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dashboardConfig.showQuickActions && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 text-slate-100 flex flex-col h-full">
              <h2 className="text-xl font-semibold mb-4">Ação Rápida</h2>
              <button
                  onClick={() => setCurrentView('glicemia')}
                  className="w-full flex items-center justify-center gap-3 text-lg bg-brand-blue text-white font-bold py-4 px-6 rounded-lg hover:bg-brand-blue-light transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-brand-blue-light mt-auto"
              >
                  <GlucoseIcon className="w-6 h-6" />
                  Registrar Glicemia
              </button>
          </div>
        )}

        {dashboardConfig.showAlerts && (
          <div className={`bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 text-slate-100 ${!dashboardConfig.showQuickActions ? 'md:col-span-2' : ''}`}>
              <div className="flex items-center mb-4">
                <AlertIcon className="w-6 h-6 text-sky-400 mr-3" />
                <h2 className="text-xl font-semibold">Alertas do Dia</h2>
              </div>
              {dailyAlerts.length > 0 ? (
                <ul className="space-y-3">
                  {dailyAlerts.map((alert, index) => {
                    const Icon = alert.icon;
                    return (
                      <li key={index} className="flex items-start p-3 rounded-lg bg-slate-700/50 ring-1 ring-slate-700">
                        <div className="flex-shrink-0 pt-0.5">
                            <Icon className="w-5 h-5 text-sky-400" />
                        </div>
                        <span className="ml-3 font-medium">{alert.text}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex items-center p-3 rounded-lg bg-slate-700/50 ring-1 ring-slate-700">
                   <CheckIcon className="w-6 h-6 text-green-400" />
                   <span className="ml-3 font-semibold">Nenhum alerta para hoje. Continue assim!</span>
                </div>
              )}
          </div>
        )}
      </div>
      
      {dashboardConfig.showProfileSummary && <ProfileSummary profile={profile} />}
      
      {dashboardConfig.showGlucoseStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-slate-700/50 rounded-full">
              <GlucoseIcon className="w-6 h-6 text-sky-400"/>
            </div>
            <div>
              <p className="text-sm text-slate-400">Última Glicemia</p>
              {latestReading ? (
                <p className="text-2xl font-bold">
                  {latestReading.value} mg/dL 
                  <span className={`ml-2 text-sm font-semibold ${latestStatus?.color}`}>({latestStatus?.text})</span>
                </p>
              ) : (
                <p className="text-2xl font-bold">N/A</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-xl shadow-lg ring-1 ring-slate-700 flex items-center space-x-4">
            <div className="p-3 bg-slate-700/50 rounded-full">
              <TargetIcon className="w-6 h-6 text-sky-400"/>
            </div>
            <div>
              <p className="text-sm text-slate-400">Média Glicêmica</p>
              <p className="text-2xl font-bold">{averageGlucose} mg/dL</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
             <p className="text-sm text-slate-400">Tipo de Diabetes</p>
             <p className="text-2xl font-bold">{profile.diabetesType}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardConfig.show7DayChart && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">Glicemia nos Últimos 7 Dias</h2>
            {last7DaysReadings.length > 0 ? (
              <div className="h-80">
                <GlucoseChart data={last7DaysReadings} />
              </div>
            ) : (
              <p className="text-center text-slate-400 py-10">Não há registros de glicemia nos últimos 7 dias para exibir o gráfico.</p>
            )}
          </div>
        )}

        {dashboardConfig.showFullHistoryChart && (
          <div className={`bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-slate-700 ${!dashboardConfig.show7DayChart ? 'lg:col-span-2' : ''}`}>
            <h2 className="text-xl font-semibold mb-4 text-slate-100">Histórico de Glicemia Completo</h2>
            {glucoseReadings.length > 0 ? (
              <div className="h-80">
                <GlucoseChart data={glucoseReadings} />
              </div>
            ) : (
              <p className="text-center text-slate-400 py-10">Não há registros de glicemia para exibir o gráfico.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};