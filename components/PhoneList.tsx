
import React, { useState, useMemo, useRef } from 'react';
import type { Contact } from '../types';
import { UserIcon } from './icons/UserIcon';
import { HospitalIcon } from './icons/HospitalIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { PharmacyIcon } from './icons/PharmacyIcon';
import { SirenIcon } from './icons/SirenIcon';
import { ShareIcon } from './icons/ShareIcon';
import { AmbulanceIcon } from './icons/AmbulanceIcon';
import { FlameIcon } from './icons/FlameIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { LifeRingIcon } from './icons/LifeRingIcon';
import { CarIcon } from './icons/CarIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SearchIcon } from './icons/SearchIcon';

interface PhoneListProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

const getCategoryIcon = (type: Contact['type']) => {
    switch(type) {
        case 'Médico':
        case 'Familiar':
        case 'Emergência':
        case 'Outro':
            return <UserIcon className="w-6 h-6 text-slate-400" />;
        case 'Clínica':
        case 'Hospital':
            return <HospitalIcon className="w-6 h-6 text-slate-400" />;
        case 'Laboratório':
            return <TestTubeIcon className="w-6 h-6 text-slate-400" />;
        case 'Farmácia / Drogaria':
            return <PharmacyIcon className="w-6 h-6 text-slate-400" />;
        default:
            return <UserIcon className="w-6 h-6 text-slate-400" />;
    }
}

const CONTACT_CATEGORIES = [
    'Todas',
    'Médico',
    'Familiar',
    'Emergência',
    'Clínica',
    'Hospital',
    'Laboratório',
    'Farmácia / Drogaria',
    'Outro'
];

