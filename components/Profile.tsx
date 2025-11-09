import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { HealthIcon } from './icons/HealthIcon';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';


interface ProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

export const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile, allergies: profile.allergies || [] });
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
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
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAllergyAdd = () => {
    const trimmedAllergy = newAllergy.trim();
    if (trimmedAllergy && !(formData.allergies || []).includes(trimmedAllergy)) {
      setFormData(prev => ({
        ...prev,
        allergies: [...(prev.allergies || []), trimmedAllergy]
      }));
      setNewAllergy('');
    }
  };
  
  const handleAllergyRemove = (allergyToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: (prev.allergies || []).filter(allergy => allergy !== allergyToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditing(false);
    setSuccessMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Meu Perfil</h1>
        {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm"
            >
                Editar Perfil
            </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-md" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="bg-slate-800 p-8 rounded-xl shadow-lg ring-1 ring-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4 border-b border-slate-700 pb-6">
                <div className="relative">
                    {formData.photo ? (
                    <img src={formData.photo} alt="Foto de Perfil" className="h-32 w-32 rounded-full object-cover ring-4 ring-sky-500/50 shadow-lg" />
                    ) : (
                    <div className="h-32 w-32 rounded-full bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-600">
                        <UserIcon className="h-16 w-16 text-slate-500" />
                    </div>
                    )}
                    {isEditing && (
                    <>
                        <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 bg-sky-500 text-white rounded-full p-2 cursor-pointer hover:bg-sky-600 shadow-md transition-transform hover:scale-110">
                        <EditIcon className="w-5 h-5" />
                        </label>
                        <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} />
                    </>
                    )}
                </div>
                {isEditing && formData.photo && (
                    <button type="button" onClick={() => setFormData(prev => ({...prev, photo: ''}))} className="text-sm text-red-500 hover:underline">
                    Remover Foto
                    </button>
                )}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">Nome Completo</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-700 disabled:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-slate-300">Idade</label>
              <input
                type="number"
                name="age"
                id="age"
                value={formData.age}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-700 disabled:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-slate-300">Peso (kg)</label>
              <input
                type="number"
                name="weight"
                id="weight"
                value={formData.weight}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-700 disabled:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-slate-300">Altura (cm)</label>
              <input
                type="number"
                name="height"
                id="height"
                value={formData.height}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-700 disabled:text-slate-400"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="diabetesType" className="flex items-center text-sm font-medium text-slate-300">
                <HealthIcon className="w-5 h-5 mr-2 text-sky-400"/>
                Tipo de Diabetes
              </label>
              <select
                name="diabetesType"
                id="diabetesType"
                value={formData.diabetesType}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-700 disabled:text-slate-400"
              >
                <option>Tipo 1</option>
                <option>Tipo 2</option>
                <option>Gestacional</option>
                <option>Outro</option>
              </select>
            </div>
            {/* --- ALLERGIES SECTION --- */}
            <div className="md:col-span-2 border-t border-slate-700 pt-6">
                <label className="block text-sm font-medium text-slate-300">Alergias Conhecidas</label>
                {isEditing ? (
                <div className="mt-2 space-y-3">
                    <div className="flex items-stretch gap-2">
                      <input
                          type="text"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAllergyAdd(); } }}
                          className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                          placeholder="Ex: Penicilina, Frutos do mar"
                      />
                      <button
                          type="button"
                          onClick={handleAllergyAdd}
                          className="flex-shrink-0 flex items-center justify-center bg-sky-500 text-white font-bold px-4 rounded-md hover:bg-sky-600 transition-colors shadow-sm"
                          aria-label="Adicionar Alergia"
                      >
                          <PlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                    {(formData.allergies || []).length > 0 ? (
                        (formData.allergies || []).map((allergy, index) => (
                        <span key={index} className="flex items-center gap-2 bg-slate-600 text-slate-100 text-sm font-medium pl-3 pr-1 py-1 rounded-full">
                            {allergy}
                            <button
                            type="button"
                            onClick={() => handleAllergyRemove(allergy)}
                            className="text-slate-400 hover:bg-slate-500 rounded-full h-5 w-5 flex items-center justify-center transition-colors"
                            aria-label={`Remover ${allergy}`}
                            >
                            <CloseIcon className="w-3 h-3"/>
                            </button>
                        </span>
                        ))
                    ) : (
                        <p className="text-sm text-slate-500 p-2">Nenhuma alergia adicionada.</p>
                    )}
                    </div>
                </div>
                ) : (
                <div className="mt-2 flex flex-wrap gap-2 min-h-[2.5rem]">
                    {(formData.allergies || []).length > 0 ? (
                    (formData.allergies || []).map((allergy, index) => (
                        <span key={index} className="bg-sky-900/50 text-sky-200 text-sm font-medium px-3 py-1.5 rounded-full ring-1 ring-sky-500/30">
                        {allergy}
                        </span>
                    ))
                    ) : (
                    <p className="text-sm text-slate-400 italic p-2">Nenhuma alergia cadastrada.</p>
                    )}
                </div>
                )}
            </div>
          </div>
          {isEditing && (
            <div className="flex justify-end space-x-4">
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setFormData({ ...profile, allergies: profile.allergies || [] }); }}
                className="bg-slate-600 text-slate-100 font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};