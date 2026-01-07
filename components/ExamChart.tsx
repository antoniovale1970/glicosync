
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot } from 'recharts';
import type { Exam } from '../types';

interface ExamChartProps {
  data: Exam[];
  title?: string;
  unit?: string;
}

// Componente personalizado para o ponto do gráfico
const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    let fill = '#3b82f6'; // Azul padrão (sem status)
    let stroke = '#1e3a8a'; // Borda azul escura

    if (payload.status === 'normal') {
        fill = '#22c55e'; // Verde
        stroke = '#14532d';
    } else if (payload.status === 'borderline') {
        fill = '#eab308'; // Amarelo
        stroke = '#713f12';
    } else if (payload.status === 'abnormal') {
        fill = '#ef4444'; // Vermelho
        stroke = '#7f1d1d';
    }

    return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} fill="none" viewBox="0 0 12 12">
            <circle cx="6" cy="6" r="5" fill={fill} stroke={stroke} strokeWidth="1" />
        </svg>
    );
};

export const ExamChart: React.FC<ExamChartProps> = ({ data, title = "Evolução do Resultado", unit = "" }) => {
  // Filtra e formata os dados, convertendo resultados numéricos
  const chartData = data
    .map(exam => {
        // Tenta extrair apenas números e pontos/vírgulas do resultado
        const numericString = exam.result.replace(/[^0-9.,]/g, '').replace(',', '.');
        const value = parseFloat(numericString);

        if (isNaN(value)) return null;

        const date = new Date(exam.date);
        const timeZoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + timeZoneOffset);

        return {
          name: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(adjustedDate),
          resultado: value,
          status: exam.resultStatus,
          fullDate: new Intl.DateTimeFormat('pt-BR').format(adjustedDate),
          originalExam: exam
        };
    })
    .filter(item => item !== null)
    // Garante ordem cronológica
    .sort((a, b) => {
        const [dayA, monthA, yearA] = a!.name.split('/').map(Number);
        const [dayB, monthB, yearB] = b!.name.split('/').map(Number);
        return new Date(2000 + yearA, monthA - 1, dayA).getTime() - new Date(2000 + yearB, monthB - 1, dayB).getTime();
    });

  const axisAndTextColor = '#cbd5e1'; // slate-300

  if (chartData.length === 0) {
      return (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Não há dados numéricos suficientes para gerar o gráfico deste exame.
          </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col">
        <ResponsiveContainer width="100%" height="90%" minWidth={0}>
        <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
        >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="name" stroke={axisAndTextColor} tick={{ fill: axisAndTextColor, fontSize: 12 }} />
            <YAxis 
                stroke={axisAndTextColor} 
                tick={{ fill: axisAndTextColor, fontSize: 12 }} 
                label={{ value: unit, position: 'insideLeft', offset: 10, fill: axisAndTextColor, angle: -90, fontSize: 12 }}
                domain={['auto', 'auto']} 
            />
            <Tooltip
            formatter={(value: number) => [`${value} ${unit}`, title]}
            labelFormatter={(label) => `Data: ${label}`}
            contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#e2e8f0',
                fontSize: '0.875rem'
            }}
            labelStyle={{ fontWeight: 'bold', color: '#f1f5f9', marginBottom: '0.25rem' }}
            />
            
            <Line 
                type="monotone" 
                dataKey="resultado" 
                name={title} 
                stroke="#94a3b8" 
                strokeWidth={2} 
                dot={<CustomizedDot />}
                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
            />
        </LineChart>
        </ResponsiveContainer>
        
        {/* Legenda Explicativa Prática */}
        <div className="flex justify-center gap-4 mt-2 text-xs text-slate-400 pb-2">
            <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500 border border-green-800"></span> Normal
            </div>
            <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-800"></span> Atenção
            </div>
            <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-red-800"></span> Alterado
            </div>
        </div>
    </div>
  );
};
