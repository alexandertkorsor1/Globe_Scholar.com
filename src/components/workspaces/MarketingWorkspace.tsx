import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import {
  Megaphone, UserPlus, Send, Lock, Users, ClipboardList,
  ExternalLink, Edit2, Check, X, Share2, GraduationCap, Radio
} from 'lucide-react';
import { Student } from '../../types/database';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { MarketingPostsFeed } from '../shared/MarketingPostsFeed';
import { InstitutionFeeDirectory } from '../shared/InstitutionFeeDirectory';
import { TrashBin } from '../shared/TrashBin';

/* ─── Social platform config ─────────────────────────────────────────────── */
const PLATFORMS = [
  {
    key: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    bg: 'linear-gradient(135deg, #1877F2 0%, #0c5ccc 100%)',
    textShadow: '#0c5ccc',
    baseUrl: 'https://www.facebook.com/',
    placeholder: 'e.g. GlobeScholarsPLC',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.884v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    bg: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
    textShadow: '#128C7E',
    baseUrl: 'https://wa.me/',
    placeholder: 'e.g. 2348012345678 (no +)',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    key: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    bg: 'linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
    textShadow: '#C13584',
    baseUrl: 'https://www.instagram.com/',
    placeholder: 'e.g. globescholars',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: '#010101',
    bg: 'linear-gradient(135deg, #010101 0%, #1a1a2e 50%, #16213e 100%)',
    textShadow: '#00f2ea',
    baseUrl: 'https://www.tiktok.com/@',
    placeholder: 'e.g. globescholars',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.76a4.85 4.85 0 01-1.02-.07z"/>
      </svg>
    ),
  },
] as const;

type PlatformKey = typeof PLATFORMS[number]['key'];

