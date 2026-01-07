
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { UserAccount, UserProfile, GlucoseReading, Exam, Meal, Medication } from '../types';
import { UserIcon } from './icons/UserIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { GlicoSyncIcon } from './icons/GlicoSyncIcon';
import { GlucoseIcon } from './icons/GlucoseIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SaveIcon } from './icons/SaveIcon';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { CloseIcon } from './icons/CloseIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import JSZip from 'jszip';
import { ArchiveIcon } from './icons/ArchiveIcon';
import { Spinner } from './Spinner';
import { AlertIcon } from './icons/AlertIcon';
import { BanIcon } from './icons/BanIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { PlusIcon } from './icons/PlusIcon';
import { HealthIcon } from './icons/HealthIcon';
import { TargetIcon } from './icons/TargetIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { EyeIcon } from './icons/EyeIcon';
import { RocketIcon } from './icons/RocketIcon';
import { GlobeIcon } from './icons/GlobeIcon';

interface AdminDashboardProps {
  accounts: UserAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  onLogout: () => void;
  onImpersonate: (userId: string) => void;
}

type AdminTab = 'overview' | 'users' | 'reports' | 'backups' | 'settings';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ accounts, setAccounts, onLogout, onImpersonate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [systemStats, setSystemStats] = useState({
    totalReadings: 0,
    totalMedications: 0,
    storageSize: '0 KB',
    lastBackup: 'Nunca'
  });
  const [systemConfig, setSystemConfig] = useState({
      maintenanceMode: false,
      allowRegistration: true
  });
  const [isDownloading, setIsDownloading] = useState(false);

  // User Management States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  
  const [userFormData, setUserFormData] = useState({ 
      name: '', 
      username: '', 
      email: '', 
      password: '',
  });
  const [userHistoryData, setUserHistoryData] = useState<{ date: string, type: string, desc: string }[]>([]);

  // Access Logs State
  const [accessLogs, setAccessLogs] = useState<{ userId: string, timestamp: string }[]>([]);

  // Clinical Profile State
  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  const [clinicalData, setClinicalData] = useState<{
      user: UserAccount,
      profile: UserProfile | null,
      glucoseStats: { count: number, avg: number, min: number, max: number, eA1c: string | null },
      medicationsCount: number,
      lastReadings: GlucoseReading[]
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const storedConfig = localStorage.getItem('glicosync-system-config');
      if (storedConfig) {
          setSystemConfig(JSON.parse(storedConfig));
      }
      const lastBackupDate = localStorage.getItem('glicosync-last-backup-date');
      if (lastBackupDate) {
          setSystemStats(prev => ({...prev, lastBackup: lastBackupDate}));
      }
      
      const storedLogs = localStorage.getItem('glicosync-access-logs');
      if (storedLogs) {
          try {
              setAccessLogs(JSON.parse(storedLogs));
          } catch(e) { console.error('Error parsing access logs', e); }
      }
  }, []);

  const updateSystemConfig = (key: keyof typeof systemConfig, value: boolean) => {
      const newConfig = { ...systemConfig, [key]: value };
      setSystemConfig(newConfig);
      localStorage.setItem('glicosync-system-config', JSON.stringify(newConfig));
  };

  const aggregatedData = useMemo(() => {
    let glucoseCount = 0;
    let medCount = 0;
    let totalBytes = 0;
    const diabetesTypes: Record<string, number> = {};
    const ageGroups: Record<string, number> = { '0-18': 0, '19-30': 0, '31-50': 0, '51-70': 0, '71+': 0 };
    const userDetails: Record<string, { glucose: number, meds: number, type: string, age: string }> = {};

    accounts.forEach(user => {
        const glucoseKey = "glicosync-cache-" + user.id + "-glucose";
        const medKey = "glicosync-cache-" + user.id + "-medications";
        const profileKey = "glicosync-cache-" + user.id + "-profile";

        const glucoseDataStr = localStorage.getItem(glucoseKey);
        const medDataStr = localStorage.getItem(medKey);
        const profileDataStr = localStorage.getItem(profileKey);

        let uGlucose = 0;
        let uMeds = 0;
        let uType = 'Não Informado';
        let uAge = '-';

        if (glucoseDataStr) {
            try {
                const parsed = JSON.parse(glucoseDataStr);
                if (Array.isArray(parsed)) {
                    uGlucose = parsed.length;
                    glucoseCount += uGlucose;
                }
                totalBytes += glucoseDataStr.length;
            } catch (e) {}
        }

        if (medDataStr) {
            try {
                const parsed = JSON.parse(medDataStr);
                if (Array.isArray(parsed)) {
                    uMeds = parsed.length;
                    medCount += uMeds;
                }
                totalBytes += medDataStr.length;
            } catch (e) {}
        }

        if (profileDataStr) {
            try {
                const profile: UserProfile = JSON.parse(profileDataStr);
                totalBytes += profileDataStr.length;
                uType = profile.diabetesType || 'Não Informado';
                diabetesTypes[uType] = (diabetesTypes[uType] || 0) + 1;
                uAge = profile.age || '-';
                const age = parseInt(profile.age) || 0;
                if (age > 0) {
                    if (age <= 18) ageGroups['0-18']++;
                    else if (age <= 30) ageGroups['19-30']++;
                    else if (age <= 50) ageGroups['31-50']++;
                    else if (age <= 70) ageGroups['51-70']++;
                    else ageGroups['71+']++;
                }
            } catch (e) {}
        }

        userDetails[user.id] = { glucose: uGlucose, meds: uMeds, type: uType, age: uAge };
    });

    for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
             totalBytes += (localStorage[key].length + key.length);
        }
    }

    return { glucoseCount, medCount, totalBytes, diabetesTypes, ageGroups, userDetails };
  }, [accounts]);

  useEffect(() => {
      setSystemStats(prev => ({
          ...prev,
          totalReadings: aggregatedData.glucoseCount,
          totalMedications: aggregatedData.medCount,
          storageSize: (aggregatedData.totalBytes / 1024).toFixed(2) + ' KB'
      }));
  }, [aggregatedData]);

  const handleOpenUserModal = (mode: 'add' | 'edit', user?: UserAccount) => {
      setModalMode(mode);
      if (mode === 'edit' && user) {
          setSelectedUser(user);
          setUserFormData({
              name: user.name,
              username: user.username,
              email: user.email || '',
              password: user.password,
          });
      } else {
          setSelectedUser(null);
          setUserFormData({ name: '', username: '', email: '', password: '' });
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      const normalizedUsername = userFormData.username.trim().toLowerCase();
      const commonData = {
          name: userFormData.name,
          username: userFormData.username.trim(),
          email: userFormData.email,
          password: userFormData.password,
      };

      if (modalMode === 'add') {
          if (accounts.some(a => a.username.trim().toLowerCase() === normalizedUsername)) {
              alert("Nome de usuário já existe. Escolha outro.");
              return;
          }
          const newUser: UserAccount = { id: new Date().toISOString(), isBlocked: false, ...commonData };
          setAccounts([...accounts, newUser]);
          alert("Usuário criado com sucesso!");
      } else if (modalMode === 'edit' && selectedUser) {
          if (accounts.some(a => a.id !== selectedUser.id && a.username.trim().toLowerCase() === normalizedUsername)) {
              alert("Nome de usuário já está em uso por outra conta.");
              return;
          }
          setAccounts(accounts.map(a => a.id === selectedUser.id ? { ...a, ...commonData } : a));
          alert("Dados do usuário atualizados!");
      }
      setIsUserModalOpen(false);
  };

  const handleBlockToggle = (user: UserAccount) => {
      const action = user.isBlocked ? "desbloquear" : "bloquear";
      if (window.confirm("Deseja realmente " + action + " o usuário " + user.name + "?")) {
          setAccounts(accounts.map(a => a.id === user.id ? { ...a, isBlocked: !user.isBlocked } : a));
      }
  };

  const handleViewClinicalProfile = (user: UserAccount) => {
      const userId = user.id;
      const profileStr = localStorage.getItem("glicosync-cache-" + userId + "-profile");
      const glucoseStr = localStorage.getItem("glicosync-cache-" + userId + "-glucose");
      const medStr = localStorage.getItem("glicosync-cache-" + userId + "-medications");
      const profile: UserProfile | null = profileStr ? JSON.parse(profileStr) : null;
      const glucose: GlucoseReading[] = glucoseStr ? JSON.parse(glucoseStr) : [];
      const medications: Medication[] = medStr ? JSON.parse(medStr) : [];
      let glucoseStats = { count: 0, avg: 0, min: 0, max: 0, eA1c: null as string | null };
      if (glucose.length > 0) {
          const values = glucose.map(g => g.value);
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / glucose.length;
          glucoseStats = { count: glucose.length, avg: avg, min: Math.min(...values), max: Math.max(...values), eA1c: glucose.length >= 3 ? ((avg + 46.7) / 28.7).toFixed(1) : null };
      }
      const sortedReadings = [...glucose].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      setClinicalData({ user, profile, glucoseStats, medicationsCount: medications.length, lastReadings: sortedReadings });
      setIsClinicalModalOpen(true);
  };

  const generateUserHistory = (user: UserAccount) => {
      const history: { date: string, type: string, desc: string, timestamp: number }[] = [];
      const userId = user.id;
      const glucoseStr = localStorage.getItem("glicosync-cache-" + userId + "-glucose");
      if (glucoseStr) {
          const readings: GlucoseReading[] = JSON.parse(glucoseStr);
          readings.forEach(r => history.push({ date: r.date, type: 'Glicemia', desc: r.value + " mg/dL " + (r.notes ? "(" + r.notes + ")" : ''), timestamp: new Date(r.date).getTime() }));
      }
      const examsStr = localStorage.getItem("glicosync-cache-" + userId + "-exams");
      if (examsStr) {
          const exams: Exam[] = JSON.parse(examsStr);
          exams.forEach(e => history.push({ date: e.date, type: 'Exame', desc: e.name + " - Resultado: " + e.result, timestamp: new Date(e.date).getTime() }));
      }
      const mealsStr = localStorage.getItem("glicosync-cache-" + userId + "-meals");
      if (mealsStr) {
          const meals: Meal[] = JSON.parse(mealsStr);
          meals.forEach(m => history.push({ date: m.date, type: 'Refeição', desc: m.type + ": " + m.description, timestamp: new Date(m.date).getTime() }));
      }
      history.sort((a, b) => b.timestamp - a.timestamp);
      setUserHistoryData(history);
      setSelectedUser(user);
      setIsHistoryModalOpen(true);
  };

  const printUserHistory = () => {
      if (!selectedUser) return;
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;
      const historyHtml = userHistoryData.map(h => "<tr><td>" + new Date(h.date).toLocaleString('pt-BR') + "</td><td><b>" + h.type + "</b></td><td>" + h.desc + "</td></tr>").join('');
      printWindow.document.write("<html><head><title>Relatório - " + selectedUser.name + "</title><style>body{font-family:Arial,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;margin-top:20px;} th{text-align:left;background:#f2f2f2;padding:10px;}</style></head><body><h1>Relatório de Atividades - " + selectedUser.name + "</h1><p>Email: " + (selectedUser.email || 'N/A') + "</p><hr/><table><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>" + (historyHtml || '<tr><td colspan="3">Nenhum registro.</td></tr>') + "</tbody></table><script>window.print();</script></body></html>");
      printWindow.document.close();
  };

  const handlePrintUserListReport = () => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;
      const userRows = accounts.map(acc => {
          const stats = aggregatedData.userDetails[acc.id] || { glucose: 0, meds: 0 };
          return "<tr><td>" + acc.name + "</td><td>" + acc.username + "</td><td>" + (acc.isBlocked ? 'Bloqueado' : 'Ativo') + "</td><td align=\"center\">" + stats.glucose + "</td><td align=\"center\">" + stats.meds + "</td></tr>";
      }).join('');
      printWindow.document.write("<html><head><title>Lista de Usuários</title><style>body{font-family:Arial,padding:20px;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border-bottom:1px solid #ddd;} th{background:#f2f2f2;}</style></head><body><h1>Relatório de Usuários</h1><table><thead><tr><th>Nome</th><th>Login</th><th>Status</th><th>Glicemias</th><th>Meds</th></tr></thead><tbody>" + userRows + "</tbody></table><script>window.print();</script></body></html>");
      printWindow.document.close();
  };

  const handleExportUsersCSV = () => {
      const headers = ['ID', 'Nome', 'Usuario', 'Email', 'Status', 'Glicemia', 'Meds'];
      const rows = accounts.map(acc => {
          const stats = aggregatedData.userDetails[acc.id] || { glucose: 0, meds: 0 };
          return [acc.id, "\"" + acc.name + "\"", acc.username, acc.email || '', acc.isBlocked ? 'Bloqueado' : 'Ativo', stats.glucose, stats.meds].join(',');
      });
      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "relatorio_usuarios_" + new Date().toISOString().split('T')[0] + ".csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("ATENÇÃO: Esta ação excluirá permanentemente o usuário e TODOS os seus dados. Deseja continuar?")) {
        setAccounts(prev => prev.filter(a => a.id !== userId));
        const keysToRemove = ['profile', 'glucose', 'medications', 'contacts', 'exams', 'meals', 'appointments', 'alerts-shown', 'glucose-alerts', 'dashboard-config'];
        keysToRemove.forEach(key => localStorage.removeItem("glicosync-cache-" + userId + "-" + key));
    }
  };

  const handleFullBackup = () => {
      const backupData: Record<string, string> = {};
      for (const key in localStorage) {
          if (Object.prototype.hasOwnProperty.call(localStorage, key)) backupData[key] = localStorage.getItem(key) || "";
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "GlicoSync_FULL_BACKUP_" + new Date().toISOString().replace(/[:.]/g, '-') + ".json";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      const now = new Date().toLocaleString();
      localStorage.setItem('glicosync-last-backup-date', now);
      setSystemStats(prev => ({ ...prev, lastBackup: now }));
  };

  const handleRestoreClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !window.confirm("Isso irá substituir TODO o banco de dados atual. Continuar?")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              localStorage.clear();
              for (const key in data) localStorage.setItem(key, data[key]);
              alert("Sistema restaurado! Recarregando...");
              window.location.reload();
          } catch (err) { alert("Erro no arquivo."); }
      };
      reader.readAsText(file);
  };

  const commonFilePaths = [
    'index.tsx', 'metadata.json', 'App.tsx', 'types.ts', 'sw.js', 'glicosync-icon.svg', 'manifest.webmanifest',
    'hooks/useLocalStorage.ts', 'hooks/useCurrentTime.ts', 'hooks/useSyncState.ts', 'services/geminiService.ts', 'services/firebase.ts',
    'components/Sidebar.tsx', 'components/Dashboard.tsx', 'components/GlucoseLog.tsx', 'components/Profile.tsx',
    'components/Medications.tsx', 'components/Contacts.tsx', 'components/Resources.tsx', 'components/Exams.tsx',
    'components/MealLog.tsx', 'components/CalendarView.tsx', 'components/PhoneList.tsx', 'components/Settings.tsx',
    'components/GlucoseChart.tsx', 'components/ProfileSummary.tsx', 'components/ExamChart.tsx', 'components/ToggleSwitch.tsx',
    'components/Spinner.tsx', 'components/MarkdownRenderer.tsx', 'components/LocationWeather.tsx', 'components/ManualModal.tsx',
    'components/HealthNews.tsx', 'components/AdminDashboard.tsx', 'components/Auth.tsx', 'components/LeafletModal.tsx',
    'components/HydrationWidget.tsx', 'components/InsulinControl.tsx', 'components/WelcomeModal.tsx', 'components/PharmacyModal.tsx', 'components/ConfirmModal.tsx',
    'components/icons/AlertIcon.tsx', 'components/icons/AppleIcon.tsx', 'components/icons/ArrowUpIcon.tsx', 'components/icons/ArrowDownIcon.tsx',
    'components/icons/BookIcon.tsx', 'components/icons/CalendarIcon.tsx', 'components/icons/CheckIcon.tsx', 'components/icons/ChevronLeftIcon.tsx',
    'components/icons/ChevronRightIcon.tsx', 'components/icons/ChevronsLeftIcon.tsx', 'components/icons/ChevronsRightIcon.tsx', 'components/icons/ClipboardIcon.tsx',
    'components/icons/ClockIcon.tsx', 'components/icons/CloseIcon.tsx', 'components/icons/ContactIcon.tsx', 'components/icons/DashboardIcon.tsx',
    'components/icons/DownloadIcon.tsx', 'components/icons/EditIcon.tsx', 'components/icons/EmailIcon.tsx', 'components/icons/ExportIcon.tsx',
    'components/icons/GlicoSyncIcon.tsx', 'components/icons/GlobeIcon.tsx', 'components/icons/GlucoseIcon.tsx', 'components/icons/HealthIcon.tsx',
    'components/icons/HospitalIcon.tsx', 'components/icons/InstallIcon.tsx', 'components/icons/LockIcon.tsx', 'components/icons/MapPinIcon.tsx',
    'components/icons/MealIcon.tsx', 'components/icons/MedicationIcon.tsx', 'components/icons/MenuIcon.tsx', 'components/icons/NewsIcon.tsx',
    'components/icons/PharmacyIcon.tsx', 'components/icons/PhoneBookIcon.tsx', 'components/icons/PlusIcon.tsx', 'components/icons/PrinterIcon.tsx',
    'components/icons/SaveIcon.tsx', 'components/icons/SettingsIcon.tsx', 'components/icons/ShareIcon.tsx', 'components/icons/TargetIcon.tsx',
    'components/icons/TestTubeIcon.tsx', 'components/icons/TrashIcon.tsx', 'components/icons/UserIcon.tsx', 'components/icons/WaterDropIcon.tsx',
    'components/icons/WeatherIcon.tsx', 'components/icons/WifiIcon.tsx', 'components/icons/ArchiveIcon.tsx', 'components/icons/LogoutIcon.tsx',
    'components/icons/BanIcon.tsx', 'components/icons/HistoryIcon.tsx', 'components/icons/CameraIcon.tsx', 'components/icons/SearchIcon.tsx',
    'components/icons/SirenIcon.tsx', 'components/icons/AmbulanceIcon.tsx', 'components/icons/FlameIcon.tsx', 'components/icons/ShieldIcon.tsx',
    'components/icons/BadgeIcon.tsx', 'components/icons/LifeRingIcon.tsx', 'components/icons/CarIcon.tsx', 'components/icons/SyringeIcon.tsx',
    'components/icons/BookOpenIcon.tsx', 'components/icons/HelpIcon.tsx', 'components/icons/EyeIcon.tsx', 'components/icons/RocketIcon.tsx',
    'components/icons/PharmacyCrossIcon.tsx', 'components/icons/PdfIcon.tsx', 'components/icons/EraserIcon.tsx', 'components/icons/DumbbellIcon.tsx', 'components/icons/CloudIcon.tsx'
  ];

  const handleProjectDownload = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const packageJson = {
        "name": "glicosync",
        "version": "1.0.0",
        "type": "module",
        "scripts": { "dev": "vite", "build": "tsc && vite build", "preview": "vite preview" },
        "dependencies": { "@google/genai": "*", "jszip": "^3.10.1", "react": "^18.2.0", "react-dom": "^18.2.0", "recharts": "^2.10.3", "firebase": "^10.7.1" },
        "devDependencies": { "@types/node": "^20.10.0", "@types/react": "^18.2.43", "@types/react-dom": "^18.2.17", "@vitejs/plugin-react": "^4.2.1", "typescript": "^5.2.2", "vite": "^5.0.8" }
      };
      
      const viteConfig = "import { defineConfig } from 'vite';\n" +
