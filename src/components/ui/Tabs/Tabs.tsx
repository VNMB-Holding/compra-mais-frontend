import React from 'react';
import styles from './Tabs.module.css';

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className={styles.tabsWrapper}>
      {tabs.map((tab) => (
        <span
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={activeTab === tab.id ? styles.badgeActive : styles.badgeInactive}>
              {tab.count}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}