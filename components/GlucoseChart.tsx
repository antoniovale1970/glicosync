
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { GlucoseReading } from '../types';

interface GlucoseChartProps {
  data: GlucoseReading[];
}

export const GlucoseChart: React.FC<GlucoseChartProps> = ({ data }) => {
  const chartData = data
    .map(reading => ({
      ...reading,
      dateObj: new Date(reading.date),
    }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(reading => ({
      name: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(reading.dateObj),
      glicemia: reading.value,
    }));

  const axisAndTextColor = '#cbd5e1'; // slate-300

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="name" stroke={axisAndTextColor} tick={{ fill: axisAndTextColor }} />
        <YAxis stroke={axisAndTextColor} tick={{ fill: axisAndTextColor }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid #475569',
            borderRadius: '0.5rem',
            color: '#e2e8f0',
          }}
          labelStyle={{ fontWeight: 'bold', color: '#f1f5f9' }}
        />
        <Legend wrapperStyle={{ color: axisAndTextColor }}/>
        <Line type="monotone" dataKey="glicemia" stroke="#38bdf8" strokeWidth={2} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
