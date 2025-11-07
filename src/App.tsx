import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { GlucoseLog } from './components/GlucoseLog';
import { Profile } from './components/Profile';
import { Medications } from './components/Medications';
import { Contacts } from './components/Contacts';
import { Resources } from './components/Resources';
import { Exams } from './components/Exams';
import { MealLog } from './components/MealLog';
import { CalendarView } from './components/CalendarView';
import { PhoneList } from './components/PhoneList';
import { Settings } from './components/Settings';
import type { UserProfile, GlucoseReading, Medication, Contact, Exam, Meal, Appointment, GlucoseAlertsConfig, DashboardConfig } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MenuIcon } from './components/icons/MenuIcon';
import { UserIcon } from './components/icons/UserIcon';
import { LocationWeather } from './components/LocationWeather';


export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  const [profile, setProfile] = useLocalStorage<UserProfile>('diabetes-app-profile', {
    name: 'Usuário',
    age: '',
    weight: '',
    height: '',
    diabetesType: 'Tipo 1',
    photo: '',
    allergies: [],
  });
  const [glucoseReadings, setGlucoseReadings] = useLocalStorage<GlucoseReading[]>('diabetes-app-glucose', []);
  const [medications, setMedications] = useLocalStorage<Medication[]>('diabetes-app-medications', []);
  const [contacts, setContacts] = useLocalStorage<Contact[]>('diabetes-app-contacts', []);
  const [exams, setExams] = useLocalStorage<Exam[]>('diabetes-app-exams', []);
  const [meals, setMeals] = useLocalStorage<Meal[]>('diabetes-app-meals', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('diabetes-app-appointments', []);
  const [alertsShown, setAlertsShown] = useLocalStorage<Record<string, string>>('diabetes-app-alerts-shown', {});
  const [glucoseAlertsConfig, setGlucoseAlertsConfig] = useLocalStorage<GlucoseAlertsConfig>('diabetes-app-glucose-alerts', {
    lowEnabled: true,
    highEnabled: true,
    lowThreshold: 70,
    highThreshold: 180,
  });
  const [dashboardConfig, setDashboardConfig] = useLocalStorage<DashboardConfig>('diabetes-app-dashboard-config', {
    showQuickActions: true,
    showAlerts: true,
    showProfileSummary: true,
    showGlucoseStats: true,
    show7DayChart: true,
    showFullHistoryChart: true,
  });


  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    installPromptEvent.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPromptEvent(null);
    });
  };

  useEffect(() => {
    const reminderInterval = setInterval(() => {
      const now = new Date();
      // Use 'sv-SE' locale for a reliable YYYY-MM-DD format in the user's local timezone.
      const localDateStr = now.toLocaleDateString('sv-SE');
      const localTimeStr = now.toTimeString().slice(0, 5); // HH:MM
      const dayMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const currentDay = dayMap[now.getDay()];


      // Use functional updates for setAlertsShown to avoid needing 'alertsShown' in the dependency array.
      setAlertsShown(currentAlerts => {
        let alertsHaveChanged = false;
        const newAlerts = { ...currentAlerts };

        // --- Medication Reminders ---
        medications.forEach(med => {
          if (med.reminderEnabled && med.reminderTimes) {
            med.reminderTimes.forEach(reminder => {
              // Check if the reminder is for today. If 'days' is not set or empty, it's for every day.
              const isForToday = !reminder.days || reminder.days.length === 0 || reminder.days.includes(currentDay);

              if (reminder.time === localTimeStr && isForToday) {
                const alertKey = `med-${med.id}-${reminder.time}`;
                if (newAlerts[alertKey] !== localDateStr) {
                  const noteMessage = reminder.note ? `\n\nNota: ${reminder.note}` : '';
                  window.alert(`Lembrete: Hora de tomar seu medicamento!\n\n${med.name} (${med.dosage})${noteMessage}`);
                  newAlerts[alertKey] = localDateStr;
                  alertsHaveChanged = true;
                }
              }
            });
          }
        });

        // --- Exam Reminders (Daily Check) ---
        exams.forEach(exam => {
          if (exam.reminderEnabled) {
              let reminderTriggerDateStr: string | null = null;
              let reminderMessage = `Lembrete de Exame: Hoje é o dia do seu exame de ${exam.name}!`;

              if (exam.reminderConfig) { // New system with specific config
                  const examDateObj = new Date(exam.date + 'T00:00:00');
                  const examDateFormatted = new Intl.DateTimeFormat('pt-BR').format(examDateObj);

                  if (exam.reminderConfig.type === 'specificDate') {
                      reminderTriggerDateStr = exam.reminderConfig.value as string;
                      reminderMessage = `Lembrete: Seu exame de ${exam.name} está agendado para ${examDateFormatted}.`;
                  } else if (exam.reminderConfig.type === 'daysBefore') {
                      const reminderDate = new Date(examDateObj);
                      const daysBefore = Number(exam.reminderConfig.value);
                      reminderDate.setDate(reminderDate.getDate() - daysBefore);
                      reminderTriggerDateStr = reminderDate.toISOString().split('T')[0];
                      const plural = daysBefore > 1 ? 's' : '';
                      reminderMessage = `Lembrete: Seu exame de ${exam.name} é em ${daysBefore} dia${plural} (${examDateFormatted}).`;
                  }
              } else { // Old system (backward compatibility) - default to day-of reminder
                  reminderTriggerDateStr = exam.date;
              }

              if (reminderTriggerDateStr && reminderTriggerDateStr === localDateStr) {
                  const alertKey = `exam-${exam.id}-${reminderTriggerDateStr}`;
                  if (newAlerts[alertKey] !== localDateStr) {
                      window.alert(reminderMessage);
                      newAlerts[alertKey] = localDateStr;
                      alertsHaveChanged = true;
                  }
              }
          }
        });
        
        // --- Appointment Reminders (Exact Time Check) ---
        appointments.forEach(appt => {
          if (appt.reminderEnabled) {
            const apptTime = new Date(appt.date);
            if (
              apptTime.getFullYear() === now.getFullYear() &&
              apptTime.getMonth() === now.getMonth() &&
              apptTime.getDate() === now.getDate() &&
              apptTime.getHours() === now.getHours() &&
              apptTime.getMinutes() === now.getMinutes()
            ) {
              const alertKey = `appt-${appt.id}`;
              const apptIdentifier = appt.date;
              if (newAlerts[alertKey] !== apptIdentifier) {
                const contact = appt.contactId ? contacts.find(c => c.id === appt.contactId) : null;
                const contactInfo = contact ? ` com ${contact.name}` : '';
                const noteMessage = appt.notes ? `\n\nNotas: ${appt.notes}` : '';

                window.alert(`Lembrete de Compromisso: Agora é hora do seu compromisso!\n\n${appt.title}${contactInfo}${noteMessage}`);
                newAlerts[alertKey] = apptIdentifier;
                alertsHaveChanged = true;
              }
            }
          }
        });
        
        // Only update state if an alert was actually shown.
        return alertsHaveChanged ? newAlerts : currentAlerts;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(reminderInterval);
  }, [medications, exams, appointments, contacts, setAlertsShown]);


  const sortedGlucoseReadings = useMemo(() => {
    return [...glucoseReadings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [glucoseReadings]);

  const renderView = () => {
    const allData = { profile, glucoseReadings, medications, contacts, exams, meals, appointments, glucoseAlertsConfig, dashboardConfig };

    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
                  profile={profile} 
                  glucoseReadings={sortedGlucoseReadings} 
                  medications={medications}
                  exams={exams}
                  appointments={appointments}
                  setCurrentView={setCurrentView}
                  glucoseAlertsConfig={glucoseAlertsConfig}
                  dashboardConfig={dashboardConfig}
                />;
      case 'agenda':
        return <CalendarView 
                  glucoseReadings={glucoseReadings} 
                  medications={medications} 
                  exams={exams} 
                  meals={meals} 
                  appointments={appointments}
                  setAppointments={setAppointments}
                  contacts={contacts}
                />;
      case 'glicemia':
        return <GlucoseLog readings={sortedGlucoseReadings} setReadings={setGlucoseReadings} />;
      case 'refeicoes':
        return <MealLog meals={meals} setMeals={setMeals} />;
      case 'medicamentos':
        return <Medications medications={medications} setMedications={setMedications} />;
      case 'exames':
        return <Exams exams={exams} setExams={setExams} contacts={contacts} />;
      case 'contatos':
        return <Contacts contacts={contacts} setContacts={setContacts} />;
      case 'listaTelefonica':
        return <PhoneList contacts={contacts} />;
      case 'recursos':
        return <Resources profile={profile} glucoseReadings={sortedGlucoseReadings} medications={medications} meals={meals} exams={exams} />;
      case 'perfil':
        return <Profile profile={profile} setProfile={setProfile} />;
      case 'configuracoes':
        return <Settings 
                  allData={allData} 
                  dashboardConfig={dashboardConfig} 
                  setDashboardConfig={setDashboardConfig}
                  glucoseAlertsConfig={glucoseAlertsConfig}
                  setGlucoseAlertsConfig={setGlucoseAlertsConfig}
                />;
      default:
        return <Dashboard 
                  profile={profile} 
                  glucoseReadings={sortedGlucoseReadings} 
                  medications={medications}
                  exams={exams}
                  appointments={appointments}
                  setCurrentView={setCurrentView}
                  glucoseAlertsConfig={glucoseAlertsConfig}
                  dashboardConfig={dashboardConfig}
                />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-gray-800">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        isSidebarCompact={isSidebarCompact}
        setIsSidebarCompact={setIsSidebarCompact} 
        installPromptEvent={installPromptEvent}
        handleInstallClick={handleInstallClick}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 rounded-md hover:text-white hover:bg-slate-700">
              <MenuIcon className="h-6 w-6" />
            </button>
            {/* Weather/Location info shown only on dashboard on medium screens and up */}
            <div className="hidden md:flex">
                {currentView === 'dashboard' && <LocationWeather />}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-slate-100 text-right hidden lg:block">Olá, {profile.name}!</h1>
              <div className="h-10 w-10 rounded-full bg-slate-700 flex-shrink-0">
                  {profile.photo ? (
                      <img src={profile.photo} alt="Foto de perfil" className="h-full w-full rounded-full object-cover" />
                  ) : (
                      <div className="h-full w-full rounded-full bg-slate-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-slate-400" />
                      </div>
                  )}
              </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-background p-4 sm:p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}