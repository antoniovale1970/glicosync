import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { generateContent } from '../services/geminiService';
import { Spinner } from './Spinner';
import { UserIcon } from './icons/UserIcon';

interface ProfileSummaryProps {
  profile: UserProfile;
}

export const ProfileSummary: React.FC<ProfileSummaryProps> = ({ profile }) => {
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateSummary = async () => {
      setIsLoading(true);
      const prompt = `
        Crie um resumo conciso e amigável para o perfil de um usuário de um aplicativo de controle de diabetes.
        O resumo deve ser motivacional e informativo, com no máximo 2 ou 3 frases curtas.
        Use os seguintes dados:
        - Nome: ${profile.name}
        - Idade: ${profile.age || 'Não informado'}
        - Tipo de Diabetes: ${profile.diabetesType}

        Exemplo de formato: "${profile.name} está no controle de sua jornada com diabetes ${profile.diabetesType}. Manter o foco nos seus objetivos de saúde é o caminho para uma vida plena e saudável!"

        Gere um resumo baseado nos dados fornecidos, mantendo um tom positivo e encorajador.
      `;
      
      const result = await generateContent(prompt);
      setSummary(result);
      setIsLoading(false);
    };

    if (profile.name && profile.name !== 'Usuário' && profile.diabetesType) {
        generateSummary();
    } else {
        setIsLoading(false);
        setSummary("Complete seu perfil para receber um resumo personalizado e dicas da nossa IA!");
    }

  }, [profile]);

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
      <div className="flex items-center mb-4">
        <UserIcon className="w-6 h-6 text-sky-400 mr-3" />
        <h2 className="text-xl font-semibold text-slate-100">Resumo do Perfil</h2>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-16">
          <Spinner size="md" color="sky" />
        </div>
      ) : (
        <p className="text-slate-300 italic">
          {summary}
        </p>
      )}
    </div>
  );
};