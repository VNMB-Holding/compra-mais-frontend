"use client";

import React from 'react';
import { ResponsiveContainer, LineChart as RechartsLine, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { formatMonthLabel } from '@/lib/utils/format-display';
import styles from './LineChart.module.css';

interface DataItem {
  name: string;
  value: number;
}

interface LineChartProps {
  data: DataItem[];
  strokeColor?: string;
}

export default function LineChart({ data, strokeColor = "#0d9488" }: LineChartProps) {
  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
    }
    if (value >= 1_000) {
      return `R$ ${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
    }
    return `R$ ${value}`;
  };

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLine data={data} margin={{ top: 10, right: 16, left: 10, bottom: 5 }}>
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={formatMonthLabel}
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            width={65}
            tickFormatter={formatYAxis}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const currentValue = Number(payload[0].value || 0);
                const monthName = formatMonthLabel(payload[0].payload.name);
                return (
                  <div className={styles.tooltip}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{monthName}</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: strokeColor }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentValue)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor} 
            strokeWidth={3} 
            dot={{ r: 4, fill: strokeColor, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}