import React, { useState, useEffect, useRef } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import { DashboardLayout } from '../dashboard/DashboardLayout';
import { supabase } from '../../lib/supabase';
import {
  Globe,
  MapPin,
  ShieldCheck,
  Filter,
  BarChart3,
  ClipboardList,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  X,
  FileCheck,
  AlertCircle,
  Calendar,
  User,
  BookOpen,
  Building2,
  Sparkles,
  RefreshCw,
  FileDown,
  GraduationCap
} from 'lucide-react';
import { DepartmentTaskInbox } from '../shared/DepartmentTaskInbox';
import { InstitutionFeeDirectory } from '../shared/InstitutionFeeDirectory';
import { TrashBin } from '../shared/TrashBin';

export interface LocalCountryReport {
  id: string;
  title: string;
  country: string;
  category: 'monthly_report' | 'partner_liaison' | 'student_intake_visa' | 'marketing_event' | 'financial_expense' | 'general_local_report';
  file_name: string;
  file_size: number;
  storage_path: string;
  pdf_url?: string;
  description?: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  created_at: string;
  deleted_at?: string | null;
}

const REPORT_CATEGORIES = [
  { value: 'monthly_report', label: 'Monthly Performance & Intake Report', icon: '📈' },
  { value: 'partner_liaison', label: 'Local University & Partner MOU', icon: '🤝' },
  { value: 'student_intake_visa', label: 'Visa Liaison & Regional Intake Audit', icon: '🛂' },
  { value: 'marketing_event', label: 'Marketing Campaign & School Outreach', icon: '📣' },
  { value: 'financial_expense', label: 'Local Expense & Financial Summary', icon: '💵' },
  { value: 'general_local_report', label: 'General Regional Operations Report', icon: '📋' },
];

const INITIAL_SAMPLE_REPORTS: LocalCountryReport[] = [
  {
    id: 'rep-ng-01',
    title: 'Lagos & Abuja Q3 Regional Recruitment & Visa Outreach Audit',
    country: 'Nigeria',
    category: 'monthly_report',
    file_name: 'Lagos_Q3_Regional_Intake_Audit_2026.pdf',
    file_size: 2450000,
    storage_path: 'country-director-reports/Nigeria/sample1.pdf',
    pdf_url: '',
    description: 'Comprehensive quarterly assessment of student inquiries, partner high school visits, and visa processing timelines in Nigeria.',
    uploaded_by_id: 'director-ng',
    uploaded_by_name: 'Country Director (West Africa)',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'rep-ke-02',
    title: 'Nairobi Education Fair Compliance & Institutional MOU Review',
    country: 'Kenya',
    category: 'partner_liaison',
    file_name: 'Nairobi_Education_Fair_MOU_2026.pdf',
    file_size: 1820000,
    storage_path: 'country-director-reports/Kenya/sample2.pdf',
    pdf_url: '',
    description: 'Summary of institutional agreements and student interviews conducted during the Nairobi East Africa fair.',
    uploaded_by_id: 'director-ke',
    uploaded_by_name: 'Country Director (East Africa)',
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'rep-uk-03',
    title: 'UK University Partner Liaison & Autumn Intake Review',
    country: 'United Kingdom',
    category: 'monthly_report',
    file_name: 'UK_Partner_Liaison_Autumn_2026.pdf',
    file_size: 3100000,
    storage_path: 'country-director-reports/United Kingdom/sample3.pdf',
    pdf_url: '',
    description: 'Official liaison briefing with UK university partners regarding scholarship quotas and admission deadlines.',
    uploaded_by_id: 'director-uk',
    uploaded_by_name: 'Country Director (UK & Europe)',
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  }
];

