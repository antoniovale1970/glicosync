
import React, { useState } from 'react';
import { GlicoSyncIcon } from './icons/GlicoSyncIcon';
import { CheckIcon } from './icons/CheckIcon';
import { GlucoseIcon } from './icons/GlucoseIcon';
import { MedicationIcon } from './icons/MedicationIcon';
import { WifiIcon } from './icons/WifiIcon';
import { RocketIcon } from './icons/RocketIcon';
import { AppleIcon } from './icons/AppleIcon';
import { SyringeIcon } from './icons/SyringeIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { ContactIcon } from './icons/ContactIcon';
import { LogoutIcon } from './icons/LogoutIcon';

interface WelcomeModalProps {
  onClose: (skipProfile: boolean, dontShowAgain: boolean) => void;
  onLogout: () => void;
}

const FeatureItem = ({ icon: Icon, label }: { icon: React.FC<any>, label: string }) => (
  <div className="flex items-center gap-3 py-2 px-1">
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-500/10 text-sky-400 shrink-0">
        <Icon className="w-3.5 h-3.5" />
    </div>
    <span className="text-slate-400 text-xs font-medium leading-tight">{label}</span>
  </div>
);

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, onLogout }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl border border-slate-700/50 overflow-hidden relative flex flex-col md:flex-row my-auto min-h-[600px]">
        
        {/* --- LEFT COLUMN: Branding & Hero --- */}
        <div className="relative w-full md:w-5/12 bg-gradient-to-br from-brand-blue/20 via-slate-900 to-slate-950 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-700/50">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl mix-blend-screen"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center h-full justify-center">
                <div className="p-6 bg-slate-800/40 rounded-[2rem] ring-1 ring-slate-600/30 shadow-2xl mb-8 backdrop-blur-md transform hover:scale-105 transition-transform duration-700">
                    <GlicoSyncIcon className="w-20 h-20 text-brand-blue-light drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  Bem-vindo ao <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-brand-blue-light">GlicoSync</span>
                </h2>
                
                <p className="text-slate-300 text-lg leading-relaxed max-w-xs mx-auto font-light mb-8">
                  Sua plataforma para transformar dados em <strong className="text-white font-semibold">saúde e bem-estar</strong>.
                </p>

                <p className="text-slate-600 text-[10px] font-mono mt-auto tracking-widest uppercase">© GlicoSync - 2025</p>
            </div>
        </div>

        {/* --- RIGHT COLUMN: Features & Action --- */}
        <div className="relative w-full md:w-7/12 bg-slate-900 p-6 sm:p-10 flex flex-col">
          
          <div className="flex-grow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span className="h-px w-8 bg-slate-700/50"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Funcionalidades Inteligentes</span>
                <span className="h-px flex-grow bg-slate-700/50"></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 mb-10">
                 <FeatureItem icon={GlucoseIcon} label="Monitoramento Glicêmico" />
                 <FeatureItem icon={SyringeIcon} label="Controle de Insulinas" />
                 <FeatureItem icon={MedicationIcon} label="Alertas de Medicamentos" />
                 <FeatureItem icon={AppleIcon} label="Análise Nutricional IA" />
                 <FeatureItem icon={MapPinIcon} label="Rede de Farmácias" />
                 <FeatureItem icon={TestTubeIcon} label="Histórico Clínico" />
                 <FeatureItem icon={DashboardIcon} label="Insights e Relatórios" />
                 <FeatureItem icon={ContactIcon} label="Agenda Multidisciplinar" />
                 <FeatureItem icon={WifiIcon} label="Acesso Global" />
                 <FeatureItem icon={CheckIcon} label="Sincronização Ativa" />
              </div>

              <div className="bg-indigo-500/5 rounded-2xl p-4 border border-indigo-500/10 flex items-start gap-4 mb-auto group hover:border-indigo-500/20 transition-colors">
                 <div className="bg-indigo-500/10 p-2.5 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                    <RocketIcon className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div className="text-left">
                    <h4 className="text-indigo-300 font-bold text-sm mb-1">Ecossistema Conectado</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                       Inicie sua experiência configurando seu perfil para que nossa inteligência artificial possa personalizar suas dicas e alertas.
                    </p>
                 </div>
              </div>

              {/* OPÇÃO DE NÃO EXIBIR NOVAMENTE */}
              <div className="mt-8 flex justify-center">
                  <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                          <input 
                              type="checkbox" 
                              checked={dontShowAgain}
                              onChange={(e) => setDontShowAgain(e.target.checked)}
                              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-brand-blue-light focus:ring-brand-blue-light focus:ring-offset-slate-900 transition-all cursor-pointer"
                          />
                      </div>
                      <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors select-none">Não exibir mais essa tela</span>
                  </label>
              </div>

              {/* AÇÕES PRINCIPAIS */}
              <div className="mt-6 mb-6 flex flex-col sm:flex-row items-center gap-4 justify-center">
                  <button 
                    onClick={() => onClose(false, dontShowAgain)}
                    className="w-full sm:flex-1 group relative flex items-center justify-between py-4 px-6 rounded-2xl border border-white/20 bg-brand-blue/20 backdrop-blur-xl text-white shadow-2xl transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.98] hover:bg-brand-blue/30 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 text-xs font-black uppercase tracking-widest group-hover:text-sky-300 group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] transition-all duration-300">
                        Configurar Perfil
                    </span>
                    <div className="relative z-10 bg-white/20 p-1.5 rounded-full group-hover:bg-sky-400/30 group-hover:drop-shadow-[0_0_5px_rgba(56,189,248,0.6)] transition-all">
                        <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  <button 
                    onClick={() => onClose(true, dontShowAgain)}
                    className="w-full sm:flex-1 group relative flex items-center justify-between py-4 px-6 rounded-2xl border border-white/20 bg-brand-blue/20 backdrop-blur-xl text-white shadow-2xl transition-all duration-500 transform hover:-translate-y-1 active:scale-[0.98] hover:bg-brand-blue/30 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 text-xs font-black uppercase tracking-widest group-hover:text-sky-300 group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] transition-all duration-300">
                        Painel Principal
                    </span>
                    <div className="relative z-10 bg-white/20 p-1.5 rounded-full group-hover:bg-sky-400/30 group-hover:drop-shadow-[0_0_5px_rgba(56,189,248,0.6)] transition-all">
                        <DashboardIcon className="w-4 h-4 text-white" />
                    </div>
                  </button>
              </div>
          </div>

          {/* Footer with Logout */}
          <div className="pt-6 border-t border-slate-800/50 flex justify-end">
              <button 
                  onClick={onLogout}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/30 border border-slate-700/30 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300 group"
              >
                  <span>Encerrar Sessão</span>
                  <LogoutIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-all" />
              </button>
          </div>

        </div>
      </div>
    </div>
  );
};
