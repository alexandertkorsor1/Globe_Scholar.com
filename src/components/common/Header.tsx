import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApplication } from '../../context/ApplicationContext';
import {
  Globe,
  ShieldCheck,
  Bell,
  Lock,
  LogOut,
  GraduationCap,
  ChevronDown,
  Building2
} from 'lucide-react';
import { DepartmentType } from '../../types/database';

interface HeaderProps {
  onOpenComms: () => void;
  onOpenRLSAudit: () => void;
  onOpenAuditLogs: () => void;
}

const DEPT_LABELS: Record<
  DepartmentType,
  { name: string; badgeClass: string }
> = {
  admin: {
    name: 'Admin Oversight',
    badgeClass: 'dept-badge-admin'
  },
  marketing: {
    name: 'Marketing & Leads',
    badgeClass: 'dept-badge-marketing'
  },
  admissions: {
    name: 'Admissions & Decisions',
    badgeClass: 'dept-badge-admissions'
  },
  counseling: {
    name: 'Counseling & Advising',
    badgeClass: 'dept-badge-counseling'
  },
  data_applications: {
    name: 'Data & Applications',
    badgeClass: 'dept-badge-data_applications'
  },
  operations: {
    name: 'Operations & Processing',
    badgeClass: 'dept-badge-operations'
  },
  country_directors: {
    name: 'Country Directors',
    badgeClass: 'dept-badge-country_directors'
  },
  finance: {
    name: 'Finance & Disbursements',
    badgeClass: 'dept-badge-finance'
  },
  it_support: {
    name: 'IT Support',
    badgeClass: 'dept-badge-admin'
  },
  legal_compliance: {
    name: 'Legal & Compliance',
    badgeClass: 'dept-badge-admin'
  },
  alumni_success: {
    name: 'Alumni & Success',
    badgeClass: 'dept-badge-admin'
  }
};

