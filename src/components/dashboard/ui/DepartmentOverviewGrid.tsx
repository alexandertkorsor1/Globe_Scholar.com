import React from 'react';
import { ProgressBar } from './ProgressBar';

interface DepartmentData {
  name: string;
  value: string;
  kpiLabel: string;
  kpiStatus: 'Low' | 'Normal' | 'High' | 'Critical';
  valueProgress: number;
  kpiProgress: number;
  alertCount?: number;
  onClick?: () => void;
}

interface DepartmentOverviewGridProps {
  departments: DepartmentData[];
}

const kpiColorMap: Record<string, string> = {
  Low: '#f43f5e',
  Normal: '#22c55e',
  High: '#3366FF',
  Critical: '#ef4444',
};

export const DepartmentOverviewGrid: React.FC<
  DepartmentOverviewGridProps
> = ({ departments }) => {
  return (
    <div className="department-grid">
      {departments.map((dept) => (
        <div
          key={dept.name}
          className="dept-card"
          onClick={dept.onClick}
        >
          {/* Department Name + Alert */}
          <div className="dept-card-title">
            {dept.name}
          </div>

          {dept.alertCount && dept.alertCount > 0 && (
            <div className="dept-card-alert">
              {dept.alertCount}
            </div>
          )}

          {/* Metrics Row */}
          <div className="dept-card-metrics">
            <div>
              <div className="dept-metric-value">
                {dept.value}
              </div>
            </div>

            <div>
              <div
                className="dept-metric-value"
                style={{
                  color:
                    kpiColorMap[dept.kpiStatus] ||
                    '#374151',
                }}
              >
                {dept.kpiStatus}
              </div>
            </div>
          </div>

          {/* Progress Bars Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            <div>
              <ProgressBar
                value={dept.valueProgress}
                color="#3366FF"
                height={6}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '2px',
                      background: '#3366FF',
                      display: 'inline-block',
                    }}
                  />
                  Value
                </span>
              </div>
            </div>

            <div>
              <ProgressBar
                value={dept.kpiProgress}
                color={
                  kpiColorMap[dept.kpiStatus] ||
                  '#22c55e'
                }
                height={6}
              />
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#9ca3af',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '2px',
                      background:
                        kpiColorMap[
                          dept.kpiStatus
                        ] || '#22c55e',
                      display: 'inline-block',
                    }}
                  />
                  KPI performance
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export type { DepartmentData };
