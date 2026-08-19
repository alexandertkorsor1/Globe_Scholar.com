import React, { useState } from 'react';
import {
  Menu,
  ChevronDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export interface DashboardNavigationItem {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  children?: DashboardNavigationItem[];
}

interface DashboardSidebarProps {
  department: string;
  items: DashboardNavigationItem[];
}

export const DashboardSidebar: React.FC<
  DashboardSidebarProps
> = ({ department, items }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(
    () => items.find((item) => item.active)?.label || items[0]?.label || ''
  );
  const [expandedMenus, setExpandedMenus] = useState<
    Record<string, boolean>
  >({});

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      className="dashboard-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      style={{
        width: collapsed ? '72px' : '240px',
        minWidth: collapsed ? '72px' : '240px',
        background: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        minHeight: '100vh',
        padding: collapsed
          ? '18px 8px'
          : '18px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease, padding 0.25s ease',
        overflowX: 'hidden',
      }}
    >
      {/* Header: Menu toggle + Logo */}
      <div
        className="dashboard-sidebar-header"
        style={{
          padding: collapsed ? '0 4px 20px' : '0 12px 20px',
          borderBottom: '1px solid #f3f4f6',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
          }}
          aria-label="Toggle sidebar"
        >
          <Menu
            style={{ width: '20px', height: '20px' }}
          />
        </button>

        {!collapsed && (
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#111827',
                whiteSpace: 'nowrap',
              }}
            >
              Report.com
            </div>

            <div
              style={{
                marginTop: '2px',
                fontSize: '11px',
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              {department}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="dashboard-sidebar-nav" style={{ flex: 1 }}>
        {items.map((item) => {
          const hasChildren =
            item.children && item.children.length > 0;
          const isExpanded =
            expandedMenus[item.label] ?? false;
          const isActive = selectedLabel === item.label;

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(item.label);
                  } else {
                    setSelectedLabel(item.label);
                    item.onClick?.();
                  }
                }}
                className="dashboard-sidebar-item"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? '0' : '12px',
                  justifyContent: collapsed
                    ? 'center'
                    : 'flex-start',
                  padding: collapsed
                    ? '11px 0'
                    : '11px 12px',
                  marginBottom: '4px',
                  border: 'none',
                  borderRadius: '10px',
                  background: isActive
                    ? '#3366FF'
                    : 'transparent',
                  color: isActive
                    ? '#ffffff'
                    : '#4b5563',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-body)',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >
                {item.icon && (
                  <span
                    style={{
                      width: '20px',
                      display: 'flex',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </span>
                )}

                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>
                      {item.label}
                    </span>

                    {hasChildren && (
                      <span
                        style={{
                          width: '16px',
                          display: 'flex',
                          justifyContent: 'center',
                          transition: 'transform 0.2s',
                          transform: isExpanded
                            ? 'rotate(0)'
                            : 'rotate(-90deg)',
                        }}
                      >
                        <ChevronDown
                          style={{
                            width: '14px',
                            height: '14px',
                          }}
                        />
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Sub-menu */}
              {hasChildren &&
                isExpanded &&
                !collapsed && (
                  <div
                    style={{
                      paddingLeft: '44px',
                      marginBottom: '4px',
                    }}
                  >
                    {item.children!.map((child) => (
                      <button
                        key={child.label}
                        type="button"
                        onClick={() => {
                          setSelectedLabel(child.label);
                          child.onClick?.();
                        }}
                        style={{
                          width: '100%',
                          display: 'block',
                          padding: '8px 12px',
                          border: 'none',
                          background: selectedLabel === child.label
                            ? '#eff6ff'
                            : 'transparent',
                          color: selectedLabel === child.label
                            ? '#3366FF'
                            : '#6b7280',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: selectedLabel === child.label
                            ? 600
                            : 400,
                          borderRadius: '8px',
                          fontFamily:
                            'var(--font-body)',
                          marginBottom: '2px',
                        }}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </nav>

      {/* Help Center (pinned bottom) */}
      <div
        className="dashboard-sidebar-help"
        style={{
          borderTop: '1px solid #f3f4f6',
          paddingTop: '14px',
          marginTop: '8px',
        }}
      >
        <button
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '10px',
            justifyContent: collapsed
              ? 'center'
              : 'flex-start',
            padding: collapsed
              ? '11px 0'
              : '11px 12px',
            border: 'none',
            borderRadius: '10px',
            background: 'transparent',
            color: '#6b7280',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
          }}
        >
          <HelpCircle
            style={{
              width: '18px',
              height: '18px',
              flexShrink: 0,
            }}
          />
          {!collapsed && <span>Help center</span>}
        </button>
      </div>
    </aside>
  );
};