export const Header: React.FC<HeaderProps> = ({
  onOpenComms,
  onOpenRLSAudit,
  onOpenAuditLogs
}) => {
  const {
    currentProfile,
    switchProfile,
    availableProfiles,
    isStudentMode,
    setStudentMode,
    logout
  } = useAuth();

  const { communications } = useApplication();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const unreadCount = communications.filter(
    c => !c.is_read
  ).length;

  const currentDeptInfo =
    DEPT_LABELS[currentProfile.department];

  return (
    <header
      className="glass-panel"
      style={{
        position: 'relative',
        zIndex: 10000,
        overflow: 'visible',
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        padding: '14px 28px',
        marginBottom: '24px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Logo & Tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow:
                '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Globe
              style={{
                color: '#ffffff',
                width: '24px',
                height: '24px'
              }}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <h1
                style={{
                  fontSize: '1.25rem',
                  color: '#ffffff',
                  fontWeight: 800
                }}
              >
                Globe Scholar Pathways
              </h1>

              <span
                style={{
                  fontSize: '0.65rem',
                  background:
                    'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  border:
                    '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                SUPABASE RLS ACTIVE
              </span>
            </div>

            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}
            >
              Enterprise Multi-Department Scholarship Operations
            </p>
          </div>
        </div>

        {/* Workspace Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          {/* Student Mode */}
          <button
            onClick={() =>
              setStudentMode(!isStudentMode)
            }
            className={`btn ${
              isStudentMode
                ? 'btn-primary'
                : 'btn-secondary'
            }`}
            style={{
              fontSize: '0.8rem',
              padding: '8px 14px'
            }}
          >
            <GraduationCap
              style={{
                width: '16px',
                height: '16px'
              }}
            />

            {isStudentMode
              ? 'Switch to Internal Staff Platform'
              : 'View Student Portal'}
          </button>

          {!isStudentMode && (
            <>
              {/* RLS Audit */}
              <button
                onClick={onOpenRLSAudit}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 14px',
                  borderColor:
                    'rgba(16, 185, 129, 0.4)',
                  color: '#34d399'
                }}
                title="Run Database RLS Denial Tests"
              >
                <ShieldCheck
                  style={{
                    width: '16px',
                    height: '16px'
                  }}
                />
                RLS Audit Suite
              </button>

              {/* Audit Trail */}
              <button
                onClick={onOpenAuditLogs}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 14px'
                }}
                title="System Audit Log Trail"
              >
                <Building2
                  style={{
                    width: '16px',
                    height: '16px'
                  }}
                />
                Audit Trail
              </button>

              {/* Notifications */}
              <button
                onClick={onOpenComms}
                className="btn btn-secondary"
                style={{
                  position: 'relative',
                  padding: '8px 12px'
                }}
                title="Notifications, Tasks & Escalations"
              >
                <Bell
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#f43f5e',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        '0 0 10px rgba(244, 63, 94, 0.8)'
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Staff Account */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 10001
                }}
              >
                <button
                  onClick={() =>
                    setShowRoleDropdown(
                      !showRoleDropdown
                    )
                  }
                  className="btn btn-secondary"
                  style={{
                    gap: '10px',
                    padding: '6px 14px',
                    background:
                      'rgba(18, 26, 43, 0.9)',
                    position: 'relative',
                    zIndex: 10002
                  }}
                >
                  <div
                    style={{
                      textAlign: 'left'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#f8fafc'
                        }}
                      >
                        {currentProfile.full_name}
                      </span>

                      <span
                        className={`badge ${currentDeptInfo.badgeClass}`}
                        style={{
                          fontSize: '0.65rem'
                        }}
                      >
                        {currentDeptInfo.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#64748b',
                        display: 'block'
                      }}
                    >
                      {currentProfile.email}
                    </span>
                  </div>

                  <ChevronDown
                    style={{
                      width: '14px',
                      height: '14px',
                      color: '#94a3b8'
                    }}
                  />
                </button>

                {/* Dropdown */}
                {showRoleDropdown && (
                  <div
                    className="glass-panel"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '320px',
                      maxHeight: '520px',
                      padding: '12px',
                      zIndex: 100000,
                      background: '#0f172a',
                      border:
                        '1px solid rgba(99, 102, 241, 0.5)',
                      boxShadow:
                        '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 30px rgba(99, 102, 241, 0.15)',
                      overflowY: 'auto',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Dropdown Header */}
                    <div
                      style={{
                        padding: '6px 10px',
                        marginBottom: '8px',
                        borderBottom:
                          '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Lock
                          style={{
                            width: '12px',
                            height: '12px',
                            color: '#f59e0b'
                          }}
                        />

                        Simulate Department Login Session
                      </p>

                      <p
                        style={{
                          fontSize: '0.68rem',
                          color: '#94a3b8',
                          marginTop: '2px'
                        }}
                      >
                        Per GSP Architecture, users switch
                        accounts to access distinct department
                        workspaces.
                      </p>
                    </div>

                    {/* Department Accounts */}
                    <div>
                      {availableProfiles
                        .filter(
                          p =>
                            p.id !==
                            'usr-student-01'
                        )
                        .map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              switchProfile(p.id);
                              setShowRoleDropdown(
                                false
                              );
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background:
                                p.id ===
                                currentProfile.id
                                  ? 'rgba(99, 102, 241, 0.2)'
                                  : 'transparent',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent:
                                'space-between',
                              transition:
                                'background 0.15s'
                            }}
                            className="glass-panel-interactive"
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: '#f8fafc'
                                }}
                              >
                                {p.full_name}
                              </p>

                              <p
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#94a3b8'
                                }}
                              >
                                {p.email}
                              </p>
                            </div>

                            <span
                              className={`badge ${
                                DEPT_LABELS[
                                  p.department
                                ]?.badgeClass ||
                                'badge-draft'
                              }`}
                              style={{
                                fontSize: '0.6rem'
                              }}
                            >
                              {p.department}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* Logout */}
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop:
                          '1px solid rgba(255,255,255,0.12)',
                        textAlign: 'center',
                        position: 'sticky',
                        bottom: 0,
                        background: '#0f172a',
                        zIndex: 10
                      }}
                    >
                      <button
                        onClick={() => {
                          setShowRoleDropdown(false);
                          logout();
                        }}
                        style={{
                          width: '100%',
                          background:
                            'rgba(244, 63, 94, 0.12)',
                          border:
                            '1px solid rgba(244, 63, 94, 0.35)',
                          color: '#fb7185',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          transition:
                            'all 0.2s ease'
                        }}
                      >
                        <LogOut
                          style={{
                            width: '15px',
                            height: '15px'
                          }}
                        />

                        Log out of staff session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

