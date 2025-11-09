import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Exam } from '../types';

interface ExamChartProps {
  data: Exam[];
}

export const ExamChart: React.FC<ExamChartProps> = ({ data }) => {
  const chartData = data
    .map(exam => {
        const date = new Date(exam.date);
        // Ajusta a data para o fuso horário local para evitar problemas de data "um dia antes"
        const timeZoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + timeZoneOffset);

        return {
          name: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(adjustedDate),
          resultado: parseFloat(exam.result),
        };
    });

  const axisAndTextColor = '#cbd5e1'; // slate-300

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="name" stroke={axisAndTextColor} tick={{ fill: axisAndTextColor }} />
        <YAxis stroke={axisAndTextColor} tick={{ fill: axisAndTextColor }} label={{ value: '%', position: 'insideLeft', offset: 0, fill: axisAndTextColor }} />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Resultado']}
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            color: '#e2e8f0',
          }}
          labelStyle={{ fontWeight: 'bold', color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ color: axisAndTextColor }} verticalAlign="top" height={36}/>
        <Line type="monotone" dataKey="resultado" name="HbA1c" stroke="#38bdf8" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};