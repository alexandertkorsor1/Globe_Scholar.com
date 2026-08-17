import React from 'react';

interface Tab {
  label: string;
  value: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          className={`tab-item${activeTab === tab.value ? ' active' : ''}`}
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
