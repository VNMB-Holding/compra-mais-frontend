"use client";

import React from 'react';
import { ResponsiveContainer, LineChart as RechartsLine, Line, XAxis, YAxis, Tooltip } from 'recharts';
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
  const formatYAxis = (value: number) => `R$ ${value}k`;

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLine data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={formatYAxis}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                // Convertemos o valor com segurança para o que precisamos exibir
                const currentValue = payload[0].value;
                return (
                  <div className={styles.tooltip}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{payload[0].payload.name}</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: strokeColor }}>
                      R$ {currentValue}.000
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