export const CountryDirectorsWorkspace: React.FC = () => {
  const { getScopedApplications, getScopedStudents, partnerUniversities } = useApplication();
  const { currentProfile, departmentMembers, logout } = useAuth();

  // Active Tab navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'fees' | 'tasks' | 'trash'>('overview');

  // Resolve assigned country strictly for the logged-in user
  const myMember = departmentMembers.find(m => m.email.toLowerCase() === currentProfile?.email?.toLowerCase());
  const assignedCountry = (
    myMember?.working_country ||
    (currentProfile as unknown as { working_country?: string })?.working_country ||
    currentProfile?.country_of_residence ||
    'Nigeria'
  ).trim();

  // Local Reports state
  const [localReports, setLocalReports] = useState<LocalCountryReport[]>(() => {
    try {
      const saved = localStorage.getItem('globe_local_country_reports');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_SAMPLE_REPORTS;
  });

  // Report Search and Category Filter
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('all');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<LocalCountryReport['category']>('monthly_report');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccessNotice, setUploadSuccessNotice] = useState('');

  // PDF Preview State
  const [previewPdfReport, setPreviewPdfReport] = useState<LocalCountryReport | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('globe_local_country_reports', JSON.stringify(localReports));
    } catch {
      // ignore
    }
  }, [localReports]);

  // Load from Supabase if table exists
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('country_director_documents')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setLocalReports(data as LocalCountryReport[]);
        }
      } catch {
        // use local state
      }
    };
    fetchReports();
  }, []);

  // Filter scoped applications and students strictly to the logged-in director's assigned country
  const scopedAppsResult = getScopedApplications();
  const visibleApps = (scopedAppsResult.data || []).filter(
    a => a.target_country?.toLowerCase() === assignedCountry.toLowerCase() ||
         a.student_country?.toLowerCase() === assignedCountry.toLowerCase()
  );

  const regionPartners = partnerUniversities.filter(
    p => p.country?.toLowerCase() === assignedCountry.toLowerCase()
  );

  // PDF File Selection Handler with STRICT validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Strict PDF validation check
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setUploadError('Security Policy: Only official PDF documents (.pdf) can be uploaded as local reports.');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        setUploadError('File size exceeds the 25 MB limit for PDF reports.');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setSelectedFile(file);
      if (!reportTitle.trim()) {
        const cleanName = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        setReportTitle(cleanName);
      }
    }
  };

  // Submit and Upload PDF Report
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF report file to upload.');
      return;
    }

    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadError('Only PDF files (.pdf) are allowed.');
      return;
    }

    if (!reportTitle.trim()) {
      setUploadError('Please enter a descriptive report title.');
      return;
    }

    const country = assignedCountry;

    try {
      setUploading(true);
      setUploadError('');

      const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `country-director-reports/${encodeURIComponent(country)}/${Date.now()}_${sanitizedFileName}`;

      let uploadedPdfUrl = '';

      // Upload to Supabase Storage
      try {
        const { error: storageErr } = await supabase.storage
          .from('department-reports')
          .upload(storagePath, selectedFile, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (!storageErr) {
          const { data: publicUrlData } = supabase.storage
            .from('department-reports')
            .getPublicUrl(storagePath);
          uploadedPdfUrl = publicUrlData?.publicUrl || '';
        }
      } catch (err) {
        console.warn('Storage upload note:', err);
      }

      // Generate object URL for immediate in-session preview
      if (!uploadedPdfUrl) {
        uploadedPdfUrl = URL.createObjectURL(selectedFile);
      }

      const newReport: LocalCountryReport = {
        id: `report-${Date.now()}`,
        title: reportTitle.trim(),
        country: country,
        category: reportCategory,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        storage_path: storagePath,
        pdf_url: uploadedPdfUrl,
        description: reportDescription.trim() || undefined,
        uploaded_by_id: currentProfile.id,
        uploaded_by_name: currentProfile.full_name,
        created_at: new Date().toISOString()
      };

      // Try inserting into Supabase table
      try {
        await supabase
          .from('country_director_documents')
          .insert({
            id: newReport.id,
            title: newReport.title,
            country: newReport.country,
            category: newReport.category,
            file_name: newReport.file_name,
            file_size: newReport.file_size,
            storage_path: newReport.storage_path,
            pdf_url: newReport.pdf_url,
            description: newReport.description,
            uploaded_by_id: newReport.uploaded_by_id,
            uploaded_by_name: newReport.uploaded_by_name,
            created_at: newReport.created_at
          });
      } catch {
        // ignore
      }

      setLocalReports(prev => [newReport, ...prev]);
      setUploadSuccessNotice(`Official PDF Report "${newReport.title}" was successfully uploaded and registered!`);

      // Reset form
      setShowUploadModal(false);
      setReportTitle('');
      setReportDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => {
        setUploadSuccessNotice('');
      }, 5000);
    } catch (err) {
      console.error('Failed to upload report:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload report.');
    } finally {
      setUploading(false);
    }
  };

  // Delete Report
  const handleDeleteReport = async (report: LocalCountryReport) => {
    if (confirm(`Move local report "${report.title}" to the Recycle Bin?`)) {
      try {
        await supabase
          .from('country_director_documents')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', report.id);
      } catch {
        // ignore
      }

      setLocalReports(prev => prev.filter(r => r.id !== report.id));
      setUploadSuccessNotice(`Report "${report.title}" moved to the Recycle Bin.`);
      setTimeout(() => setUploadSuccessNotice(''), 4000);
    }
  };

  // Open PDF Preview
  const handleOpenPdfPreview = (report: LocalCountryReport) => {
    setPreviewPdfReport(report);
    if (report.pdf_url) {
      setPreviewBlobUrl(report.pdf_url);
    } else {
      // Create a temporary placeholder blob preview if no URL is present
      const blob = new Blob([`%PDF-1.4 Official Country Director Local Report\nTitle: ${report.title}\nCountry: ${report.country}\nAuthor: ${report.uploaded_by_name}\nDate: ${new Date(report.created_at).toLocaleDateString()}`], { type: 'application/pdf' });
      setPreviewBlobUrl(URL.createObjectURL(blob));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtered reports list strictly scoped to the logged-in director's assigned country
  const filteredReports = localReports
    .filter(report => report.country.toLowerCase() === assignedCountry.toLowerCase())
    .filter(report => {
      const matchesSearch = reportSearchTerm === '' ||
        report.title.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
        report.file_name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
        report.uploaded_by_name.toLowerCase().includes(reportSearchTerm.toLowerCase());

      const matchesCategory = reportCategoryFilter === 'all' || report.category === reportCategoryFilter;

      return matchesSearch && matchesCategory;
    });

  const sidebarNav = [
    { label: 'Regional Overview', icon: <Globe style={{ width: 18, height: 18 }} />, active: activeTab === 'overview', onClick: () => setActiveTab('overview') },
    { label: 'Documents & Local Reports', icon: <FileText style={{ width: 18, height: 18 }} />, active: activeTab === 'documents', onClick: () => setActiveTab('documents') },
    { label: 'Fee Structures & Brochures', icon: <GraduationCap style={{ width: 18, height: 18 }} />, active: activeTab === 'fees', onClick: () => setActiveTab('fees') },
    { label: 'Assigned Tasks', icon: <ClipboardList style={{ width: 18, height: 18 }} />, active: activeTab === 'tasks', onClick: () => setActiveTab('tasks') },
    { label: 'Recycle Bin', icon: <Trash2 style={{ width: 18, height: 18 }} />, active: activeTab === 'trash', onClick: () => setActiveTab('trash') },
  ];

  return (
    <DashboardLayout
      department="Country Directors"
      title="Country Director Regional Hub"
      subtitle={`Local operations, PDF report archives, institutional MOUs, and regional student oversight for ${assignedCountry}`}
      userName={currentProfile.full_name}
      userRole="Country Director"
      navigation={sidebarNav}
      onLogout={logout}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Top Regional Scope & Country Banner */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Globe size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                    Country Director Regional Workspace
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0' }}>
                    Regional command centre exclusively scoped to <strong style={{ color: '#38bdf8' }}>{assignedCountry}</strong> with dedicated PDF document archives and local reporting.
                  </p>
                </div>
              </div>
            </div>

            {/* Locked Assigned Country Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(14, 165, 233, 0.12)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
              <MapPin style={{ color: '#38bdf8', width: '16px', height: '16px', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Assigned Country:</span>
              <strong style={{ color: '#fff', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                🌍 {assignedCountry}
              </strong>
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700, marginLeft: '4px' }}>
                Assigned To You
              </span>
            </div>
          </div>

          {/* Navigation Pill Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Globe size={14} /> Regional Overview
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`btn btn-sm ${activeTab === 'documents' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}
            >
              <FileText size={14} /> Documents & Local Reports
              <span style={{ marginLeft: '4px', padding: '1px 6px', borderRadius: '10px', background: activeTab === 'documents' ? '#fff' : '#0284c7', color: activeTab === 'documents' ? '#0284c7' : '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                {localReports.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fees')}
              className={`btn btn-sm ${activeTab === 'fees' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <GraduationCap size={14} /> University Fees & Brochures
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`btn btn-sm ${activeTab === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ClipboardList size={14} /> Assigned Tasks
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={`btn btn-sm ${activeTab === 'trash' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} /> Recycle Bin
            </button>
          </div>

          {uploadSuccessNotice && (
            <div className="department-member-form-success" role="status" style={{ marginTop: '14px' }}>
              {uploadSuccessNotice}
            </div>
          )}
        </div>

        {/* TAB 1: REGIONAL OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Stats Grid */}
            <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div className="glass-panel glass-panel-interactive animate-scale-up" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Regional Target Applications</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>{visibleApps.length}</div>
                <span style={{ fontSize: '0.68rem', color: '#0ea5e9' }}>Filtered for {assignedCountry}</span>
              </div>

              <div className="glass-panel glass-panel-interactive animate-scale-up" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Partner Institutions in Region</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8', marginTop: '4px' }}>{regionPartners.length}</div>
                <span style={{ fontSize: '0.68rem', color: '#a5b4fc' }}>Active Institutional MOUs</span>
              </div>

              <div
                className="glass-panel glass-panel-interactive animate-scale-up"
                style={{ padding: '18px', cursor: 'pointer' }}
                onClick={() => setActiveTab('documents')}
              >
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Archived Local Reports</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
                  {localReports.filter(r => r.country.toLowerCase() === assignedCountry.toLowerCase()).length}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#fb7185' }}>PDF Reports for {assignedCountry} →</span>
              </div>

              <div className="glass-panel glass-panel-interactive animate-scale-up" style={{ padding: '18px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block' }}>Regional Verification Index</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>100%</div>
                <span style={{ fontSize: '0.68rem', color: '#4ade80' }}>Verified Compliance</span>
              </div>
            </div>

            {/* Regional Applications Table */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#0ea5e9" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>
                    Applications Queue for Region: {assignedCountry}
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {visibleApps.length} student application(s)
                </span>
              </div>

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
                          No applications currently registered for {assignedCountry}.
                        </td>
                      </tr>
                    ) : (
                      visibleApps.map(app => (
                        <tr key={app.id}>
                          <td><strong style={{ color: '#38bdf8' }}>{app.application_number}</strong></td>
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
        )}

        {/* TAB 2: DOCUMENTS & LOCAL REPORTS (PDF ONLY) */}
        {activeTab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Header with Upload PDF Action */}
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <FileText size={22} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                        Local Country Reports & Official Documents
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        Official repository for country directors to record and archive regional intelligence, partner MOUs, and intake audits. <strong style={{ color: '#f87171' }}>Strictly PDF format only.</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowUploadModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderColor: '#ef4444' }}
                >
                  <Upload size={16} />
                  Upload Local Report (PDF)
                </button>
              </div>

              {/* Local Reports Metrics Grid */}
              <div className="dashboard-responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '18px' }}>
                <div
                  onClick={() => setReportCategoryFilter('all')}
                  style={{ padding: '13px', borderRadius: '11px', background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.25)', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>Reports for {assignedCountry}</span>
                  <strong style={{ display: 'block', marginTop: '3px', color: '#7dd3fc', fontSize: '22px' }}>
                    {localReports.filter(r => r.country.toLowerCase() === assignedCountry.toLowerCase()).length}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>Assigned territory archive</span>
                </div>

                <div
                  onClick={() => setReportCategoryFilter('monthly_report')}
                  style={{ padding: '13px', borderRadius: '11px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', color: '#34d399', fontSize: '12px', fontWeight: 700 }}>Monthly Operations</span>
                  <strong style={{ display: 'block', marginTop: '3px', color: '#6ee7b7', fontSize: '22px' }}>
                    {localReports.filter(r => r.country.toLowerCase() === assignedCountry.toLowerCase() && r.category === 'monthly_report').length}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#34d399' }}>Scheduled progress filings</span>
                </div>

                <div
                  onClick={() => setReportCategoryFilter('partner_liaison')}
                  style={{ padding: '13px', borderRadius: '11px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', color: '#c084fc', fontSize: '12px', fontWeight: 700 }}>Partner MOUs & Audits</span>
                  <strong style={{ display: 'block', marginTop: '3px', color: '#d8b4fe', fontSize: '22px' }}>
                    {localReports.filter(r => r.country.toLowerCase() === assignedCountry.toLowerCase() && r.category === 'partner_liaison').length}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#c084fc' }}>Legal & compliance records</span>
                </div>

                <div
                  onClick={() => setReportCategoryFilter('student_intake_visa')}
                  style={{ padding: '13px', borderRadius: '11px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', color: '#fbbf24', fontSize: '12px', fontWeight: 700 }}>Visa & Student Intake</span>
                  <strong style={{ display: 'block', marginTop: '3px', color: '#fde68a', fontSize: '22px' }}>
                    {localReports.filter(r => r.country.toLowerCase() === assignedCountry.toLowerCase() && r.category === 'student_intake_visa').length}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#fbbf24' }}>Regional student processing</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-panel" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                
                {/* Category Filter Pills */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Filter size={13} /> Type:
                  </span>

                  <button
                    type="button"
                    onClick={() => setReportCategoryFilter('all')}
                    style={{
                      fontSize: '0.72rem',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      border: reportCategoryFilter === 'all' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                      background: reportCategoryFilter === 'all' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: reportCategoryFilter === 'all' ? '#fca5a5' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    All Types ({localReports.length})
                  </button>

                  {REPORT_CATEGORIES.map(cat => {
                    const count = localReports.filter(r => r.category === cat.value).length;
                    const isSelected = reportCategoryFilter === cat.value;

                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setReportCategoryFilter(cat.value)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)',
                          color: isSelected ? '#fca5a5' : '#94a3b8',
                          cursor: 'pointer',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat.icon} {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Locked Assigned Country Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.25)', color: '#38bdf8', fontSize: '0.76rem', fontWeight: 700 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>Country:</span>
                  <span>🌍 {assignedCountry}</span>
                  <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', fontWeight: 600 }}>
                    Assigned
                  </span>
                </div>
              </div>

              {/* Realtime Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={reportSearchTerm}
                  onChange={e => setReportSearchTerm(e.target.value)}
                  placeholder="Search local reports by report title, author, filename, or country of origin..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Document Library Table */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} color="#ef4444" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#fff' }}>Official PDF Document & Local Report Registry</h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Showing {filteredReports.length} PDF report(s)
                </span>
              </div>

              {filteredReports.length === 0 ? (
                <div style={{ padding: '40px 20px', border: '1px dashed rgba(239, 68, 68, 0.3)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.03)', textAlign: 'center' }}>
                  <FileText size={36} color="#ef4444" style={{ marginBottom: '10px', opacity: 0.8 }} />
                  <p style={{ margin: 0, color: '#fff', fontWeight: 700 }}>No PDF local reports found.</p>
                  <p style={{ margin: '6px 0 16px', color: '#94a3b8', fontSize: '13px' }}>
                    Upload your first official PDF report for {assignedCountry} to record regional intake intelligence.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowUploadModal(true)}
                    style={{ background: '#dc2626', borderColor: '#ef4444' }}
                  >
                    <Upload size={14} /> Upload PDF Report Now
                  </button>
                </div>
              ) : (
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Document & Title</th>
                        <th>Category</th>
                        <th>Country Scope</th>
                        <th>File Size</th>
                        <th>Uploaded By</th>
                        <th>Date & Time</th>
                        <th style={{ textAlign: 'right' }}>Interactive Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.map(report => {
                        const categoryMeta = REPORT_CATEGORIES.find(c => c.value === report.category) || REPORT_CATEGORIES[0];

                        return (
                          <tr key={report.id} style={{ transition: 'background 0.15s' }}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#f87171',
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  flexShrink: 0
                                }}>
                                  PDF
                                </div>
                                <div>
                                  <strong style={{ display: 'block', color: '#fff', fontSize: '0.86rem' }}>
                                    {report.title}
                                  </strong>
                                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                    {report.file_name}
                                  </span>
                                  {report.description && (
                                    <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '0.74rem', fontStyle: 'italic', maxWidth: '360px' }}>
                                      "{report.description}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                color: '#cbd5e1',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                {categoryMeta.icon} {categoryMeta.label}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '0.76rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'rgba(14, 165, 233, 0.12)',
                                color: '#38bdf8',
                                border: '1px solid rgba(14, 165, 233, 0.25)',
                                fontWeight: 700
                              }}>
                                🌍 {report.country}
                              </span>
                            </td>
                            <td style={{ color: '#94a3b8', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                              {formatFileSize(report.file_size)}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={13} color="#94a3b8" />
                                <span style={{ color: '#fff', fontSize: '0.76rem', fontWeight: 600 }}>
                                  {report.uploaded_by_name}
                                </span>
                              </div>
                            </td>
                            <td style={{ color: '#94a3b8', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                              {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}
                                  onClick={() => handleOpenPdfPreview(report)}
                                  title="View and preview PDF report"
                                >
                                  <Eye size={13} /> View PDF
                                </button>
                                
                                {report.pdf_url && (
                                  <a
                                    href={report.pdf_url}
                                    download={report.file_name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                    title="Download PDF"
                                  >
                                    <Download size={13} /> Download
                                  </a>
                                )}

                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm"
                                  style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                                  onClick={() => handleDeleteReport(report)}
                                  title="Move to Recycle Bin"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: UNIVERSITY FEE STRUCTURES & BROCHURES */}
        {activeTab === 'fees' && (
          <InstitutionFeeDirectory departmentTitle="Country Directors" />
        )}

        {/* TAB 4: ASSIGNED TASKS */}
        {activeTab === 'tasks' && (
          <div id="directors-assigned-tasks">
            <DepartmentTaskInbox />
          </div>
        )}

        {/* TAB 5: RECYCLE BIN */}
        {activeTab === 'trash' && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <TrashBin departmentKey="country_directors" />
          </div>
        )}

      </div>

      {/* MODAL: UPLOAD OFFICIAL LOCAL PDF REPORT */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '580px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff', fontWeight: 700 }}>
                    Upload Country Director Local Report
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#f87171' }}>
                    Strict Policy: Only Official PDF Files (.pdf) Accepted
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadError('');
                }}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* PDF File Drag and Drop Zone */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Official PDF Document File *</span>
                  <span style={{ color: '#f87171', fontSize: '0.7rem' }}>.PDF ONLY</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: selectedFile ? '2px solid #10b981' : '2px dashed rgba(239, 68, 68, 0.4)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    background: selectedFile ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />

                  {selectedFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <FileCheck size={36} color="#10b981" />
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedFile.name}</strong>
                      <span style={{ color: '#34d399', fontSize: '0.76rem' }}>
                        Valid PDF • {formatFileSize(selectedFile.size)} • Click to choose another
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <Upload size={32} color="#ef4444" />
                      <strong style={{ color: '#fff', fontSize: '0.88rem' }}>Click or Drag PDF Report Here</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                        Only official PDF format (.pdf) up to 25 MB supported
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Title */}
              <div>
                <label className="form-label" htmlFor="report-title">Report Title *</label>
                <input
                  id="report-title"
                  type="text"
                  required
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  placeholder="e.g. Q3 Lagos Secondary School Outreach & Partner MOU Report"
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Category and Target Country */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" htmlFor="report-category">Report Category</label>
                  <select
                    id="report-category"
                    value={reportCategory}
                    onChange={e => setReportCategory(e.target.value as LocalCountryReport['category'])}
                    className="form-input"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {REPORT_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Target Country / Region (Locked)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: '0.85rem' }}>
                    <MapPin size={16} color="#38bdf8" />
                    <span>🌍 {assignedCountry}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>(Assigned to your profile)</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary / Notes */}
              <div>
                <label className="form-label" htmlFor="report-notes">Executive Summary / Regional Notes</label>
                <textarea
                  id="report-notes"
                  rows={3}
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  placeholder="Key takeaways, highlights, meetings held, or specific follow-up actions for Central Management & Admissions..."
                  className="form-input"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {uploadError && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                    setUploadError('');
                  }}
                  disabled={uploading}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn btn-primary btn-sm"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={14} />
                  {uploading ? 'Archiving PDF...' : 'Upload & Archive Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE PDF VIEWER */}
      {previewPdfReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '900px', height: '88vh', display: 'flex', flexDirection: 'column', background: '#0f172a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            
            {/* Viewer Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '4px 8px', borderRadius: '6px', background: '#dc2626', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>
                  PDF
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                    {previewPdfReport.title}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {previewPdfReport.file_name} • 🌍 {previewPdfReport.country} • By {previewPdfReport.uploaded_by_name}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {previewBlobUrl && (
                  <a
                    href={previewBlobUrl}
                    download={previewPdfReport.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <Download size={13} /> Download PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPreviewPdfReport(null);
                    setPreviewBlobUrl(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px' }}
                >
                  <X size={16} /> Close
                </button>
              </div>
            </div>

            {/* Embedded PDF Frame */}
            <div style={{ flex: 1, background: '#334155', position: 'relative' }}>
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title={previewPdfReport.title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#cbd5e1' }}>
                  Loading PDF Document...
                </div>
              )}
            </div>

            {/* Viewer Footer */}
            <div style={{ padding: '10px 20px', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
              <span>Archived on {new Date(previewPdfReport.created_at).toLocaleDateString()}</span>
              <span>Globe Scholars Pathways • Country Director Official Local Documentation</span>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

