
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
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import type { UserProfile, GlucoseReading, Medication, Contact, Exam, Meal, Appointment, GlucoseAlertsConfig, DashboardConfig, UserAccount, HydrationRecord, InsulinSchedule, InsulinRecord } from './types';
import { useSyncState } from './hooks/useSyncState'; 
import { useLocalStorage } from './hooks/useLocalStorage';
import { MenuIcon } from './components/icons/MenuIcon';
import { UserIcon } from './components/icons/UserIcon';
import { LocationWeather } from './components/LocationWeather';
import { InsulinControl } from './components/InsulinControl';
import { WelcomeModal } from './components/WelcomeModal';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { Spinner } from './components/Spinner';
import { CheckIcon } from './components/icons/CheckIcon';
import { AlertIcon } from './components/icons/AlertIcon';
import { LogoutIcon } from './components/icons/LogoutIcon';

// --- COMPONENTE DE SESSÃO DO USUÁRIO ---
const UserSession: React.FC<{ 
  user: { uid: string; email: string; displayName?: string }; 
  onLogout: () => void;
  onDeleteAccount: () => void;
  isAdminViewing?: boolean;
}> = ({ 
  user,
  onLogout,
  onDeleteAccount,
  isAdminViewing = false
}) => {
  const userAccount: UserAccount = {
      id: user.uid,
      username: user.email || 'user',
      name: user.displayName || 'Usuário',
      email: user.email || '',
      password: '' 
  };

  const userId = userAccount.id;

  const [profile, setProfile] = useSyncState<UserProfile>('profile', {
    name: userAccount.name, age: '', birthDate: '', gender: '', bloodType: '', healthConditions: [], weight: '', height: '', diabetesType: '', photo: '', allergies: [],
  }, userId);

  const [glucoseReadings, setGlucoseReadings] = useSyncState<GlucoseReading[]>('glucose', [], userId);
  const [medications, setMedications] = useSyncState<Medication[]>('medications', [], userId);
  const [insulinSchedules, setInsulinSchedules] = useSyncState<InsulinSchedule[]>('insulin-schedules', [], userId);
  const [insulinRecords, setInsulinRecords] = useSyncState<InsulinRecord[]>('insulin-records', [], userId);
  const [contacts, setContacts] = useSyncState<Contact[]>('contacts', [], userId);
  const [exams, setExams] = useSyncState<Exam[]>('exams', [], userId);
  const [meals, setMeals] = useSyncState<Meal[]>('meals', [], userId);
  const [appointments, setAppointments] = useSyncState<Appointment[]>('appointments', [], userId);
  const [hydrationRecords, setHydrationRecords] = useSyncState<HydrationRecord[]>('hydration', [], userId);
  const [glucoseAlertsConfig, setGlucoseAlertsConfig] = useSyncState<GlucoseAlertsConfig>('glucose-alerts', { lowEnabled: true, highEnabled: true, lowThreshold: 70, highThreshold: 180 }, userId);
  const [dashboardConfig, setDashboardConfig] = useSyncState<DashboardConfig>('dashboard-config', { showQuickActions: true, showQuickGlucose: true, showQuickMeal: true, showQuickMedication: true, showQuickInsulin: true, showAlerts: true, showProfileSummary: true, showHealthNews: true, showGlucoseStats: true, show7DayChart: true, showFullHistoryChart: true, showHydration: true }, userId);

  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCompact, setIsSidebarCompact] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [autoEditProfile, setAutoEditProfile] = useState(false);

  useEffect(() => {
    if (isAdminViewing) return; // Não mostrar modal de boas vindas para o admin
    const welcomeKey = `glicosync-welcome-seen-v2-${userId}`;
    if (!localStorage.getItem(welcomeKey)) setShowWelcomeModal(true);
  }, [userId, isAdminViewing]);

  const handleCloseWelcome = (skipProfile: boolean, dontShowAgain: boolean) => {
    setShowWelcomeModal(false);
    
    if (dontShowAgain) {
      const welcomeKey = `glicosync-welcome-seen-v2-${userId}`;
      localStorage.setItem(welcomeKey, 'true');
    }

    if (!skipProfile) {
      setCurrentView('perfil');
    }
  };

  const sortedGlucoseReadings = useMemo(() => {
    return [...glucoseReadings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [glucoseReadings]);

  return (
    <div className="flex h-screen bg-slate-900 text-gray-800">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isSidebarCompact={isSidebarCompact} setIsSidebarCompact={setIsSidebarCompact} installPromptEvent={null} handleInstallClick={() => {}} onLogout={onLogout} user={userAccount} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex justify-between items-center p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 rounded-md hover:text-white hover:bg-slate-700">
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="hidden md:flex">{currentView === 'dashboard' && <LocationWeather />}</div>
          </div>
          <div className="flex items-center gap-4">
              {isAdminViewing && (
                  <div className="bg-purple-600/20 border border-purple-500/50 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <span className="animate-pulse w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Modo Administrador</span>
                  </div>
              )}
              <h1 className="text-xl font-semibold text-slate-100 hidden lg:block">Olá, {profile.name || 'Bem-vindo'}!</h1>
              <div className="h-10 w-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
                  {profile.photo ? <img src={profile.photo} alt="Foto" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><UserIcon className="h-6 w-6 text-slate-400" /></div>}
              </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-background p-4 sm:p-6">
          {(() => {
              const allData = { profile, glucoseReadings, medications, insulinSchedules, insulinRecords, contacts, exams, meals, appointments, hydrationRecords, glucoseAlertsConfig, dashboardConfig };
              switch (currentView) {
                case 'dashboard': return <Dashboard profile={profile} glucoseReadings={sortedGlucoseReadings} medications={medications} exams={exams} appointments={appointments} setCurrentView={setCurrentView} glucoseAlertsConfig={glucoseAlertsConfig} dashboardConfig={dashboardConfig} hydrationRecords={hydrationRecords} setHydrationRecords={setHydrationRecords} user={userAccount} />;
                case 'agenda': return <CalendarView glucoseReadings={glucoseReadings} medications={medications} exams={exams} meals={meals} appointments={appointments} setAppointments={setAppointments} contacts={contacts} />;
                case 'glicemia': return <GlucoseLog readings={sortedGlucoseReadings} setReadings={setGlucoseReadings} user={userAccount} />;
                case 'refeicoes': return <MealLog meals={meals} setMeals={setMeals} />;
                case 'medicamentos': return <Medications medications={medications} setMedications={setMedications} />;
                case 'insulina': return <InsulinControl schedules={insulinSchedules} setSchedules={setInsulinSchedules} records={insulinRecords} setRecords={setInsulinRecords} />;
                case 'exames': return <Exams exams={exams} setExams={setExams} contacts={contacts} profile={profile} glucoseReadings={sortedGlucoseReadings} />;
                case 'contatos': return <Contacts contacts={contacts} setContacts={setContacts} />;
                case 'listaTelefonica': return <PhoneList contacts={contacts} setContacts={setContacts} />;
                case 'recursos': return <Resources profile={profile} glucoseReadings={sortedGlucoseReadings} medications={medications} meals={meals} exams={exams} />;
                case 'perfil': return <Profile profile={profile} setProfile={setProfile} user={userAccount} onUpdatePassword={() => alert("Use 'Esqueci a senha' no login.")} onDeleteAccount={onDeleteAccount} onUpdateUser={() => {}} autoEdit={autoEditProfile} onAutoEditHandled={() => setAutoEditProfile(false)} />;
                case 'configuracoes': return <Settings allData={allData} dashboardConfig={dashboardConfig} setDashboardConfig={setDashboardConfig} glucoseAlertsConfig={glucoseAlertsConfig} setGlucoseAlertsConfig={setGlucoseAlertsConfig} user={userAccount} />;
                default: return <Dashboard profile={profile} glucoseReadings={sortedGlucoseReadings} medications={medications} exams={exams} appointments={appointments} setCurrentView={setCurrentView} glucoseAlertsConfig={glucoseAlertsConfig} dashboardConfig={dashboardConfig} hydrationRecords={hydrationRecords} setHydrationRecords={setHydrationRecords} user={userAccount} />;
              }
          })()}
        </main>
      </div>
      {showWelcomeModal && <WelcomeModal onClose={handleCloseWelcome} onLogout={onLogout} />}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (MAIN) ---
export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(false);

  // Impersonation state
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);
  
  // Accounts state for admin
  const [accounts, setAccounts] = useLocalStorage<UserAccount[]>('glicosync-accounts', [
      { id: 'admin', name: 'Administrador', username: 'admin', email: 'admin@admin.com', password: 'GlicoAdmin2025#' }
  ]);

  useEffect(() => {
      let unsubscribe = () => {};
      if (auth) {
          unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
              if (!isDeleting && !isDeleted) {
                // Se já temos um login mock de admin, não deixamos o Firebase sobrescrever para null
                if (!(currentUser?.email === 'admin@admin.com')) {
                    setCurrentUser(user);
                    if (user) {
                        // Registra ou atualiza o usuário na lista do admin local
                        setAccounts(prev => {
                            const exists = prev.find(a => a.id === user.uid);
                            if (exists) return prev;
                            return [...prev, {
                                id: user.uid,
                                name: user.displayName || 'Novo Usuário',
                                username: user.email?.split('@')[0] || user.uid.substring(0,8),
                                email: user.email || '',
                                password: ''
                            }];
                        });
                        
                        if (localStorage.getItem('glicosync-pending-deletion')) {
                            setPendingDeletion(true);
                        }
                    }
                }
              }
              setLoading(false);
          });
      } else { setLoading(false); }
      return () => unsubscribe();
  }, [isDeleting, isDeleted, currentUser]);

  const handleLogout = async () => {
    try { 
        if (currentUser?.uid === 'admin') {
            setCurrentUser(null);
            return;
        }
        await signOut(auth); 
        setCurrentUser(null);
    } catch (e) { 
        window.location.reload(); 
    }
  };

  const handleImpersonate = (userId: string) => {
      setImpersonatedUserId(userId);
  };

  const performActualDeletion = async () => {
      const user = auth.currentUser;
      if (!user) {
          alert("Erro: Sessão de usuário não encontrada. Tente logar novamente.");
          return;
      }

      const userId = user.uid;
      setIsDeleting(true);
      setPendingDeletion(false);

      try {
          const keys = ['profile', 'glucose', 'medications', 'insulin-schedules', 'insulin-records', 'contacts', 'exams', 'meals', 'appointments', 'hydration', 'glucose-alerts', 'dashboard-config'];
          const deletePromises = keys.map(key => deleteDoc(doc(db, "users", userId, "data", key)).catch(() => null));
          await Promise.allSettled(deletePromises);

          try {
              await deleteUser(user);
          } catch (authError: any) {
              if (authError.code === 'auth/requires-recent-login' || authError.code === 'auth/invalid-credential') {
                  localStorage.setItem('glicosync-pending-deletion', 'true');
                  alert("SEGURANÇA: Para apagar sua conta, o Google exige que você confirme sua identidade com um novo login recente.\n\nFaremos o logoff agora. Entre novamente e a exclusão será concluída.");
                  await signOut(auth);
                  window.location.reload();
                  return;
              }
              throw authError;
          }

          localStorage.clear();
          setIsDeleting(false);
          setIsDeleted(true);
          setCurrentUser(null);

      } catch (error: any) {
          console.error("Erro crítico na exclusão:", error);
          alert("Houve um erro técnico. Limparemos os dados deste dispositivo por segurança.");
          localStorage.clear();
          await signOut(auth);
          window.location.reload();
      }
  };

  if (isDeleted) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-slate-900 border border-red-500/40 p-12 rounded-[3.5rem] shadow-[0_0_120px_rgba(239,68,68,0.3)] max-w-md w-full text-center">
                  <div className="bg-red-500/20 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 ring-8 ring-red-500/5">
                      <CheckIcon className="w-14 h-14 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">CONTA APAGADA</h2>
                  <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                      Seu perfil e todos os seus registros de saúde foram removidos permanentemente.
                  </p>
                  <button 
                    onClick={() => { setIsDeleted(false); window.location.href = '/'; }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-sm"
                  >
                      Sair do GlicoSync
                  </button>
              </div>
          </div>
      );
  }

  if (pendingDeletion && currentUser) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-red-500/40 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center animate-slideUp">
                  <div className="bg-red-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertIcon className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">CONFIRMAÇÃO FINAL</h2>
                  <p className="text-slate-400 mb-8 leading-relaxed">
                      Sua identidade foi confirmada. Clique abaixo para apagar permanentemente todos os dados.
                  </p>
                  <div className="flex flex-col gap-3">
                      <button 
                        onClick={performActualDeletion}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg uppercase tracking-wider text-sm active:scale-95"
                      >
                          APAGAR TUDO PERMANENTEMENTE
                      </button>
                      <button 
                        onClick={() => { localStorage.removeItem('glicosync-pending-deletion'); setPendingDeletion(false); }}
                        className="w-full bg-slate-800 text-slate-400 py-3 rounded-xl hover:bg-slate-700 transition-all text-sm"
                      >
                          Manter conta
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (isDeleting) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-12 z-[999]">
              <Spinner size="lg" color="sky" />
              <h2 className="text-white font-black text-2xl mt-10 tracking-[0.3em] uppercase">APAGANDO...</h2>
          </div>
      );
  }

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
              <Spinner size="lg" color="sky" />
              <p className="mt-4 text-slate-500 animate-pulse font-bold tracking-widest uppercase text-xs">Conectando GlicoSync...</p>
          </div>
      );
  }

  if (!currentUser) return <Auth onLoginSuccess={(user) => setCurrentUser(user)} />;

  // ADMIN VIEW
  if (currentUser.email === 'admin@admin.com' && !impersonatedUserId) {
      return (
          <AdminDashboard 
            accounts={accounts} 
            setAccounts={setAccounts} 
            onLogout={handleLogout} 
            onImpersonate={handleImpersonate} 
          />
      );
  }

  // IMPERSONATED VIEW OR REGULAR USER VIEW
  const activeUser = impersonatedUserId 
    ? accounts.find(a => a.id === impersonatedUserId) || currentUser
    : currentUser;

  return (
    <UserSession 
      key={activeUser.id || activeUser.uid}
      user={activeUser.id ? { uid: activeUser.id, email: activeUser.email || '', displayName: activeUser.name } : activeUser}
      onLogout={impersonatedUserId ? () => setImpersonatedUserId(null) : handleLogout}
      onDeleteAccount={performActualDeletion}
      isAdminViewing={!!impersonatedUserId}
    />
  );
}

