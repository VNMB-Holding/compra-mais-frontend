"use client";

import React from 'react';
import { ResponsiveContainer, BarChart as RechartsBar, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import styles from './BarChart.module.css';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataItem[];
  defaultColor?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}

export default function BarChart({ 
  data, 
  defaultColor = "#007d79",
  valueFormatter = (value: number) => `${value}`,
  height = 220
}: BarChartProps) {
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
            tickFormatter={valueFormatter}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className={styles.tooltip}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{item.name}</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: item.color || defaultColor }}>
                      {valueFormatter(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultColor} />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
