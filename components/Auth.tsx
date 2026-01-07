
import React, { useState, useEffect } from 'react';
import { GlicoSyncIcon } from './icons/GlicoSyncIcon';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from "firebase/auth";
import { Spinner } from './Spinner';
import { AlertIcon } from './icons/AlertIcon';
import { CheckIcon } from './icons/CheckIcon';
import { InstallIcon } from './icons/InstallIcon';
import { WifiIcon } from './icons/WifiIcon';

interface AuthProps {
  onLoginSuccess: (user: any) => void;
  installPromptEvent?: any;
  onInstallClick?: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, installPromptEvent, onInstallClick }) => {
  const [mode, setMode] = useState<AuthMode>('login');
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
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
      setError(''); setSuccessMsg(''); setEmail(''); setPassword(''); setName(''); setConfirmPassword('');
  };

  if (!isFirebaseConfigured) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-brand-background p-4">
              <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-red-500/50 max-w-md w-full text-center">
                  <div className="flex justify-center mb-4"><AlertIcon className="w-12 h-12 text-red-500" /></div>
                  <h2 className="text-xl font-bold text-white mb-2">Configuração Necessária</h2>
                  <p className="text-slate-300 text-sm mb-4">Para utilizar o GlicoSync, você precisa configurar o Firebase no sistema.</p>
                  <button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors">Recarregar Sistema</button>
              </div>
          </div>
      );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) { setError("Você precisa estar online para entrar."); return; }
    setError('');
    setIsLoading(true);

    // --- ADMIN BYPASS ---
    if (email === 'admin@admin.com' && password === 'GlicoAdmin2025#') {
        setTimeout(() => {
            onLoginSuccess({ 
                uid: 'admin', 
                email: 'admin@admin.com', 
                displayName: 'Administrador' 
            });
            setIsLoading(false);
        }, 800);
        return;
    }

    try {
        if (!auth) throw new Error("Serviço de autenticação indisponível.");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLoginSuccess(userCredential.user);
    } catch (err: any) {
        let msg = "Falha ao fazer login.";
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            msg = "E-mail ou senha incorretos.";
        }
        setError(msg);
    } finally { setIsLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!navigator.onLine) { setError("Você precisa estar online para criar uma conta."); return; }
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    setError('');
    setIsLoading(true);
    try {
        if (!auth) throw new Error("Serviço indisponível.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        onLoginSuccess(userCredential.user);
    } catch (err: any) {
        setError("Erro ao criar conta.");
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black px-4 py-6 relative overflow-hidden">
      
      {!isOnline && (
          <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-2 z-50 text-sm font-bold flex items-center justify-center gap-2">
              <WifiIcon className="w-4 h-4" /> Para entrar ou criar uma conta, o GlicoSync deve estar conectado à internet.
          </div>
      )}

      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><div className="p-4 bg-slate-700/50 rounded-2xl shadow-inner"><GlicoSyncIcon className="h-12 w-12 text-brand-blue-light" /></div></div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">{mode === 'login' ? 'Bem-vindo ao GlicoSync' : mode === 'register' ? 'Crie sua conta' : 'Recuperar Senha'}</h2>
        </div>
        
        {mode === 'login' && (
            <form className="space-y-5" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <input type="email" required disabled={!isOnline || isLoading} className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand-blue-light disabled:opacity-50" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" required disabled={!isOnline || isLoading} className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand-blue-light disabled:opacity-50" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <div className="text-red-400 text-sm text-center bg-red-900/20 py-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2 animate-shake"><AlertIcon className="w-4 h-4" />{error}</div>}
                <button type="submit" disabled={isLoading || !isOnline} className="w-full py-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-brand-blue hover:bg-blue-600 transition-all transform active:scale-95 disabled:opacity-50">{isLoading ? <Spinner size="sm" /> : 'Entrar Agora'}</button>
                <div className="text-center mt-6"><p className="text-sm text-slate-400">Não possui acesso? <button type="button" onClick={() => { resetForm(); setMode('register'); }} className="font-bold text-brand-blue-light hover:text-white transition-colors">Crie sua conta aqui</button></p></div>
            </form>
        )}

        {mode === 'register' && (
             <form className="space-y-5" onSubmit={handleRegister}>
                <div className="space-y-4">
                    <input type="text" required disabled={!isOnline || isLoading} className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand-blue-light disabled:opacity-50" placeholder="Seu Nome" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="email" required disabled={!isOnline || isLoading} className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand-blue-light disabled:opacity-50" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" required disabled={!isOnline || isLoading} className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand-blue-light disabled:opacity-50" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input type="password" required disabled={!isOnline || isLoading} className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white outline-none focus:ring-2 focus:ring-brand-blue-light disabled:opacity-50" placeholder="Confirmar Senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {error && <div className="text-red-400 text-sm text-center bg-red-900/20 py-3 rounded-lg border border-red-500/20 animate-shake">{error}</div>}
                <button type="submit" disabled={isLoading || !isOnline} className="w-full py-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 transition-all transform active:scale-95 disabled:opacity-50">{isLoading ? <Spinner size="sm" /> : 'Criar minha conta'}</button>
                <div className="text-center mt-6"><button type="button" onClick={() => { resetForm(); setMode('login'); }} className="text-sm text-slate-400 hover:text-white transition-colors">Já tem acesso? <span className="font-bold text-brand-blue-light underline">Fazer Login</span></button></div>
            </form>
        )}
      </div>
    </div>
  );
};
