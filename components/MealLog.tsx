import React, { useState, useMemo } from 'react';
import type { Meal } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface MealLogProps {
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
}

export const MealLog: React.FC<MealLogProps> = ({ meals, setMeals }) => {
  const [type, setType] = useState<'Café da Manhã' | 'Almoço' | 'Jantar' | 'Lanche'>('Almoço');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [proteins, setProteins] = useState('');
  const [fats, setFats] = useState('');


  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');

  const filteredAndSortedMeals = useMemo(() => {
    const filtered = meals.filter(meal => {
        const typeMatch = typeFilter === 'Todos' || meal.type === typeFilter;
        // Compare only the date part (YYYY-MM-DD)
        const dateMatch = !dateFilter || new Date(meal.date).toISOString().split('T')[0] === dateFilter;
        return typeMatch && dateMatch;
    });

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meals, dateFilter, typeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !date || !type) return;
    const newMeal: Meal = {
      id: new Date().toISOString(),
      type,
      date,
      description,
      calories: calories ? parseInt(calories, 10) : undefined,
      carbs: carbs ? parseInt(carbs, 10) : undefined,
      proteins: proteins ? parseInt(proteins, 10) : undefined,
      fats: fats ? parseInt(fats, 10) : undefined,
    };
    setMeals([newMeal, ...meals]);
    setDescription('');
    setDate(new Date().toISOString().slice(0, 16));
    setCalories('');
    setCarbs('');
    setProteins('');
    setFats('');
  };

  const handleDelete = (id: string) => {
    setMeals(meals.filter(m => m.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(dateString));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-100">Registro de Refeições</h1>
      
      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Nova Refeição</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="mealType" className="block text-sm font-medium text-slate-400">Tipo</label>
                    <select
                    id="mealType"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    >
                    <option>Café da Manhã</option>
                    <option>Almoço</option>
                    <option>Jantar</option>
                    <option>Lanche</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="mealDate" className="block text-sm font-medium text-slate-400">Data e Hora</label>
                    <input
                    id="mealDate"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                    required
                    />
                </div>
            </div>
            <div>
                <label htmlFor="mealDescription" className="block text-sm font-medium text-slate-400">Descrição</label>
                <textarea
                id="mealDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ex: Salada, frango grelhado e arroz integral"
                rows={2}
                required
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Informações Nutricionais (Opcional)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="mealCalories" className="block text-xs font-medium text-slate-500">Calorias (kcal)</label>
                        <input id="mealCalories" type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Ex: 500" className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                    <div>
                        <label htmlFor="mealCarbs" className="block text-xs font-medium text-slate-500">Carboidratos (g)</label>
                        <input id="mealCarbs" type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="Ex: 50" className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                    <div>
                        <label htmlFor="mealProteins" className="block text-xs font-medium text-slate-500">Proteínas (g)</label>
                        <input id="mealProteins" type="number" value={proteins} onChange={e => setProteins(e.target.value)} placeholder="Ex: 30" className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                    <div>
                        <label htmlFor="mealFats" className="block text-xs font-medium text-slate-500">Gorduras (g)</label>
                        <input id="mealFats" type="number" value={fats} onChange={e => setFats(e.target.value)} placeholder="Ex: 20" className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"/>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button type="submit" className="flex items-center justify-center w-full sm:w-auto bg-brand-blue text-white font-bold py-2 px-4 rounded-md hover:bg-brand-blue-light transition-colors shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Adicionar Refeição
                </button>
            </div>
        </form>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl shadow-lg ring-1 ring-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-slate-200">Histórico de Refeições</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-slate-700">
            <div>
                <label htmlFor="dateFilter" className="block text-sm font-medium text-slate-400">Filtrar por data</label>
                <input
                    id="dateFilter"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                />
            </div>
            <div>
                <label htmlFor="typeFilter" className="block text-sm font-medium text-slate-400">Filtrar por tipo</label>
                <select
                    id="typeFilter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-slate-100 focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                    <option>Todos</option>
                    <option>Café da Manhã</option>
                    <option>Almoço</option>
                    <option>Jantar</option>
                    <option>Lanche</option>
                </select>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-200">
            <thead className="border-b-2 border-slate-700">
              <tr>
                <th className="py-2 px-4">Data e Hora</th>
                <th className="py-2 px-4">Tipo</th>
                <th className="py-2 px-4">Descrição</th>
                <th className="py-2 px-4">Nutrientes</th>
                <th className="py-2 px-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedMeals.map(meal => (
                <tr key={meal.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                  <td className="py-3 px-4">{formatDate(meal.date)}</td>
                  <td className="py-3 px-4 font-semibold">{meal.type}</td>
                  <td className="py-3 px-4 text-slate-300 whitespace-pre-wrap">{meal.description}</td>
                  <td className="py-3 px-4 text-sm text-slate-300">
                    {meal.calories || meal.carbs || meal.proteins || meal.fats ? (
                        <ul className="list-none p-0 m-0">
                            {meal.carbs !== undefined && <li>Carbs: {meal.carbs}g</li>}
                            {meal.proteins !== undefined && <li>Prot: {meal.proteins}g</li>}
                            {meal.fats !== undefined && <li>Gord: {meal.fats}g</li>}
                            {meal.calories !== undefined && <li className="font-semibold text-slate-100">Kcal: {meal.calories}</li>}
                        </ul>
                    ) : (
                        <span className="text-slate-500 italic">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(meal.id)} className="text-red-500 hover:text-red-400 p-1">
                      <TrashIcon className="w-5 h-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meals.length === 0 && <p className="text-center text-slate-400 py-6">Nenhuma refeição registrada.</p>}
          {meals.length > 0 && filteredAndSortedMeals.length === 0 && <p className="text-center text-slate-400 py-6">Nenhum resultado encontrado para os filtros aplicados.</p>}
        </div>
      </div>
    </div>
  );
};