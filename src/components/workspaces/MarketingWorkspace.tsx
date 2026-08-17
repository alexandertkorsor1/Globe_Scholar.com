import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { Megaphone, UserPlus, Send, Lock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Student } from '../../types/database';

export const MarketingWorkspace: React.FC = () => {
  const {
    students,
    applications,
    addStudent,
    createApplication,
    handoffToAdmissions,
    getScopedApplications
  } = useApplication();

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [leadSource, setLeadSource] = useState('Global STEM Webinar');

  const scopedAppsResult = getScopedApplications();
  const visibleApps = scopedAppsResult.data || [];

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !email) return;

    const newStd = addStudent({
      first_name: fName,
      last_name: lName,
      email,
      phone,
      country_of_residence: country,
      lead_source: leadSource
    });

    // Create draft application
    createApplication({
      student_id: newStd.id,
      student_name: `${fName} ${lName}`,
      student_email: email,
      target_country: 'United Kingdom',
      target_university: 'University of Oxford',
      degree_program: 'MSc Data Analytics',
      status: 'draft'
    });

    setShowAddLeadModal(false);
    setFName('');
    setLName('');
    setEmail('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Workspace Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(18, 26, 43, 0.9) 100%)', borderColor: 'rgba(236, 72, 153, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone style={{ color: '#ec4899' }} />
              <h2 style={{ fontSize: '1.25rem', color: '#fff' }}>Marketing & Lead Generation Workspace</h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
              Campaign tracking, prospective lead capture, counselor assignment, and lead-to-admissions handoff management.
            </p>
          </div>

          <button onClick={() => setShowAddLeadModal(true)} className="btn btn-primary btn-sm">
            <UserPlus style={{ width: '14px', height: '14px' }} />
            Capture New Prospective Lead
          </button>
        </div>
      </div>

      {/* Security RLS Enforcement Warning Box */}
      <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #ec4899', background: 'rgba(236, 72, 153, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock style={{ color: '#ec4899', width: '18px', height: '18px' }} />
          <div>
            <h4 style={{ fontSize: '0.85rem', color: '#fff' }}>Post-Handoff RLS Data Isolation Enforced</h4>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Per system security rules, once Marketing hands off a student application to Admissions, the database Row-Level Security (RLS) policy automatically revokes Marketing's read access to prevent unauthorized lead modification.
            </p>
          </div>
        </div>
      </div>

      {/* Prospective Leads & Draft Applications Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '14px' }}>Active Marketing Leads & Pre-Admissions Queue</h3>
        
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Lead / Student Name</th>
                <th>Email & Country</th>
                <th>Lead Source</th>
                <th>Assigned Counselor</th>
                <th>Draft App Status</th>
                <th>RLS Handoff Control</th>
              </tr>
            </thead>
            <tbody>
              {students.map(std => {
                const stdApp = applications.find(a => a.student_id === std.id);
                const isHandedOff = stdApp?.handed_off_to_admissions;

                return (
                  <tr key={std.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {std.first_name} {std.last_name}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{std.email}</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{std.country_of_residence}</span>
                    </td>
                    <td><span className="badge badge-submitted">{std.lead_source || 'Webinar'}</span></td>
                    <td style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{std.assigned_counselor_name || 'Elena Rostova'}</td>
                    <td>
                      {stdApp ? (
                        <span className={`badge badge-${stdApp.status}`}>{stdApp.status}</span>
                      ) : (
                        <span className="badge badge-draft">Drafting</span>
                      )}
                    </td>
                    <td>
                      {isHandedOff ? (
                        <span className="badge badge-admissions_review" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock style={{ width: '10px', height: '10px' }} />
                          Handed Off to Admissions (RLS Hidden)
                        </span>
                      ) : (
                        <button
                          onClick={() => stdApp && handoffToAdmissions(stdApp.id)}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                        >
                          <Send style={{ width: '12px', height: '12px' }} />
                          Hand Off to Admissions
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Lead */}
      {showAddLeadModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '440px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Capture New Prospective Student Lead</h3>
            <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>First Name</label>
                  <input type="text" required value={fName} onChange={e => setFName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Last Name</label>
                  <input type="text" required value={lName} onChange={e => setLName(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Country of Residence</label>
                <input type="text" required value={country} onChange={e => setCountry(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Lead Source Campaign</label>
                <select value={leadSource} onChange={e => setLeadSource(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
                  <option value="Global STEM Webinar 2026">Global STEM Webinar 2026</option>
                  <option value="Instagram / Social Campaign">Instagram / Social Campaign</option>
                  <option value="Lagos Education Fair">Lagos Education Fair</option>
                  <option value="Direct Portal Registration">Direct Portal Registration</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddLeadModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Capture Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
