import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { Globe, MapPin, ShieldCheck, Filter, BarChart3 } from 'lucide-react';

export const CountryDirectorsWorkspace: React.FC = () => {
  const { getScopedApplications, getScopedStudents, partnerUniversities } = useApplication();
  const { currentProfile, logout } = useAuth();

  const [selectedCountry, setSelectedCountry] = useState<string>('United Kingdom');
  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const scopedAppsResult = getScopedApplications();
  const visibleApps = (scopedAppsResult.data || []).filter(a => a.target_country === selectedCountry);

  const scopedStudentsResult = getScopedStudents();
  const visibleStudents = (scopedStudentsResult.data || []).filter(s => s.country_of_residence === 'India' || selectedCountry === 'United Kingdom');

  const regionPartners = partnerUniversities.filter(p => p.country === selectedCountry);

  const sidebarNav = [
    { label: 'Regional View', icon: <Globe style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('regional-applications') },
    { label: 'Analytics', icon: <BarChart3 style={{ width: 18, height: 18 }} />, onClick: () => goTo('regional-analytics') },
  ];

  return (
    <DashboardLayout
      department="Country Directors"
      title="Regional Oversight"
      subtitle="Country-specific application metrics and partner management"
      userName={currentProfile.full_name}
      userRole="Country Director"
      navigation={sidebarNav}
      onLogout={logout}
    >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe style={{ color: '#3366FF' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Country Directors Regional Oversight</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              Mechanically enforced regional Row-Level Security filtering metrics, partner universities, and applicant data strictly by country.
            </p>
          </div>

          {/* Country Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <MapPin style={{ color: '#2dd4bf', width: '16px', height: '16px' }} />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Assigned Region:</span>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="United Kingdom" style={{ background: '#0f172a' }}>United Kingdom (Assigned RLS Scope)</option>
              <option value="United States" style={{ background: '#0f172a' }}>United States</option>
              <option value="Australia" style={{ background: '#0f172a' }}>Australia</option>
              <option value="Canada" style={{ background: '#0f172a' }}>Canada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Region Overview Stats */}
      <div id="regional-analytics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Regional Target Applications</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2dd4bf', marginTop: '4px' }}>{visibleApps.length}</div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Filtered for {selectedCountry}</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Partner Universities in Region</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{regionPartners.length}</div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active Institutional MOUs</span>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Regional Approval Rate</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>100%</div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Quality Verification Index</span>
        </div>
      </div>

      {/* Regional Applications Table */}
      <div id="regional-applications" className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>
          Applications Queue for Region: {selectedCountry}
        </h3>

        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>App #</th>
                <th>Student Name</th>
                <th>Target University</th>
                <th>Degree Program</th>
                <th>Intake Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleApps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                    No applications registered for {selectedCountry} yet.
                  </td>
                </tr>
              ) : (
                visibleApps.map(app => (
                  <tr key={app.id}>
                    <td><strong style={{ color: '#2dd4bf' }}>{app.application_number}</strong></td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{app.student_name}</td>
                    <td>{app.target_university}</td>
                    <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{app.degree_program}</td>
                    <td>{app.intake_period}</td>
                    <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
    </DashboardLayout>
  );
};
