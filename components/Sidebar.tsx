
import React from 'react';
import { DashboardIcon } from './icons/DashboardIcon';
import { GlucoseIcon } from './icons/GlucoseIcon';
import { MedicationIcon } from './icons/MedicationIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { ContactIcon } from './icons/ContactIcon';
import { WifiIcon } from './icons/WifiIcon';
import { UserIcon } from './icons/UserIcon';
import { CloseIcon } from './icons/CloseIcon';
import { GlicoSyncIcon } from './icons/GlicoSyncIcon';
import { AppleIcon } from './icons/AppleIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronsLeftIcon } from './icons/ChevronsLeftIcon';
import { ChevronsRightIcon } from './icons/ChevronsRightIcon';
import { ShareIcon } from './icons/ShareIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { InstallIcon } from './icons/InstallIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { SyringeIcon } from './icons/SyringeIcon';
import type { UserAccount } from '../types';


interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isSidebarCompact: boolean;
  setIsSidebarCompact: (isCompact: boolean) => void;
  installPromptEvent: any;
  handleInstallClick: () => void;
  onLogout: () => void;
  allowedViews?: string[]; // Legacy prop - kept for compatibility but ignored in logic
  user?: UserAccount;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
  { id: 'glicemia', label: 'Glicemia', icon: GlucoseIcon },
  { id: 'insulina', label: 'Insulina', icon: SyringeIcon },
  { id: 'refeicoes', label: 'Refeições', icon: AppleIcon },
  { id: 'medicamentos', label: 'Medicamentos', icon: MedicationIcon },
  { id: 'exames', label: 'Exames', icon: TestTubeIcon },
  { id: 'contatos', label: 'Contatos', icon: ContactIcon },
  { id: 'listaTelefonica', label: 'Lista Telefônica', icon: ShareIcon },
  { id: 'recursos', label: 'Recursos Online', icon: WifiIcon },
  { id: 'perfil', label: 'Meu Perfil', icon: UserIcon },
  { id: 'configuracoes', label: 'Configurações', icon: SettingsIcon },
];

const NavLink: React.FC<{
  item: typeof navItems[0];
  isActive: boolean;
  onClick: () => void;
  isCompact: boolean;
}> = ({ item, isActive, onClick, isCompact }) => {
  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onClick();
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={`flex items-center py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-brand-blue-light text-white shadow-md'
          : 'text-white hover:bg-brand-blue-light/50'
      } ${isCompact ? 'md:justify-center md:px-2' : 'px-4'}`}
      title={item.label}
    >
      <div className="relative">
          <Icon className="w-5 h-5 flex-shrink-0" />
      </div>
      
      <span className={`ml-3 whitespace-nowrap ${isCompact ? 'md:hidden' : 'block'} flex-grow`}>
          {item.label}
      </span>
    </a>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen, isSidebarCompact, setIsSidebarCompact, installPromptEvent, handleInstallClick, onLogout, user }) => {
  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setIsOpen(false);
  };
  
  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <div className={`fixed top-0 left-0 h-full bg-brand-blue text-white p-4 z-30 transform md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCompact ? 'md:w-20' : 'md:w-72'} transition-all duration-300 ease-in-out flex flex-col`}>
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 overflow-hidden">
                  <GlicoSyncIcon className="h-8 w-8 flex-shrink-0" />
                  <div className={`${isSidebarCompact ? 'md:hidden' : 'block'} flex flex-col`}>
                    <h2 className="text-2xl font-bold whitespace-nowrap tracking-tight leading-none">GlicoSync</h2>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-white rounded-md hover:bg-white/20">
                  <CloseIcon className="h-6 w-6" />
                </button>
            </div>

            <nav className="space-y-1 flex-grow overflow-y-auto custom-scrollbar pr-1">
              {navItems.map((item) => {
                  return (
                    <NavLink
                      key={item.id}
                      item={item}
                      isActive={currentView === item.id}
                      onClick={() => handleNavClick(item.id)}
                      isCompact={isSidebarCompact}
                    />
                  );
              })}
            </nav>

             <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={onLogout}
                className={`flex items-center w-full py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-white hover:bg-red-600/80 ${isSidebarCompact ? 'justify-center' : 'px-4'}`}
                title="Sair"
              >
                <LogoutIcon className="w-5 h-5" />
                <span className={`ml-3 whitespace-nowrap ${isSidebarCompact ? 'md:hidden' : 'block'}`}>Sair</span>
              </button>

              <div className="hidden md:block space-y-2">
                  {installPromptEvent && (
                    <button
                        onClick={handleInstallClick}
                        className={`flex items-center w-full py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-white bg-green-600 hover:bg-green-700 ${isSidebarCompact ? 'justify-center' : 'px-4'}`}
                        title="Instalar Aplicativo"
                    >
                        <InstallIcon className="w-5 h-5" />
                        <span className={`ml-3 whitespace-nowrap ${isSidebarCompact ? 'md:hidden' : 'block'}`}>Instalar App</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsSidebarCompact(!isSidebarCompact)}
                    className={`flex items-center w-full py-3 text-sm font-medium rounded-lg transition-colors duration-200 text-white hover:bg-brand-blue-light/50 ${isSidebarCompact ? 'justify-center' : 'px-4'}`}
                    title={isSidebarCompact ? "Mostrar Menu" : "Ocultar Menu"}
                  >
                    {isSidebarCompact
                      ? <ChevronsRightIcon className="w-5 h-5" />
                      : <>
                          <ChevronsLeftIcon className="w-5 h-5 mr-3" />
                          <span>Ocultar Menu</span>
                        </>
                    }
                  </button>
                  
                  <div className={`flex items-center justify-center gap-2 text-[10px] font-mono text-white/50 pt-2 ${isSidebarCompact ? 'hidden' : 'block'}`}>
                      <span>Ver. 1.0</span>
                  </div>
              </div>
            </div>
        </div>
      </div>
    </>
  );
};
