
import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, UserAccount } from '../types';
import { HealthIcon } from './icons/HealthIcon';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CloseIcon } from './icons/CloseIcon';
import { LockIcon } from './icons/LockIcon';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmModal } from './ConfirmModal';
import { auth } from '../services/firebase';
import { updatePassword } from 'firebase/auth';
import { Spinner } from './Spinner';
import { CheckIcon } from './icons/CheckIcon';
import { AlertIcon } from './icons/AlertIcon';


interface ProfileProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  user: UserAccount;
  onUpdatePassword: (newPass: string) => void;
  onDeleteAccount: () => void;
  onUpdateUser: (data: Partial<UserAccount>) => void;
  autoEdit?: boolean;
  onAutoEditHandled?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, setProfile, user, onUpdatePassword, onDeleteAccount, onUpdateUser, autoEdit, onAutoEditHandled }) => {
  const [formData, setFormData] = useState<UserProfile>({ 
      ...profile, 
      allergies: profile.allergies || [],
      healthConditions: profile.healthConditions || []
  });
  const [email, setEmail] = useState(user.email || '');

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newHealthCondition, setNewHealthCondition] = useState('');

  // Password Update Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Modal Deletar
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (autoEdit) {
        setIsEditing(true);
        if (onAutoEditHandled) {
            onAutoEditHandled();
        }
    }
  }, [autoEdit, onAutoEditHandled]);

  const bmiData = useMemo(() => {
    let weight = parseFloat(formData.weight.replace(',', '.'));
    let height = parseFloat(formData.height.replace(',', '.'));

    if (weight > 0 && height > 0) {
      if (height < 3.0) {
          height = height * 100;
      }
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      if (!isFinite(bmi) || bmi > 100 || bmi < 5) return null;
      const bmiValue = bmi.toFixed(1);
      let interpretation = '';
      let colorClass = '';
      if (bmi < 18.5) { interpretation = 'Abaixo do peso'; colorClass = 'text-sky-400'; }
      else if (bmi >= 18.5 && bmi <= 24.9) { interpretation = 'Peso normal'; colorClass = 'text-green-400'; }
      else if (bmi >= 25 && bmi <= 29.9) { interpretation = 'Sobrepeso'; colorClass = 'text-yellow-400'; }
      else { interpretation = 'Obesidade'; colorClass = 'text-red-400'; }
      return { value: bmiValue, interpretation, colorClass };
    }
    return null;
  }, [formData.weight, formData.height]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (name === 'birthDate' && value) {
             const today = new Date();
             const birthDate = new Date(value);
             let age = today.getFullYear() - birthDate.getFullYear();
             const m = today.getMonth() - birthDate.getMonth();
             if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
             newData.age = age.toString();
        }
        return newData;
    });
  };
  
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert("A imagem é muito grande (Máx: 2MB).");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => { setFormData(prev => ({ ...prev, photo: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleAllergyAdd = () => {
    const trimmedAllergy = newAllergy.trim();
    if (trimmedAllergy && !(formData.allergies || []).includes(trimmedAllergy)) {
      setFormData(prev => ({ ...prev, allergies: [...(prev.allergies || []), trimmedAllergy] }));
      setNewAllergy('');
    }
  };
  
  const handleAllergyRemove = (allergyToRemove: string) => {
    setFormData(prev => ({ ...prev, allergies: (prev.allergies || []).filter(allergy => allergy !== allergyToRemove) }));
  };

  const handleHealthConditionAdd = () => {
    const trimmedCondition = newHealthCondition.trim();
    if (trimmedCondition && !(formData.healthConditions || []).includes(trimmedCondition)) {
      setFormData(prev => ({ ...prev, healthConditions: [...(prev.healthConditions || []), trimmedCondition] }));
      setNewHealthCondition('');
    }
  };

  const handleHealthConditionRemove = (conditionToRemove: string) => {
    setFormData(prev => ({ ...prev, healthConditions: (prev.healthConditions || []).filter(c => c !== conditionToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    onUpdateUser({ name: formData.name, email: email });
    setIsEditing(false);
    setSuccessMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePasswordUpdateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setPasswordError("Erro de autenticação. Saia e entre novamente.");
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(currentUser, newPassword);
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Erro ao trocar senha:", err);
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError("Por segurança, saia do aplicativo e entre novamente com sua senha antiga antes de realizar a troca.");
      } else {
        setPasswordError("Falha ao atualizar a senha. Tente novamente mais tarde.");
      }
    } finally {
      setPasswordLoading(false);
    }
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
        <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-md animate-fadeIn" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="bg-slate-800 p-8 rounded-xl shadow-lg ring-1 ring-slate-700">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center space-y-4 border-b border-slate-700 pb-6">
                <div className="relative group">
                    {formData.photo ? (
                    <img src={formData.photo} alt="Foto de Perfil" className="h-32 w-32 rounded-full object-cover ring-4 ring-sky-500/50 shadow-lg" />
                    ) : (
                    <div className="h-32 w-32 rounded-full bg-slate-700 flex items-center justify-center border-2 border-dashed border-slate-600">
                        <UserIcon className="h-16 w-16 text-slate-500" />
                    </div>
                    )}
                    {isEditing && (
                    <>
                        <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full cursor-pointer hover:bg-sky-600 shadow-md transition-transform hover:scale-110 ring-4 ring-slate-800">
                            <EditIcon className="w-5 h-5" />
                            <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                        </label>
                        {formData.photo && (
                            <button type="button" onClick={() => setFormData(prev => ({...prev, photo: ''}))} className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full cursor-pointer hover:bg-red-600 shadow-md transition-transform hover:scale-110 ring-4 ring-slate-800">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </>
                    )}
                </div>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-slate-200 mb-3 border-l-4 border-sky-500 pl-2">Informações Pessoais</h3>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300">Nome Completo</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 disabled:opacity-50"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 disabled:opacity-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Sexo</label>
              <select name="gender" value={formData.gender || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 disabled:opacity-50">
                <option value="">Selecione...</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Data de Nascimento</label>
              <input type="date" name="birthDate" value={formData.birthDate || ''} onChange={handleInputChange} disabled={!isEditing} className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 disabled:opacity-50"/>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4 pt-6">
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ ...profile }); }} className="bg-slate-600 text-slate-100 font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
              <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light shadow-sm">Salvar Alterações</button>
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-slate-800 p-8 rounded-xl shadow-lg ring-1 ring-slate-700 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                  <LockIcon className="h-6 w-6 text-sky-400" />
                  <h2 className="text-xl font-semibold text-slate-200">Segurança</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6 flex-grow">
                Mantenha sua conta protegida. Recomendamos trocar sua senha regularmente por motivos de segurança.
              </p>
              <button 
                onClick={() => {
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                  setPasswordSuccess(false);
                  setIsPasswordModalOpen(true);
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-sky-400 font-bold py-2.5 px-4 rounded-md border border-slate-600 transition-all flex items-center justify-center gap-2"
              >
                <LockIcon className="w-4 h-4" />
                Alterar minha senha
              </button>
           </div>

           <div className="bg-slate-800 p-8 rounded-xl shadow-lg ring-1 ring-red-900/50 border-l-4 border-red-600 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                  <TrashIcon className="h-6 w-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-red-400">Excluir Conta</h2>
              </div>
              <p className="text-slate-400 mb-6 flex-grow">
                Esta ação excluirá permanentemente seu perfil e registros do servidor e deste dispositivo. 
                <strong className="text-red-400 block mt-1">Atenção: Seus dados não poderão ser recuperados.</strong>
              </p>
              
              <button 
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 font-bold py-2 px-4 rounded-md transition-all shadow-sm w-full"
              >
                  Excluir minha conta permanentemente
              </button>
           </div>
       </div>

       {/* MODAL DE ALTERAÇÃO DE SENHA */}
       {isPasswordModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => !passwordLoading && setIsPasswordModalOpen(false)}>
            <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md overflow-hidden animate-slideUp" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <LockIcon className="w-5 h-5 text-sky-400" /> Alterar Senha
                    </h3>
                    <button onClick={() => setIsPasswordModalOpen(false)} disabled={passwordLoading} className="text-slate-400 hover:text-white transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6">
                    {passwordSuccess ? (
                      <div className="text-center py-6 animate-fadeIn">
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckIcon className="w-8 h-8 text-green-500" />
                          </div>
                          <h4 className="text-green-400 font-bold text-lg">Senha Alterada!</h4>
                          <p className="text-slate-400 text-sm mt-1">Sua nova senha já está ativa.</p>
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordUpdateClick} className="space-y-4">
                        <p className="text-slate-400 text-sm mb-4">Escolha uma senha forte com no mínimo 6 caracteres.</p>
                        
                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Nova Senha</label>
                          <input 
                            type="password"
                            required
                            disabled={passwordLoading}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Confirmar Nova Senha</label>
                          <input 
                            type="password"
                            required
                            disabled={passwordLoading}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                          />
                        </div>

                        {passwordError && (
                          <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-xs flex gap-2 items-start animate-shake">
                            <AlertIcon className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{passwordError}</span>
                          </div>
                        )}

                        <div className="flex gap-3 pt-2">
                           <button 
                            type="button"
                            disabled={passwordLoading}
                            onClick={() => setIsPasswordModalOpen(false)}
                            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-bold transition-all"
                           >
                            Cancelar
                           </button>
                           <button 
                            type="submit"
                            disabled={passwordLoading}
                            className="flex-1 px-4 py-3 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                           >
                            {passwordLoading ? <Spinner size="sm" /> : 'Confirmar'}
                           </button>
                        </div>
                      </form>
                    )}
                </div>
            </div>
         </div>
       )}

       {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
       <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
              setIsDeleteModalOpen(false);
              onDeleteAccount();
          }}
          title="Excluir Conta Permanentemente"
          message="Você está prestes a apagar todos os seus registros de saúde, glicemia, medicamentos e exames salvos na nuvem e neste dispositivo. Esta ação não tem volta. Tem certeza absoluta?"
          confirmText="Sim, Apagar Tudo"
          cancelText="Não, Cancelar"
          isDangerous={true}
       />
    </div>
  );
};