"import react from '@vitejs/plugin-react';\n" +
"export default defineConfig({ \n" +
"  plugins: [react()], \n" +
"  base: './',\n" +
"  define: { 'process.env.API_KEY': JSON.stringify(process.env.API_KEY) }, \n" +
"  build: { outDir: 'dist' } \n" +
"});";

      const tsConfig = '{ "compilerOptions": { "target": "ES2020", "useDefineForClassFields": true, "lib": ["ES2020", "DOM", "DOM.Iterable"], "module": "ESNext", "skipLibCheck": true, "moduleResolution": "bundler", "allowImportingTsExtensions": true, "resolveJsonModule": true, "isolatedModules": true, "noEmit": true, "jsx": "react-jsx", "strict": true, "noUnusedLocals": false, "noUnusedParameters": false, "noFallthroughCasesInSwitch": true }, "include": ["**/*.ts", "**/*.tsx"], "exclude": ["node_modules", "vite.config.ts"] }';

      zip.file('package.json', JSON.stringify(packageJson, null, 2));
      zip.file('vite.config.ts', viteConfig);
      zip.file('tsconfig.json', tsConfig);
      zip.file('.env.example', 'API_KEY=sua_chave_do_google_gemini_aqui\n# Adicione outras variaveis conforme necessario');
      zip.file('README.md', '# GlicoSync - Produção\n\nEste código está pronto para ser publicado em qualquer servidor (Vercel, Netlify, VPS).\n\n## Instruções\n1. `npm install` para instalar dependências.\n2. Crie um arquivo `.env` baseado no `.env.example` e insira sua API_KEY.\n3. `npm run build` para gerar a pasta `dist`.\n4. Publique o conteúdo de `dist` no seu servidor.');

      const indexRes = await fetch('/index.html');
      if (indexRes.ok) {
          let content = await indexRes.text();
          content = content.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
          zip.file('index.html', content);
      }

      for (const path of commonFilePaths) {
          const res = await fetch("/" + path);
          if (res.ok) zip.file(path, await res.text());
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "glicosync-servidor-pronto.zip";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (e) { alert("Erro na geração."); } finally { setIsDownloading(false); }
  };

  const NavButton = ({ tab, label, icon: Icon }: { tab: AdminTab, label: string, icon: React.FC<any> }) => {
    const isActive = activeTab === tab;
    const baseClasses = "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ";
    const activeClasses = isActive ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200";
    const iconClasses = "w-5 h-5 " + (isActive ? "text-white" : "text-slate-500");

    return (
      <button 
        onClick={() => setActiveTab(tab)} 
        className={baseClasses + activeClasses}
      >
          <Icon className={iconClasses} />
          <span className="font-medium text-sm">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <GlicoSyncIcon className="w-8 h-8 text-purple-500" />
                <div>
                    <h1 className="font-bold text-white text-lg tracking-tight">GlicoSync</h1>
                    <span className="text-xs font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full tracking-wider">ADMIN</span>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <p className="px-4 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-2">Principal</p>
                <NavButton tab="overview" label="Visão Geral" icon={DashboardIcon} />
                <NavButton tab="reports" label="Relatórios" icon={GlucoseIcon} />
                <p className="px-4 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-6">Gerenciamento</p>
                <NavButton tab="users" label="Usuários" icon={UserIcon} />
                <NavButton tab="backups" label="Backups" icon={DownloadIcon} />
                <NavButton tab="settings" label="Configurações" icon={SettingsIcon} />
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/30 transition-colors">
                    <LogoutIcon className="w-5 h-5" />
                    <span className="font-semibold">Sair</span>
                </button>
            </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 lg:p-10">
            <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {activeTab === 'overview' && 'Painel de Controle'}
                        {activeTab === 'users' && 'Usuários do Sistema'}
                        {activeTab === 'reports' && 'Relatórios & Analytics'}
                        {activeTab === 'backups' && 'Central de Dados'}
                        {activeTab === 'settings' && 'Configurações do Sistema'}
                    </h1>
                    <p className="text-slate-500 mt-1">Bem-vindo ao painel administrativo.</p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-800">A</div>
            </header>
            
            <div className="max-w-7xl mx-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div><p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total de Usuários</p><h3 className="text-3xl font-bold text-white mt-1">{accounts.length}</h3></div>
                                    <div className="p-3 bg-blue-500/10 rounded-lg"><UserIcon className="w-6 h-6 text-blue-500" /></div>
                                </div>
                                <div className="text-xs text-slate-500"><span className="text-green-400 font-bold">+{accounts.filter(a => !a.isBlocked).length}</span> ativos</div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div><p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Registros Glicemia</p><h3 className="text-3xl font-bold text-white mt-1">{systemStats.totalReadings}</h3></div>
                                    <div className="p-3 bg-green-500/10 rounded-lg"><GlucoseIcon className="w-6 h-6 text-green-500" /></div>
                                </div>
                                <div className="text-xs text-slate-500">Dados globais</div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div><p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Armazenamento</p><h3 className="text-3xl font-bold text-white mt-1">{systemStats.storageSize}</h3></div>
                                    <div className="p-3 bg-purple-500/10 rounded-lg"><SaveIcon className="w-6 h-6 text-purple-500" /></div>
                                </div>
                                <div className="text-xs text-slate-500">Uso do LocalStorage</div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div><p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Último Backup</p><h3 className="text-lg font-bold text-white mt-1 truncate">{systemStats.lastBackup.split(' ')[0]}</h3></div>
                                    <div className="p-3 bg-orange-500/10 rounded-lg"><DownloadIcon className="w-6 h-6 text-orange-500" /></div>
                                </div>
                                <div className="text-xs text-slate-500">{systemStats.lastBackup !== 'Nunca' ? systemStats.lastBackup.split(' ')[1] : ''}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <h3 className="text-lg font-bold text-slate-200 mb-4">Distribuição por Tipo de Diabetes</h3>
                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie 
                                        data={Object.entries(aggregatedData.diabetesTypes).map(([name, value]) => ({ name, value }))} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        fill="#8884d8" 
                                        paddingAngle={5} 
                                        dataKey="value"
                                      >
                                        {Object.entries(aggregatedData.diabetesTypes).map((entry, index) => (
                                          <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                      <Legend />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <h3 className="text-lg font-bold text-slate-200 mb-4">Faixa Etária</h3>
                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(aggregatedData.ageGroups).map(([name, value]) => ({ name, value }))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                      <YAxis stroke="#94a3b8" fontSize={12} />
                                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} cursor={{fill: '#334155'}} />
                                      <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Usuários" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <div><h2 className="text-xl font-bold text-white">Usuários</h2><p className="text-slate-400 text-sm">{accounts.length} registrados localmente</p></div>
                            <button onClick={() => handleOpenUserModal('add')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Novo Usuário</button>
                        </div>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-slate-300">
                              <thead className="bg-slate-900/50 text-xs uppercase text-slate-400 font-semibold">
                                <tr>
                                  <th className="p-4">Usuário</th>
                                  <th className="p-4 text-center">Status</th>
                                  <th className="p-4 text-center">Glicemia</th>
                                  <th className="p-4 text-center">Meds</th>
                                  <th className="p-4 text-right">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700">
                                {accounts.map(acc => { 
                                  if (acc.id === 'admin') return null; 
                                  const stats = aggregatedData.userDetails[acc.id] || { glucose: 0, meds: 0 }; 
                                  const statusColor = acc.isBlocked ? "bg-red-900/30 text-red-400 border border-red-800" : "bg-green-900/30 text-green-400 border border-green-800";
                                  
                                  return (
                                    <tr key={acc.id} className="hover:bg-slate-700/30 transition-colors">
                                      <td className="p-4">
                                        <div className="font-bold text-white">{acc.name}</div>
                                        <div className="text-xs text-slate-500">ID: {acc.id.substring(0,8)}</div>
                                      </td>
                                      <td className="p-4 text-center">
                                        <span className={"px-2 py-1 rounded text-xs font-bold " + statusColor}>
                                          {acc.isBlocked ? 'Bloqueado' : 'Ativo'}
                                        </span>
                                      </td>
                                      <td className="p-4 text-center font-mono text-slate-400">{stats.glucose}</td>
                                      <td className="p-4 text-center font-mono text-slate-400">{stats.meds}</td>
                                      <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => onImpersonate(acc.id)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-blue-600 rounded" title="Acessar como"><EyeIcon className="w-4 h-4" /></button>
                                          <button onClick={() => handleViewClinicalProfile(acc)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-emerald-600 rounded" title="Perfil Clínico"><HealthIcon className="w-4 h-4" /></button>
                                          <button onClick={() => generateUserHistory(acc)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-purple-600 rounded" title="Histórico"><HistoryIcon className="w-4 h-4" /></button>
                                          <button onClick={() => handleOpenUserModal('edit', acc)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-sky-600 rounded" title="Editar"><EditIcon className="w-4 h-4" /></button>
                                          <button onClick={() => handleBlockToggle(acc)} className={"p-1.5 text-slate-400 hover:text-white bg-slate-700 rounded " + (acc.isBlocked ? "hover:bg-green-600" : "hover:bg-red-600")}>
                                            {acc.isBlocked ? <CheckIcon className="w-4 h-4" /> : <BanIcon className="w-4 h-4" />}
                                          </button>
                                          <button onClick={() => handleDeleteUser(acc.id)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-red-700 rounded"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  ); 
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h2 className="text-xl font-bold text-white mb-4">Relatórios</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                                <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-blue-500/10 rounded-lg"><UserIcon className="w-6 h-6 text-blue-500" /></div><h3 className="text-lg font-bold text-white">Relatório de Usuários</h3></div>
                                <p className="text-slate-400 text-sm mb-6">Lista completa de usuários cadastrados e estatísticas.</p>
                                <div className="flex gap-3"><button onClick={handlePrintUserListReport} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><PrinterIcon className="w-4 h-4" /> Imprimir</button><button onClick={handleExportUsersCSV} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><DownloadIcon className="w-4 h-4" /> Exportar CSV</button></div>
                            </div>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mt-6"><h3 className="text-lg font-bold text-white mb-4">Logs de Acesso</h3><div className="overflow-x-auto max-h-64 custom-scrollbar"><table className="w-full text-left text-sm text-slate-300"><thead className="bg-slate-900/50 text-slate-400 font-semibold sticky top-0"><tr><th className="p-3">Data/Hora</th><th className="p-3">Usuário ID</th><th className="p-3">Ação</th></tr></thead><tbody className="divide-y divide-slate-700">{accessLogs.slice().reverse().slice(0, 50).map((log, idx) => (<tr key={idx} className="hover:bg-slate-700/30"><td className="p-3 font-mono text-slate-400">{new Date(log.timestamp).toLocaleString('pt-BR')}</td><td className="p-3 font-mono">{log.userId}</td><td className="p-3">Acesso ao Painel</td></tr>))}{accessLogs.length === 0 && (<tr><td colSpan={3} className="p-4 text-center text-slate-500">Nenhum log.</td></tr>)}</tbody></table></div></div>
                    </div>
                )}

                {activeTab === 'backups' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                            <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-purple-500/10 rounded-lg"><ArchiveIcon className="w-6 h-6 text-purple-500" /></div><div><h2 className="text-xl font-bold text-white">Backup e Restauração</h2><p className="text-slate-400 text-sm">Gerencie o banco de dados completo.</p></div></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"><h3 className="text-white font-bold mb-2">Backup Completo (JSON)</h3><p className="text-slate-400 text-sm mb-4">Exporta todo o LocalStorage para um arquivo.</p><button onClick={handleFullBackup} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"><DownloadIcon className="w-4 h-4" /> Baixar Backup</button></div>
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700"><h3 className="text-white font-bold mb-2">Restaurar Sistema</h3><p className="text-slate-400 text-sm mb-4">Substitui o banco de dados por um arquivo.</p><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" /><button onClick={handleRestoreClick} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 border border-slate-500"><ArchiveIcon className="w-4 h-4" /> Selecionar Arquivo</button></div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                            <div className="flex items-center gap-3 mb-4"><div className="p-3 bg-green-500/10 rounded-lg"><RocketIcon className="w-6 h-6 text-green-500" /></div><div><h2 className="text-xl font-bold text-white">Publicação e Instalação</h2><p className="text-slate-400 text-sm">Distribua o GlicoSync para outros locais.</p></div></div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-white font-bold mb-1 flex items-center gap-2"><GlobeIcon className="w-4 h-4 text-sky-400" /> Código-Fonte (Web Server)</h3>
                                        <p className="text-slate-400 text-xs mb-4 leading-relaxed">Código pronto para ser hospedado em servidores web (Netlify, Vercel, Hostinger). Inclui scripts de build e configurações de produção.</p>
                                    </div>
                                    <button onClick={handleProjectDownload} disabled={isDownloading} className="bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-600 uppercase text-xs tracking-widest">
                                        {isDownloading ? <Spinner size="sm"/> : <DownloadIcon className="w-4 h-4" />}
                                        Baixar para Servidor (.zip)
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-slate-700 rounded-lg">
                              <SettingsIcon className="w-6 h-6 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Configurações</h2>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                              <div><h3 className="text-white font-bold">Modo Manutenção</h3><p className="text-slate-400 text-sm">Bloqueia acesso geral.</p></div>
                              <button className={"relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors " + (systemConfig.maintenanceMode ? "bg-purple-500" : "bg-slate-700")} onClick={() => updateSystemConfig('maintenanceMode', !systemConfig.maintenanceMode)}>
                                <span className={"inline-block h-5 w-5 transform rounded-full bg-white transition " + (systemConfig.maintenanceMode ? "translate-x-5" : "translate-x-0")} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                              <div><h3 className="text-white font-bold">Permitir Cadastros</h3><p className="text-slate-400 text-sm">Novas contas na tela de login.</p></div>
                              <button className={"relative inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors " + (systemConfig.allowRegistration ? "bg-green-500" : "bg-slate-700")} onClick={() => updateSystemConfig('allowRegistration', !systemConfig.allowRegistration)}>
                                <span className={"inline-block h-5 w-5 transform rounded-full bg-white transition " + (systemConfig.allowRegistration ? "translate-x-5" : "translate-x-0")} />
                              </button>
                            </div>
                          </div>
                        </div>
                    </div>
                )}
            </div>
        </main>

        {isUserModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-700 flex flex-col"><div className="p-6 border-b border-slate-700 flex justify-between items-center"><h3 className="text-xl font-bold text-white">{modalMode === 'add' ? 'Novo Usuário' : 'Editar Usuário'}</h3><button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button></div><form onSubmit={handleSaveUser} className="p-6 space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm text-slate-400">Nome</label><input required type="text" value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"/></div><div><label className="block text-sm text-slate-400">Email</label><input required type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"/></div><div><label className="block text-sm text-slate-400">Login</label><input required type="text" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"/></div><div><label className="block text-sm text-slate-400">Senha</label><input required type="text" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white"/></div></div><div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-300">Cancelar</button><button type="submit" className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-md">Salvar</button></div></form></div></div>
        )}

        {isHistoryModalOpen && selectedUser && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full border border-slate-700 h-[80vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                  <div><h3 className="text-xl font-bold text-white">Histórico</h3><p className="text-slate-400 text-sm">{selectedUser.name}</p></div>
                  <div className="flex gap-2">
                    <button onClick={printUserHistory} className="p-2 bg-slate-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"><PrinterIcon className="w-4 h-4"/> Imprimir</button>
                    <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  {userHistoryData.length > 0 ? (
                    <div className="relative border-l-2 border-slate-700 ml-3 pl-6 space-y-6">
                      {userHistoryData.map((item, idx) => {
                        const typeColor = item.type === 'Glicemia' ? 'bg-green-500' : 'bg-purple-500';
                        return (
                          <div key={idx} className="relative">
                            <div className={"absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-900 " + typeColor}></div>
                            <p className="text-xs text-slate-500 mb-1">{new Date(item.date).toLocaleString('pt-BR')}</p>
                            <h4 className="text-white font-bold">{item.type}</h4>
                            <p className="text-slate-300 text-sm mt-1 bg-slate-900/50 p-2 rounded border border-slate-700/50 inline-block">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (<p className="text-center text-slate-500 py-10">Nenhum registro.</p>)}
                </div>
              </div>
            </div>
        )}

        {isClinicalModalOpen && clinicalData && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"><div className="bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-700 flex flex-col max-h-[90vh] overflow-y-auto"><div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900"><div className="flex items-center gap-4"><HealthIcon className="w-8 h-8 text-blue-400" /><div><h3 className="text-xl font-bold text-white">Perfil Clínico</h3><p className="text-slate-400 text-sm">{clinicalData.user.name}</p></div></div><button onClick={() => setIsClinicalModalOpen(false)} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button></div><div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600"><h4 className="text-lg font-bold text-white mb-4 border-b border-slate-600 pb-2">Dados Pessoais</h4><div className="space-y-3"><div className="flex justify-between"><span className="text-slate-400">Idade:</span><span className="text-white font-semibold">{clinicalData.profile?.age || 'N/A'} anos</span></div><div className="flex justify-between"><span className="text-slate-400">Peso:</span><span className="text-white font-semibold">{clinicalData.profile?.weight || 'N/A'} kg</span></div></div></div><div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600"><h4 className="text-lg font-bold text-white mb-4 border-b border-slate-600 pb-2">Tratamento</h4><div className="space-y-3"><div className="flex justify-between"><span className="text-slate-400">Tipo:</span><span className="text-white font-bold">{clinicalData.profile?.diabetesType || 'N/A'}</span></div><div className="flex justify-between"><span className="text-slate-400">Meds:</span><span className="text-white">{clinicalData.medicationsCount}</span></div></div></div><div className="md:col-span-2 bg-slate-700/30 rounded-xl p-5 border border-slate-600"><h4 className="text-lg font-bold text-white mb-4 border-b border-slate-600 pb-2">Glicemia</h4>{clinicalData.glucoseStats.count > 0 ? (<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center"><div className="bg-slate-800 p-3 rounded-lg"><p className="text-xs text-slate-400 uppercase">Média</p><p className="text-xl font-bold text-white">{clinicalData.glucoseStats.avg.toFixed(0)}</p></div><div className="bg-slate-800 p-3 rounded-lg"><p className="text-xs text-slate-400 uppercase">A1c (Est.)</p><p className="text-xl font-bold text-blue-400">{clinicalData.glucoseStats.eA1c}%</p></div><div className="bg-slate-800 p-3 rounded-lg"><p className="text-xs text-slate-400 uppercase">Min</p><p className="text-xl font-bold text-cyan-400">{clinicalData.glucoseStats.min}</p></div><div className="bg-slate-800 p-3 rounded-lg"><p className="text-xs text-slate-400 uppercase">Max</p><p className="text-xl font-bold text-red-400">{clinicalData.glucoseStats.max}</p></div></div>) : (<p className="text-center text-slate-500 py-4">Sem dados.</p>)}</div></div></div></div>
        )}
    </div>
  );
};
