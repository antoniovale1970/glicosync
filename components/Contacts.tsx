import React, { useState, useMemo } from 'react';
import type { Contact } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UserIcon } from './icons/UserIcon';
import { EmailIcon } from './icons/EmailIcon';
import { ShareIcon } from './icons/ShareIcon';
import { HospitalIcon } from './icons/HospitalIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';

interface ContactsProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

type ContactType = 'Médico' | 'Familiar' | 'Emergência' | 'Clínica' | 'Hospital' | 'Laboratório' | 'Outro';

export const Contacts: React.FC<ContactsProps> = ({ contacts, setContacts }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<ContactType>('Médico');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [photo, setPhoto] = useState('');
  const [workplaceIds, setWorkplaceIds] = useState<string[]>([]);


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("O arquivo de imagem é muito grande. Por favor, escolha um arquivo menor que 2MB.");
        e.target.value = ''; // Clear the input
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !type) return;

    const newContact: Contact = {
      id: new Date().toISOString(),
      name,
      type,
      phone,
      email,
      specialty: type === 'Médico' ? specialty : undefined,
      photo: (type === 'Médico' || type === 'Familiar') ? photo : undefined,
      workplaceIds: type === 'Médico' ? workplaceIds : undefined,
    };

    setContacts([...contacts, newContact].sort((a, b) => a.name.localeCompare(b.name)));
    setName('');
    setType('Médico');
    setPhone('');
    setEmail('');
    setSpecialty('');
    setPhoto('');
    setWorkplaceIds([]);
  };

  const handleDelete = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const availableWorkplaces = useMemo(() => {
    return contacts.filter(c => c.type === 'Clínica' || c.type === 'Hospital' || c.type === 'Laboratório');
  }, [contacts]);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Contatos Importantes</h1>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Adicionar Contato</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
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
          <div>
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

          {(type === 'Médico' || type === 'Familiar') && (
            <div className="md:col-span-2">
                <label htmlFor="contactPhoto" className="block text-sm font-medium text-slate-400">Foto (Opcional)</label>
                <div className="mt-1 flex items-center gap-4">
                    {photo ? (
                        <img src={photo} alt="Pré-visualização" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                            <UserIcon className="h-8 w-8 text-slate-500" />
                        </div>
                    )}
                    <div className="flex-grow">
                        <input
                            id="contactPhoto"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handlePhotoChange}
                            className="block w-full text-sm text-slate-400
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-sky-900/50 file:text-sky-300
                                        hover:file:bg-sky-800/50 cursor-pointer"
                        />
                        <p className="text-xs text-slate-500 mt-1">Tamanho máximo: 2MB.</p>
                    </div>

                    {photo && (
                        <button type="button" onClick={() => setPhoto('')} className="text-sm text-red-500 hover:text-red-400 self-center">Remover</button>
                    )}
                </div>
            </div>
          )}

          {type === 'Médico' && (
            <>
              <div className="md:col-span-2">
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
              <div className="md:col-span-2">
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
            </>
          )}

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="flex items-center justify-center w-full sm:w-auto bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm">
              <PlusIcon className="w-5 h-5 mr-2" />
              Adicionar Contato
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Lista de Contatos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.length > 0 ? (
            contacts.map(contact => (
              <div key={contact.id} className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex flex-col">
                <div className="flex-grow flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        {contact.photo ? (
                            <img src={contact.photo} alt={contact.name} className="h-14 w-14 rounded-full object-cover" />
                        ) : contact.type === 'Clínica' || contact.type === 'Hospital' ? (
                            <HospitalIcon className="w-7 h-7 text-slate-400" />
                        ) : contact.type === 'Laboratório' ? (
                            <TestTubeIcon className="w-7 h-7 text-slate-400" />
                        ) : (
                            <UserIcon className="w-7 h-7 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-slate-100">{contact.name}</h3>
                        <span className="text-xs font-semibold bg-sky-900/50 text-sky-300 px-2 py-0.5 rounded-full">{contact.type}</span>
                        {contact.type === 'Médico' && contact.specialty && (
                          <p className="text-sm font-medium text-sky-400 mt-1">{contact.specialty}</p>
                        )}
                         <div className="mt-2 space-y-1 text-sm text-slate-300">
                          <p className="flex items-center">
                              {/* Using ShareIcon as a phone icon */}
                              <ShareIcon className="w-4 h-4 mr-2" /> 
                              <a href={`tel:${contact.phone}`} className="hover:text-sky-400">{contact.phone}</a>
                          </p>
                          {contact.email && (
                              <p className="flex items-center">
                                  <EmailIcon className="w-4 h-4 mr-2" />
                                  <a href={`mailto:${contact.email}`} className="hover:text-sky-400 truncate">{contact.email}</a>
                              </p>
                          )}
                      </div>
                    </div>
                </div>

                {contact.type === 'Médico' && contact.workplaceIds && contact.workplaceIds.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300 mb-1">Locais de Atendimento:</h4>
                        <div className="space-y-1">
                            {contact.workplaceIds.map(wpId => {
                                const workplace = contacts.find(c => c.id === wpId);
                                if (!workplace) return null;
                                return (
                                    <div key={wpId} className="flex items-center text-sm text-slate-300">
                                        <HospitalIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                        <span>{workplace.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}


                <div className="flex justify-end mt-2">
                    <button onClick={() => handleDelete(contact.id)} className="text-red-500 hover:text-red-400 p-1">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 py-6 md:col-span-2 lg:col-span-3">Nenhum contato cadastrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};