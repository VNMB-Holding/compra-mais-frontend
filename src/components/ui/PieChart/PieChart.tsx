"use client";

import React from 'react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';
import styles from './PieChart.module.css';

interface PieItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieItem[];
}

export default function PieChart({ data }: PieChartProps) {
  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={55}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={styles.tooltip}>
                    <span style={{ color: payload[0].payload.color, fontWeight: 600 }}>
                      {payload[0].name}: {payload[0].value}%
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}