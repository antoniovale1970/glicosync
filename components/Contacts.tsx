
import React, { useState, useMemo } from 'react';
import type { Contact } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserIcon } from './icons/UserIcon';
import { EmailIcon } from './icons/EmailIcon';
import { ShareIcon } from './icons/ShareIcon';
import { HospitalIcon } from './icons/HospitalIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { PharmacyIcon } from './icons/PharmacyIcon';
import { EditIcon } from './icons/EditIcon';
import { SearchIcon } from './icons/SearchIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ConfirmModal } from './ConfirmModal';

interface ContactsProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

type ContactType = 'Médico' | 'Familiar' | 'Emergência' | 'Clínica' | 'Hospital' | 'Laboratório' | 'Farmácia / Drogaria' | 'Outro';

export const Contacts: React.FC<ContactsProps> = ({ contacts, setContacts }) => {
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ContactType>('Médico');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [photo, setPhoto] = useState('');
  const [workplaceIds, setWorkplaceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("O arquivo de imagem é muito grande. Por favor, escolha um arquivo menor que 2MB.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWorkplaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setWorkplaceIds(selectedOptions);
  };

  const resetForm = () => {
    setName('');
    setType('Médico');
    setPhone('');
    setEmail('');
    setSpecialty('');
    setPhoto('');
    setWorkplaceIds([]);
    setNotes('');
    setEditingId(null);
  };

  const handleEdit = (contact: Contact) => {
      setEditingId(contact.id);
      setName(contact.name);
      setType(contact.type);
      setPhone(contact.phone);
      setEmail(contact.email || '');
      setSpecialty(contact.specialty || '');
      setPhoto(contact.photo || '');
      setWorkplaceIds(contact.workplaceIds || []);
      setNotes(contact.notes || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !type) return;

    const contactData: Contact = {
      id: editingId || new Date().toISOString(),
      name,
      type,
      phone,
      email,
      specialty: type === 'Médico' ? specialty : undefined,
      photo: (type === 'Médico' || type === 'Familiar') ? photo : undefined,
      workplaceIds: type === 'Médico' ? workplaceIds : undefined,
      notes,
    };

    if (editingId) {
        setContacts(prev => prev.map(c => c.id === editingId ? contactData : c).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
        setContacts(prev => [...prev, contactData].sort((a, b) => a.name.localeCompare(b.name)));
    }
    resetForm();
  };

  // CORREÇÃO: Uso de evento e setState funcional
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
        setContacts(prev => prev.filter(c => c.id !== deleteId));
        if (editingId === deleteId) resetForm();
        setDeleteId(null);
    }
  };

  const availableWorkplaces = useMemo(() => {
    return contacts.filter(c => c.type === 'Clínica' || c.type === 'Hospital' || c.type === 'Laboratório');
  }, [contacts]);

  const filteredContacts = useMemo(() => {
      if (!searchTerm) return contacts;
      const lowerTerm = searchTerm.toLowerCase();
      return contacts.filter(c => 
        c.name.toLowerCase().includes(lowerTerm) || 
        c.type.toLowerCase().includes(lowerTerm) ||
        c.phone.includes(searchTerm)
      );
  }, [contacts, searchTerm]);

  const handlePrint = () => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;

      const content = filteredContacts.map(c => `
        <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px; border-radius:5px;">
            <h3>${c.name} <small>(${c.type})</small></h3>
            <p><strong>Tel:</strong> ${c.phone}</p>
            ${c.email ? `<p><strong>Email:</strong> ${c.email}</p>` : ''}
            ${c.specialty ? `<p><strong>Esp.:</strong> ${c.specialty}</p>` : ''}
            ${c.notes ? `<p><em>${c.notes}</em></p>` : ''}
        </div>
      `).join('');

      printWindow.document.write(`
        <html>
            <head><title>Contatos - GlicoSync</title>
            <style>body{font-family:sans-serif;padding:20px;}</style>
            </head>
            <body><h1>Lista de Contatos</h1>${content}<script>window.print()</script></body>
        </html>
      `);
      printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Contatos Importantes</h1>

      <div className={`bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700 border-l-4 ${editingId ? 'border-yellow-500' : 'border-brand-blue'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-semibold ${editingId ? 'text-yellow-400' : 'text-slate-200'}`}>
                {editingId ? 'Editar Contato' : 'Adicionar Contato'}
            </h2>
            {editingId && (
                <button onClick={resetForm} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
            )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Foto à esquerda do formulário */}
            {(type === 'Médico' || type === 'Familiar') && (
                <div className="flex-shrink-0 flex flex-col items-center">
                    <label className="block text-sm font-medium text-slate-400 mb-2 self-start">Foto (Opcional)</label>
                    <div className="relative group">
                        {photo ? (
                            <img src={photo} alt="Pré-visualização" className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-700" />
                        ) : (
                            <div className="h-24 w-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-600 text-slate-500 group-hover:border-sky-500 group-hover:text-sky-500 transition-colors">
                                <UserIcon className="h-10 w-10" />
                            </div>
                        )}
                        
                        <label htmlFor="contactPhotoInput" className="absolute bottom-0 right-0 bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 border border-slate-800">
                            <EditIcon className="w-4 h-4" />
                            <input
                                id="contactPhotoInput"
                                type="file"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handlePhotoChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                    {photo && (
                        <button type="button" onClick={() => setPhoto('')} className="mt-2 text-xs text-red-400 hover:text-red-300 hover:underline">
                            Remover
                        </button>
                    )}
                </div>
            )}

            {/* Campos Principais */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label htmlFor="contactName" className="block text-sm font-medium text-slate-400">Nome</label>
                    <input
                    id="contactName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ex: Dr. Silva"
                    required
                    />
                </div>
                
                <div>
                    <label htmlFor="contactType" className="block text-sm font-medium text-slate-400">Tipo</label>
                    <select
                    id="contactType"
                    value={type}
                    onChange={(e) => {
                        const newType = e.target.value as ContactType;
                        setType(newType);
                        if (newType !== 'Médico') {
                            setWorkplaceIds([]);
                            setSpecialty('');
                        }
                    }}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    >
                    <option>Médico</option>
                    <option>Familiar</option>
                    <option>Emergência</option>
                    <option>Clínica</option>
                    <option>Hospital</option>
                    <option>Laboratório</option>
                    <option>Farmácia / Drogaria</option>
                    <option>Outro</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-400">Telefone</label>
                    <input
                    id="contactPhone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ex: (11) 99999-9999"
                    required
                    />
                </div>

                <div className="md:col-span-2">
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-400">Email (Opcional)</label>
                    <input
                    id="contactEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ex: dr.silva@email.com"
                    />
                </div>
            </div>
          </div>

          {type === 'Médico' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700">
              <div className="md:col-span-1">
                <label htmlFor="contactSpecialty" className="block text-sm font-medium text-slate-400">Especialidade (Opcional)</label>
                <input
                  id="contactSpecialty"
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Ex: Endocrinologista"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="workplace" className="block text-sm font-medium text-slate-400">Locais onde atende</label>
                <select
                  id="workplace"
                  multiple
                  value={workplaceIds}
                  onChange={handleWorkplaceChange}
                  className="mt-1 block w-full h-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  {availableWorkplaces.length === 0 ? (
                    <option disabled>Nenhuma clínica/hospital/laboratório cadastrado</option>
                  ) : (
                    availableWorkplaces.map(wp => (
                      <option key={wp.id} value={wp.id}>{wp.name}</option>
                    ))
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-1">Segure Ctrl (ou Cmd em Mac) para selecionar mais de um.</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-2">
            <label htmlFor="contactNotes" className="block text-sm font-medium text-slate-400">Observações (Opcional)</label>
            <textarea
              id="contactNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Ex: Horário de atendimento, dias de folga, convênios aceitos..."
              rows={2}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className={`flex items-center justify-center w-full sm:w-auto font-bold py-2 px-4 rounded-md transition-colors shadow-sm ${editingId ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-brand-blue hover:bg-brand-blue-light text-white'}`}>
              {editingId ? <SaveIcon className="w-5 h-5 mr-2" /> : <PlusIcon className="w-5 h-5 mr-2" />}
              {editingId ? 'Salvar Alterações' : 'Adicionar Contato'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl shadow-black/50 ring-1 ring-slate-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <h2 className="text-xl font-semibold text-slate-200">Lista de Contatos</h2>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                 <div className="relative flex-grow sm:w-64">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar contato..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
                    />
                 </div>
                 <button onClick={handlePrint} className="bg-slate-600 hover:bg-slate-500 text-white p-2 rounded-md shadow-sm" title="Imprimir Lista">
                     <PrinterIcon className="w-5 h-5" />
                 </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.length > 0 ? (
            filteredContacts.map(contact => (
              <div key={contact.id} className={`bg-slate-900/50 border rounded-lg p-4 flex flex-col shadow-md hover:shadow-lg transition-shadow ${editingId === contact.id ? 'border-yellow-500 ring-1 ring-yellow-500/50' : 'border-slate-700'}`}>
                <div className="flex-grow flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {contact.photo ? (
                            <img src={contact.photo} alt={contact.name} className="h-full w-full object-cover" />
                        ) : contact.type === 'Clínica' || contact.type === 'Hospital' ? (
                            <HospitalIcon className="w-7 h-7 text-slate-400" />
                        ) : contact.type === 'Laboratório' ? (
                            <TestTubeIcon className="w-7 h-7 text-slate-400" />
                        ) : contact.type === 'Farmácia / Drogaria' ? (
                            <PharmacyIcon className="w-7 h-7 text-slate-400" />
                        ) : (
                            <UserIcon className="w-7 h-7 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <h3 className="font-bold text-lg text-slate-100 truncate">{contact.name}</h3>
                        <span className="text-xs font-semibold bg-sky-900/50 text-sky-300 px-2 py-0.5 rounded-full">{contact.type}</span>
                        {contact.type === 'Médico' && contact.specialty && (
                          <p className="text-sm font-medium text-sky-400 mt-1 truncate">{contact.specialty}</p>
                        )}
                         <div className="mt-2 space-y-1 text-sm text-slate-300">
                          <p className="flex items-center">
                              <ShareIcon className="w-4 h-4 mr-2 flex-shrink-0" /> 
                              <a href={`tel:${contact.phone}`} className="hover:text-sky-400 truncate">{contact.phone}</a>
                          </p>
                          {contact.email && (
                              <p className="flex items-center">
                                  <EmailIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <a href={`mailto:${contact.email}`} className="hover:text-sky-400 truncate">{contact.email}</a>
                              </p>
                          )}
                      </div>
                    </div>
                </div>

                {contact.type === 'Médico' && contact.workplaceIds && contact.workplaceIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-1">Locais:</h4>
                        <div className="space-y-1">
                            {contact.workplaceIds.map(wpId => {
                                const workplace = contacts.find(c => c.id === wpId);
                                if (!workplace) return null;
                                return (
                                    <div key={wpId} className="flex items-center text-sm text-slate-300">
                                        <HospitalIcon className="w-3 h-3 mr-2 flex-shrink-0" />
                                        <span className="truncate">{workplace.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {contact.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-400 italic line-clamp-2">"{contact.notes}"</p>
                    </div>
                )}


                <div className="flex justify-end mt-4 pt-2 border-t border-slate-700/50 gap-2">
                    <button 
                        onClick={() => handleEdit(contact)} 
                        className="text-sky-500 hover:text-sky-400 p-1.5 hover:bg-sky-500/10 rounded-lg transition-colors"
                        title="Editar"
                        disabled={!!editingId && editingId !== contact.id}
                    >
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={(e) => handleDeleteClick(e, contact.id)} 
                        className="text-red-500 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Excluir"
                        disabled={!!editingId && editingId !== contact.id}
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-6 md:col-span-2 lg:col-span-3">Nenhum contato encontrado.</p>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir Contato"
        message="Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};