/* ─── Component ───────────────────────────────────────────────────────────── */
export const MarketingWorkspace: React.FC = () => {
  const {
    students,
    applications,
    addStudent,
    createApplication,
    handoffToAdmissions,
    getScopedApplications
  } = useApplication();
  const { currentProfile, logout } = useAuth();

  // Lead modal state
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [leadSource, setLeadSource] = useState('Global STEM Webinar');

  // Social media handles state (stored locally; can be persisted to DB later)
  const [handles, setHandles] = useState<Record<PlatformKey, string>>({
    facebook: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
  });
  const [editing, setEditing] = useState<PlatformKey | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const goTo = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    setFName(''); setLName(''); setEmail(''); setPhone(''); setCountry('');
  };

  // Build the full URL for a platform to open
  const buildUrl = (platform: typeof PLATFORMS[number], handle: string) => {
    if (!handle.trim()) return platform.baseUrl;
    if (platform.key === 'whatsapp') return `https://wa.me/${handle.trim().replace(/\D/g, '')}`;
    return `${platform.baseUrl}${handle.trim()}`;
  };

  const startEdit = (key: PlatformKey) => {
    setEditing(key);
    setEditDraft(handles[key]);
  };

  const saveEdit = (key: PlatformKey) => {
    setHandles(prev => ({ ...prev, [key]: editDraft.trim() }));
    setEditing(null);
  };

  const sidebarNav = [
    { label: 'Lead Pipeline', icon: <Megaphone style={{ width: 18, height: 18 }} />, active: true, onClick: () => goTo('marketing-pipeline') },
    { label: 'Campaign Posts & Broadcasts', icon: <Radio style={{ width: 18, height: 18 }} />, onClick: () => goTo('marketing-campaign-posts') },
    { label: 'Social Media Hub', icon: <Share2 style={{ width: 18, height: 18 }} />, onClick: () => goTo('marketing-social') },
    { label: 'Fee Structures & Courses', icon: <GraduationCap style={{ width: 18, height: 18 }} />, onClick: () => goTo('marketing-fee-directory') },
    { label: 'Students', icon: <Users style={{ width: 18, height: 18 }} />, onClick: () => goTo('marketing-students') },
    { label: 'Assigned Tasks', icon: <ClipboardList style={{ width: 18, height: 18 }} />, onClick: () => goTo('marketing-assigned-tasks') },
  ];

  return (
    <DashboardLayout
      department="Marketing"
      title="Marketing & Lead Generation"
      subtitle="Campaign tracking, lead capture, social media, and admissions handoff"
      userName={currentProfile.full_name}
      userRole="Marketing"
      navigation={sidebarNav}
      onLogout={logout}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Banner */}
        <div id="marketing-pipeline" className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone style={{ color: '#3366FF' }} />
                <h2 style={{ fontSize: '1.25rem', color: '#111827' }}>Marketing & Lead Generation Workspace</h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                Campaign tracking, prospective lead capture, social media command centre, and lead-to-admissions handoff.
              </p>
            </div>
            <button onClick={() => setShowAddLeadModal(true)} className="btn btn-primary btn-sm">
              <UserPlus style={{ width: '14px', height: '14px' }} />
              Capture New Prospective Lead
            </button>
          </div>
        </div>

        {/* ── SOCIAL MEDIA COMMAND CENTRE ─────────────────────────────────── */}
        <div id="marketing-social" className="glass-panel" style={{ padding: '24px', borderRadius: '14px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#3366FF,#6c3de3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Share2 size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#111827', fontWeight: 700 }}>Social Media Command Centre</h3>
              <p style={{ margin: 0, fontSize: '0.73rem', color: '#6b7280' }}>
                Set your account handle then click <strong>Open</strong> to go directly to the platform. All links open in a new tab.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginTop: '20px' }}>
            {PLATFORMS.map(platform => {
              const handle = handles[platform.key as PlatformKey];
              const isEditing = editing === platform.key;
              const url = buildUrl(platform, handle);

              return (
                <div
                  key={platform.key}
                  style={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: '#fff',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.14)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)';
                  }}
                >
                  {/* Gradient header */}
                  <div style={{ background: platform.bg, padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {platform.icon}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: '#fff', display: 'block', fontWeight: 700 }}>{platform.label}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)' }}>
                        {handle ? `@${handle}` : 'No handle set'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px' }}>
                    {/* Handle input */}
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                        <input
                          autoFocus
                          type="text"
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(platform.key as PlatformKey); if (e.key === 'Escape') setEditing(null); }}
                          placeholder={platform.placeholder}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: '7px', border: '1.5px solid #3366FF', fontSize: '0.8rem', outline: 'none' }}
                        />
                        <button
                          onClick={() => saveEdit(platform.key as PlatformKey)}
                          style={{ padding: '7px 10px', borderRadius: '7px', background: '#3366FF', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          style={{ padding: '7px 10px', borderRadius: '7px', background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.78rem', color: handle ? '#374151' : '#9ca3af', fontStyle: handle ? 'normal' : 'italic' }}>
                          {handle ? `@${handle}` : 'Tap edit to set handle'}
                        </span>
                        <button
                          onClick={() => startEdit(platform.key as PlatformKey)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      </div>
                    )}

                    {/* Open button */}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        padding: '10px 0',
                        borderRadius: '9px',
                        background: platform.bg,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.83rem',
                        textDecoration: 'none',
                        letterSpacing: '0.01em',
                        boxShadow: `0 3px 12px rgba(0,0,0,0.15)`,
                        transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88'}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = '1'}
                    >
                      <ExternalLink size={14} />
                      Open {platform.label}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MARKETING POSTS & CAMPAIGNS ──────────────────────────────────── */}
        <div id="marketing-campaign-posts">
          <MarketingPostsFeed allowCreate={true} departmentTitle="Marketing" />
        </div>

        {/* ── INSTITUTION FEE STRUCTURES & COURSES DIRECTORY ──────────────── */}
        <div id="marketing-fee-directory">
          <InstitutionFeeDirectory departmentTitle="Marketing" />
        </div>

        {/* Task Inbox */}
        <div id="marketing-assigned-tasks">
          <DepartmentTaskInbox />
        </div>

        {/* RLS Info */}
        <div className="glass-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #3366FF', background: '#eff6ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock style={{ color: '#3366FF', width: '18px', height: '18px' }} />
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#111827' }}>Post-Handoff RLS Data Isolation Enforced</h4>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Once Marketing hands off a student application to Admissions, Row-Level Security automatically revokes Marketing's read access to prevent unauthorised lead modification.
              </p>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div id="marketing-students" className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#111827', marginBottom: '14px' }}>Active Marketing Leads & Pre-Admissions Queue</h3>
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
                      <td style={{ fontWeight: 600, color: '#111827' }}>{std.first_name} {std.last_name}</td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#374151' }}>{std.email}</div>
                        <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{std.country_of_residence}</span>
                      </td>
                      <td><span className="badge badge-submitted">{std.lead_source || 'Webinar'}</span></td>
                      <td style={{ fontSize: '0.8rem', color: '#3366FF' }}>{std.assigned_counselor_name || '—'}</td>
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
                            Handed Off (RLS Hidden)
                          </span>
                        ) : (
                          <button
                            onClick={() => { if (stdApp) void handoffToAdmissions(stdApp.id); }}
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

        {/* Marketing Recycle Bin */}
        <div id="marketing-trash">
          <TrashBin departmentKey="marketing" />
        </div>

        {/* Modal: Add Lead */}
        {showAddLeadModal && (
          <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
              <h3 style={{ fontSize: '1rem', color: '#111827', marginBottom: '16px' }}>Capture New Prospective Student Lead</h3>
              <form onSubmit={handleAddLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
                  <input type="text" required value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Nigeria" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Lead Source Campaign</label>
                  <select value={leadSource} onChange={e => setLeadSource(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}>
                    <option value="Global STEM Webinar 2026">Global STEM Webinar 2026</option>
                    <option value="Facebook Campaign">Facebook Campaign</option>
                    <option value="Instagram / Social Campaign">Instagram / Social Campaign</option>
                    <option value="WhatsApp Outreach">WhatsApp Outreach</option>
                    <option value="TikTok Campaign">TikTok Campaign</option>
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
    </DashboardLayout>
  );
};