// Removed 'Polícia Rodoviária' as requested
const PUBLIC_EMERGENCY_NUMBERS = [
    { name: 'SAMU', number: '192', desc: 'Ambulância', icon: AmbulanceIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Bombeiros', number: '193', desc: 'Resgate', icon: FlameIcon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { name: 'Polícia', number: '190', desc: 'Militar', icon: ShieldIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Defesa Civil', number: '199', desc: 'Desastres', icon: LifeRingIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

export const PhoneList: React.FC<PhoneListProps> = ({ contacts, setContacts }) => {
  // State for input field
  const [searchInput, setSearchInput] = useState('');
  // State for actual applied filter
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const printableContentRef = useRef<HTMLDivElement>(null);

  // Quick Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<Contact['type']>('Outro');

  const userEmergencyContacts = useMemo(() => {
      return contacts.filter(c => c.type === 'Emergência');
  }, [contacts]);

  const categorizedContacts = useMemo(() => {
    const filtered = contacts.filter(contact => {
      // Filtro por Categoria
      const matchesCategory = selectedCategory === 'Todas' || contact.type === selectedCategory;
      
      // Filtro por Texto (Nome ou Tipo) - Usa o termo ATIVO
      const matchesSearch = 
        contact.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
        contact.type.toLowerCase().includes(activeSearchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
      return {} as Record<Contact['type'], Contact[]>;
    }

    return filtered.reduce((acc, contact) => {
      const type = contact.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(contact);
      return acc;
    }, {} as Record<Contact['type'], Contact[]>);
  }, [contacts, activeSearchTerm, selectedCategory]);

  const sortedCategories = Object.keys(categorizedContacts).sort((a, b) => a.localeCompare(b));
  const hasResults = Object.keys(categorizedContacts).length > 0;
  
  const handlePrint = () => {
    const contentEl = printableContentRef.current;
    if (!contentEl) {
      console.error("Elemento para impressão não encontrado.");
      return;
    }
    const title = "Lista Telefônica";

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert("Por favor, habilite os pop-ups para que a impressão funcione.");
      return;
    }

    const stylesHtml = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('');

    const contentHtml = contentEl.innerHTML;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @media print {
              body {
                margin: 1.5rem;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Force light mode for printing */
              body, div, p, h1, h2, h3, h4, li, strong, table, th, td, span {
                background: transparent !important;
                color: #000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              a, a:visited {
                text-decoration: none;
                color: #000 !important;
              }
              /* Highlight Emergency Card in print */
              .emergency-card {
                  border: 2px solid #ef4444 !important;
                  background-color: #fef2f2 !important;
              }
              /* Hide elements not meant for printing */
              button, .print-hide, svg {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${selectedCategory !== 'Todas' ? `<p>Filtro: ${selectedCategory}</p>` : ''}
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSearchClick = () => {
      setActiveSearchTerm(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleSearchClick();
      }
  };

  const handleOpenQuickAdd = () => {
      setNewName(searchInput); // Pre-fill name
      setNewPhone('');
      setNewType('Outro');
      setIsAddModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newName || !newPhone) return;

      const newContact: Contact = {
          id: new Date().toISOString(),
          name: newName,
          phone: newPhone,
          type: newType,
      };

      setContacts(prev => [...prev, newContact].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddModalOpen(false);
      setSearchInput('');
      setActiveSearchTerm(''); // Clear search to show new contact
  };
  
  const handleClearSearch = () => {
      setSearchInput('');
      setActiveSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Lista Telefônica</h1>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 mb-6">
          <div className="w-full flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-grow w-full">
                <label htmlFor="searchContacts" className="block text-sm font-medium text-slate-400">
                  Pesquisar
                </label>
                <div className="flex gap-2 mt-1">
                    <input
                    id="searchContacts"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Digite um nome..."
                    />
                    <button 
                        onClick={handleSearchClick}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md shadow-sm transition-colors flex items-center justify-center"
                        title="Pesquisar"
                    >
                        <SearchIcon className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Aviso e Botão de Cadastro Rápido */}
                {activeSearchTerm && !hasResults && (
                    <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                        <span className="text-yellow-200 text-sm leading-tight">
                            O nome <strong>"{activeSearchTerm}"</strong> não consta na lista. Deseja cadastrá-lo?
                        </span>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={handleOpenQuickAdd}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm"
                            >
                                Sim
                            </button>
                            <button
                                onClick={handleClearSearch}
                                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm border border-slate-600"
                            >
                                Não
                            </button>
                        </div>
                    </div>
                )}
              </div>
              <div className="w-full md:w-1/3">
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-slate-400">
                  Filtrar por Categoria
                </label>
                <select
                  id="categoryFilter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  {CONTACT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
          </div>
           <div className="flex items-center gap-2 self-start lg:self-center h-[42px] mt-6 md:mt-0">
                <button
                    onClick={handlePrint}
                    disabled={contacts.length === 0}
                    className="flex items-center bg-slate-600 text-white font-bold py-2 px-3 rounded-md hover:bg-slate-500 transition-colors shadow-sm disabled:bg-slate-600/50 disabled:cursor-not-allowed h-full"
                    title="Imprimir Lista"
                >
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Imprimir
                </button>
           </div>
        </div>

        <div className="space-y-6">
            <div ref={printableContentRef}>
                {/* Emergency Highlight Card */}
                {(selectedCategory === 'Todas' || selectedCategory === 'Emergência') && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-2">
                            <SirenIcon className="w-6 h-6 text-red-500" />
                            <h2 className="text-xl font-bold text-slate-100">Telefones de Emergência</h2>
                        </div>

                        {/* UPDATED GRID: 4 Columns for single line on large screens */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Public Numbers - Horizontal, Clean, Professional Layout */}
                            {PUBLIC_EMERGENCY_NUMBERS.map(item => {
                                const Icon = item.icon;
                                return (
                                    <div 
                                        key={item.name} 
                                        className={`flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-slate-500 transition-all duration-200 group h-full`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`flex-shrink-0 p-2 rounded-lg ${item.bg} ${item.color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                {/* Name Enlarged and Bold */}
                                                <span className="text-base font-extrabold text-slate-200 leading-none group-hover:text-white transition-colors uppercase tracking-tight">
                                                    {item.name}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">
                                                    {item.desc}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Number on the right */}
                                        <div className="pl-3 ml-2 border-l border-slate-700/50 h-8 flex items-center flex-shrink-0">
                                            <span className={`text-xl font-black ${item.color} tracking-tight`}>
                                                {item.number}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* User Emergency Contacts - Keep Functional */}
                            {userEmergencyContacts.map(contact => (
                                <div key={contact.id} className="bg-slate-800 border border-red-500/20 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-extrabold text-slate-200 truncate text-sm uppercase">{contact.name}</p>
                                            <p className="text-[10px] text-red-400 font-medium uppercase tracking-wide">Pessoal</p>
                                        </div>
                                    </div>
                                    <a href={`tel:${contact.phone}`} className="flex items-center justify-end gap-2 text-sm font-bold text-white hover:text-sky-400 transition-colors mt-auto">
                                        <ShareIcon className="w-3 h-3" /> {contact.phone}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {hasResults ? (
                    sortedCategories.map(category => (
                    <div key={category} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-3 mb-3 border-b border-slate-700 pb-2">
                            {getCategoryIcon(category as any)}
                            <h2 className="text-xl font-semibold text-slate-200">{category}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categorizedContacts[category as Contact['type']].map(contact => (
                            <div key={contact.id} className="bg-slate-900/30 border border-slate-700/50 p-3 rounded-md flex justify-between items-center">
                                <div className="overflow-hidden">
                                    <p className="font-bold text-slate-100 truncate">{contact.name}</p>
                                    <a href={`tel:${contact.phone}`} className="text-sm text-sky-400 hover:underline block">{contact.phone}</a>
                                    {contact.email && <a href={`mailto:${contact.email}`} className="text-xs text-slate-400 hover:text-slate-300 truncate block">{contact.email}</a>}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-slate-400 mb-4">
                            {activeSearchTerm 
                                ? "Nenhum contato encontrado." 
                                : "Nenhum contato cadastrado."}
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* QUICK ADD CONTACT MODAL */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={() => setIsAddModalOpen(false)}>
              <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-100">Cadastro Rápido</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                          <CloseIcon className="w-6 h-6" />
                      </button>
                  </div>
                  <form onSubmit={handleSaveContact} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                          <input 
                              type="text" 
                              value={newName} 
                              onChange={e => setNewName(e.target.value)} 
                              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-sky-500 focus:border-sky-500"
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Telefone</label>
                          <input 
                              type="tel" 
                              value={newPhone} 
                              onChange={e => setNewPhone(e.target.value)} 
                              placeholder="(XX) XXXXX-XXXX"
                              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-sky-500 focus:border-sky-500"
                              required
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Tipo</label>
                          <select 
                              value={newType} 
                              onChange={e => setNewType(e.target.value as Contact['type'])}
                              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-sky-500 focus:border-sky-500"
                          >
                              {CONTACT_CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                          <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg">Cancelar</button>
                          <button type="submit" className="bg-brand-blue hover:bg-brand-blue-light text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2">
                              <PlusIcon className="w-4 h-4" /> Salvar Contato
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
