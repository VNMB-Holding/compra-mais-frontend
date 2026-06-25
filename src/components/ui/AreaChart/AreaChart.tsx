"use client";

import React from 'react';
import { ResponsiveContainer, AreaChart as RechartsArea, Area, XAxis, YAxis, Tooltip } from 'recharts';
import styles from './AreaChart.module.css';

interface DataItem {
  name: string;
  value: number;
  value2?: number;
}

interface AreaChartProps {
  data: DataItem[];
  color?: string;
  color2?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  label1?: string;
  label2?: string;
}

export default function AreaChart({
  data,
  color = "#007d79",
  color2 = "#7c3aed",
  valueFormatter = (value: number) => `${value}`,
  height = 240,
  label1 = "Valor 1",
  label2 = "Valor 2"
}: AreaChartProps) {
  const hasMultipleLines = data.some(d => d.value2 !== undefined);

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
            {hasMultipleLines && (
              <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color2} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={color2} stopOpacity={0}/>
              </linearGradient>
            )}
          </defs>
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
                return (
                  <div className={styles.tooltip}>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b', marginBottom: '4px' }}>
                      {payload[0].payload.name}
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, color: color, fontSize: 13 }}>
                      {label1}: {valueFormatter(payload[0].value as number)}
                    </p>
                    {hasMultipleLines && payload[1] && (
                      <p style={{ margin: '4px 0 0 0', fontWeight: 600, color: color2, fontSize: 13 }}>
                        {label2}: {valueFormatter(payload[1].value as number)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            dot={{ r: 4, fill: color, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
          {hasMultipleLines && (
            <Area 
              type="monotone" 
              dataKey="value2" 
              stroke={color2} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorValue2)" 
              dot={{ r: 4, fill: color2, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          )}
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  );
}
