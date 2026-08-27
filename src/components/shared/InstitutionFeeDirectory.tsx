import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { supabase } from '../../lib/supabase';
import {
  GraduationCap,
  Search,
  DollarSign,
  Award,
  BookOpen,
  FileText,
  Download,
  Eye,
  Check,
  Copy,
  Mail,
  Globe,
  Building,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  FileCheck,
  ArrowRight
} from 'lucide-react';
import { UniversityCourse, Scholarship, UniversityBrochure, PartnerUniversity } from '../../types/database';

interface InstitutionFeeDirectoryProps {
  departmentTitle?: string;
}

export type FeeDirectoryTab = 'institutions' | 'courses' | 'scholarships' | 'brochures';

export const InstitutionFeeDirectory: React.FC<InstitutionFeeDirectoryProps> = ({
  departmentTitle = 'Advisory'
}) => {
  const {
    partnerUniversities,
    universityCourses,
    scholarships,
    universityBrochures
  } = useApplication();

  const [activeTab, setActiveTab] = useState<FeeDirectoryTab>('institutions');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [expandedPartnerId, setExpandedPartnerId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState<boolean>(false);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);
  const [copiedScholarshipId, setCopiedScholarshipId] = useState<string | null>(null);
  const [previewBrochureUrl, setPreviewBrochureUrl] = useState<string | null>(null);

  // Derive unique countries
  const countries = ['all', ...new Set(partnerUniversities.map(p => p.country).filter(Boolean))].sort();

  // Filtered universities
  const filteredUniversities = partnerUniversities.filter(partner => {
    const matchesCountry = selectedCountry === 'all' || partner.country.toLowerCase() === selectedCountry.toLowerCase();
    const partnerCourses = universityCourses.filter(c => c.university_id === partner.id);
    const matchesCourseName = partnerCourses.some(c => c.course_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSearch =
      searchTerm.trim() === '' ||
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matchesCourseName;

    return matchesCountry && matchesSearch;
  });

  // Filtered aggregate courses
  const filteredCourses = universityCourses.filter(course => {
    const partner = partnerUniversities.find(p => p.id === course.university_id);
    const matchesCountry = selectedCountry === 'all' || (partner && partner.country.toLowerCase() === selectedCountry.toLowerCase());
    const matchesSearch =
      searchTerm.trim() === '' ||
      course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (partner && partner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner && partner.country.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCountry && matchesSearch;
  });

  // Filtered aggregate scholarships
  const filteredScholarships = scholarships.filter(scholarship => {
    const partner = partnerUniversities.find(p => p.id === scholarship.university_id);
    const matchesCountry = selectedCountry === 'all' || (partner && partner.country.toLowerCase() === selectedCountry.toLowerCase());
    const matchesSearch =
      searchTerm.trim() === '' ||
      scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (scholarship.eligibility_criteria && scholarship.eligibility_criteria.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner && partner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner && partner.country.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCountry && matchesSearch;
  });

  // Filtered brochures
  const filteredBrochures = universityBrochures.filter(brochure => {
    return (
      searchTerm.trim() === '' ||
      brochure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brochure.description && brochure.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (brochure.file_name && brochure.file_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalCourses = universityCourses.length;
  const totalScholarships = scholarships.length;
  const totalBrochures = universityBrochures.length;

  const handleCopyFeeQuote = (partner: PartnerUniversity | undefined, course: UniversityCourse) => {
    const uniName = partner ? partner.name : 'Partner University';
    const uniCountry = partner ? partner.country : 'International';
    const total = (course.admission_fee || 0) + (course.tuition_fee || 0);
    const pitchText = `🏛️ University: ${uniName} (${uniCountry})\n📚 Degree Program: ${course.course_name}\n💵 Admission / Registration Fee: USD ${course.admission_fee.toFixed(2)}\n🎓 Tuition Fee: USD ${course.tuition_fee.toFixed(2)}\n💰 Total Estimated Initial Fees: USD ${total.toFixed(2)}\n📧 Official Admissions Contact: ${partner?.contact_email || 'info@globescholars.com'}\n🌐 Verified via Globe Scholars Advisory Portal`;
    
    navigator.clipboard.writeText(pitchText);
    setCopiedCourseId(course.id);
    setTimeout(() => setCopiedCourseId(null), 2500);
  };

  const handleCopyScholarship = (partner: PartnerUniversity | undefined, scholarship: Scholarship) => {
    const uniName = partner ? partner.name : 'Partner University';
    const coverage = scholarship.coverage_percentage
      ? `${scholarship.coverage_percentage}% of Tuition Fee`
      : `USD ${scholarship.coverage_amount.toFixed(2)} Financial Grant`;
    const pitchText = `🏆 Scholarship Opportunity: ${scholarship.name}\n🏛️ Host University: ${uniName} (${partner?.country || 'International'})\n💰 Coverage: ${coverage}\n📋 Eligibility & Criteria: ${scholarship.eligibility_criteria || 'Merit and academic performance evaluation'}\n📧 Admissions Contact: ${partner?.contact_email || 'info@globescholars.com'}`;

    navigator.clipboard.writeText(pitchText);
    setCopiedScholarshipId(scholarship.id);
    setTimeout(() => setCopiedScholarshipId(null), 2500);
  };

  const getBrochurePublicUrl = (path: string) => {
    return supabase.storage.from('department-reports').getPublicUrl(path).data?.publicUrl;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '22px 26px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e40af, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827', fontWeight: 700 }}>
                  Partner Institutions, Fee Structures & Scholarship Catalog
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                  Interactive reference directory for <strong style={{ color: '#1e40af' }}>{departmentTitle}</strong> team. Click any stat card below to view detailed breakdown.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Clickable Quick Metric Cards */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* 1. INSTITUTIONS CARD */}
            <div
              onClick={() => setActiveTab('institutions')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'institutions' ? 'rgba(37, 99, 235, 0.08)' : '#fff',
                border: activeTab === 'institutions' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                boxShadow: activeTab === 'institutions' ? '0 0 0 3px rgba(37, 99, 235, 0.15), 0 2px 6px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.05)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: activeTab === 'institutions' ? 'translateY(-2px)' : 'none',
                minWidth: '105px'
              }}
              title="Click to view all partner universities and fee structures"
            >
              <span style={{ fontSize: '0.68rem', color: activeTab === 'institutions' ? '#1e40af' : '#6b7280', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Institutions
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#1e40af', display: 'block', marginTop: '2px' }}>
                {partnerUniversities.length}
              </strong>
              {activeTab === 'institutions' && (
                <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#2563eb', color: '#fff' }}>
                  ACTIVE
                </span>
              )}
            </div>

            {/* 2. COURSES CARD */}
            <div
              onClick={() => setActiveTab('courses')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'courses' ? 'rgba(5, 150, 105, 0.08)' : '#fff',
                border: activeTab === 'courses' ? '2px solid #059669' : '1px solid #e5e7eb',
                boxShadow: activeTab === 'courses' ? '0 0 0 3px rgba(5, 150, 105, 0.15), 0 2px 6px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.05)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: activeTab === 'courses' ? 'translateY(-2px)' : 'none',
                minWidth: '105px'
              }}
              title="Click to view all course offerings and compare tuition fees"
            >
              <span style={{ fontSize: '0.68rem', color: activeTab === 'courses' ? '#065f46' : '#6b7280', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Courses
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#059669', display: 'block', marginTop: '2px' }}>
                {totalCourses}
              </strong>
              {activeTab === 'courses' && (
                <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#059669', color: '#fff' }}>
                  ACTIVE
                </span>
              )}
            </div>

            {/* 3. SCHOLARSHIPS CARD */}
            <div
              onClick={() => setActiveTab('scholarships')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'scholarships' ? 'rgba(217, 119, 6, 0.08)' : '#fff',
                border: activeTab === 'scholarships' ? '2px solid #d97706' : '1px solid #e5e7eb',
                boxShadow: activeTab === 'scholarships' ? '0 0 0 3px rgba(217, 119, 6, 0.15), 0 2px 6px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.05)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: activeTab === 'scholarships' ? 'translateY(-2px)' : 'none',
                minWidth: '105px'
              }}
              title="Click to browse all scholarships and tuition discount waivers"
            >
              <span style={{ fontSize: '0.68rem', color: activeTab === 'scholarships' ? '#92400e' : '#6b7280', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Scholarships
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#d97706', display: 'block', marginTop: '2px' }}>
                {totalScholarships}
              </strong>
              {activeTab === 'scholarships' && (
                <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#d97706', color: '#fff' }}>
                  ACTIVE
                </span>
              )}
            </div>

            {/* 4. BROCHURES CARD */}
            <div
              onClick={() => setActiveTab('brochures')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'brochures' ? 'rgba(124, 58, 237, 0.08)' : '#fff',
                border: activeTab === 'brochures' ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                boxShadow: activeTab === 'brochures' ? '0 0 0 3px rgba(124, 58, 237, 0.15), 0 2px 6px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.05)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                transform: activeTab === 'brochures' ? 'translateY(-2px)' : 'none',
                minWidth: '105px'
              }}
              title="Click to view and download official PDF university brochures"
            >
              <span style={{ fontSize: '0.68rem', color: activeTab === 'brochures' ? '#5b21b6' : '#6b7280', display: 'block', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Brochures
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#7c3aed', display: 'block', marginTop: '2px' }}>
                {totalBrochures}
              </strong>
              {activeTab === 'brochures' && (
                <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: '#7c3aed', color: '#fff' }}>
                  ACTIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', color: '#6b7280', fontWeight: 600, marginRight: '4px' }}>
            Current View:
          </span>

          <button
            type="button"
            onClick={() => setActiveTab('institutions')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeTab === 'institutions' ? '1px solid #2563eb' : '1px solid #e5e7eb',
              background: activeTab === 'institutions' ? '#2563eb' : '#fff',
              color: activeTab === 'institutions' ? '#fff' : '#4b5563',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Building size={14} /> Partner Institutions ({partnerUniversities.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeTab === 'courses' ? '1px solid #059669' : '1px solid #e5e7eb',
              background: activeTab === 'courses' ? '#059669' : '#fff',
              color: activeTab === 'courses' ? '#fff' : '#4b5563',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={14} /> All Courses & Fees ({totalCourses})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scholarships')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeTab === 'scholarships' ? '1px solid #d97706' : '1px solid #e5e7eb',
              background: activeTab === 'scholarships' ? '#d97706' : '#fff',
              color: activeTab === 'scholarships' ? '#fff' : '#4b5563',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Award size={14} /> Scholarships Catalog ({totalScholarships})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brochures')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: activeTab === 'brochures' ? '1px solid #7c3aed' : '1px solid #e5e7eb',
              background: activeTab === 'brochures' ? '#7c3aed' : '#fff',
              color: activeTab === 'brochures' ? '#fff' : '#4b5563',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} /> Official PDF Brochures ({totalBrochures})
          </button>
        </div>

        {/* Search & Country Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'institutions'
                  ? 'Search by university name, country, or course title...'
                  : activeTab === 'courses'
                  ? 'Search degree program name, pricing, or university...'
                  : activeTab === 'scholarships'
                  ? 'Search scholarship title, eligibility criteria, or university...'
                  : 'Search official brochure title or guidebook keyword...'
              }
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            />
          </div>

          {activeTab !== 'brochures' && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {countries.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCountry(c)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: selectedCountry === c ? '1px solid #2563eb' : '1px solid #e5e7eb',
                    background: selectedCountry === c ? '#2563eb' : '#fff',
                    color: selectedCountry === c ? '#fff' : '#4b5563',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {c === 'all' ? 'All Countries' : c}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'institutions' && (
            <button
              type="button"
              onClick={() => setExpandAll(!expandAll)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: '#f8fafc',
                color: '#374151',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {expandAll ? 'Collapse All Details' : 'Expand All Fee Structures'}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INSTITUTIONS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'institutions' && (
        <>
          {filteredUniversities.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', borderRadius: '12px' }}>
              <Building size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <h4 style={{ margin: 0, color: '#374151', fontSize: '0.95rem' }}>No Partner Institutions Found</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                {searchTerm || selectedCountry !== 'all' ? 'Try adjusting your search query or country filter.' : 'Admin has not uploaded any partner universities yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredUniversities.map(partner => {
                const partnerCourses = universityCourses.filter(c => c.university_id === partner.id);
                const partnerScholarships = scholarships.filter(s => s.university_id === partner.id);
                const isExpanded = expandAll || expandedPartnerId === partner.id || filteredUniversities.length === 1;

                return (
                  <div
                    key={partner.id}
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {/* Institution Header Row */}
                    <div
                      onClick={() => setExpandedPartnerId(isExpanded && !expandAll ? null : partner.id)}
                      style={{
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        background: isExpanded ? '#f8fafc' : '#fff',
                        borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontWeight: 700, fontSize: '1rem' }}>
                          {partner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.98rem', color: '#111827' }}>{partner.name}</strong>
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: '#eff6ff', color: '#1e40af', fontWeight: 600, border: '1px solid #dbeafe' }}>
                              <Globe size={11} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
                              {partner.country}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span><Mail size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />{partner.contact_email || 'admissions@university.edu'}</span>
                            <span>•</span>
                            <span style={{ color: '#059669', fontWeight: 600 }}>{partnerCourses.length} Programs</span>
                            <span>•</span>
                            <span style={{ color: '#d97706', fontWeight: 600 }}>{partnerScholarships.length} Scholarships</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>
                          {isExpanded ? 'Collapse Details' : 'View Fee Structure'}
                        </span>
                        {isExpanded ? <ChevronUp size={18} color="#6b7280" /> : <ChevronDown size={18} color="#6b7280" />}
                      </div>
                    </div>

                    {/* Expanded Details Body */}
                    {isExpanded && (
                      <div style={{ padding: '20px' }}>
                        
                        {/* Courses & Fee Structure Table */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <BookOpen size={16} color="#2563eb" />
                              Degree Programs & Comprehensive Fee Structure
                            </h4>
                            <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Click "Copy Fee Quote" to send to student</span>
                          </div>

                          {partnerCourses.length === 0 ? (
                            <div style={{ padding: '16px', borderRadius: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                              No specific courses listed for this institution yet.
                            </div>
                          ) : (
                            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                <thead>
                                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', color: '#475569' }}>
                                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Program / Degree Course</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#0891b2' }}>Admission Fee</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#059669' }}>Tuition Fee</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#1e40af' }}>Total Initial Fee</th>
                                    <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {partnerCourses.map(course => {
                                    const total = (course.admission_fee || 0) + (course.tuition_fee || 0);
                                    const isCopied = copiedCourseId === course.id;

                                    return (
                                      <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                                          {course.course_name}
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.1)', color: '#0891b2', fontWeight: 700, fontSize: '0.78rem' }}>
                                            USD {course.admission_fee.toFixed(2)}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>
                                            USD {course.tuition_fee.toFixed(2)}
                                          </span>
                                        </td>
                                        <td style={{ padding: '10px 14px' }}>
                                          <strong style={{ color: '#1e40af', fontSize: '0.82rem' }}>
                                            USD {total.toFixed(2)}
                                          </strong>
                                        </td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyFeeQuote(partner, course)}
                                            style={{
                                              padding: '4px 10px',
                                              borderRadius: '6px',
                                              border: '1px solid #d1d5db',
                                              background: isCopied ? '#ecfdf5' : '#fff',
                                              color: isCopied ? '#059669' : '#374151',
                                              fontSize: '0.72rem',
                                              fontWeight: 600,
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                          >
                                            {isCopied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                                            {isCopied ? 'Copied!' : 'Copy Fee Quote'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Scholarships Section */}
                        {partnerScholarships.length > 0 && (
                          <div style={{ marginBottom: '18px', padding: '14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                            <h5 style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Award size={15} color="#d97706" />
                              Scholarships & Waivers Offered by {partner.name}
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                              {partnerScholarships.map(s => (
                                <div key={s.id} style={{ padding: '10px 12px', borderRadius: '6px', background: '#fff', border: '1px solid #fde68a' }}>
                                  <strong style={{ fontSize: '0.8rem', color: '#78350f', display: 'block' }}>{s.name}</strong>
                                  <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
                                    Coverage: {s.coverage_percentage ? `${s.coverage_percentage}% of tuition` : `USD ${s.coverage_amount.toFixed(2)}`}
                                  </div>
                                  {s.eligibility_criteria && (
                                    <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#4b5563' }}>
                                      <strong>Criteria:</strong> {s.eligibility_criteria}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL COURSES & PRICING TABLE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#059669" />
              <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#111827', fontWeight: 700 }}>
                Comprehensive Degree Courses & Fee Schedule
              </h4>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#6b7280' }}>
              Showing {filteredCourses.length} course offering(s)
            </span>
          </div>

          {filteredCourses.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
              <BookOpen size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>No matching courses found.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>Try clearing search keywords or choosing "All Countries".</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', color: '#475569' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>Degree / Course Name</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600 }}>University & Country</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#0891b2' }}>Admission Fee</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#059669' }}>Tuition Fee</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, color: '#1e40af' }}>Total Estimated Fee</th>
                    <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Interactive Quote</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(course => {
                    const partner = partnerUniversities.find(p => p.id === course.university_id);
                    const total = (course.admission_fee || 0) + (course.tuition_fee || 0);
                    const isCopied = copiedCourseId === course.id;

                    return (
                      <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#111827' }}>
                          {course.course_name}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: 600, color: '#1e40af', display: 'block' }}>
                            {partner?.name || 'Partner University'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                            🌍 {partner?.country || 'International'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.1)', color: '#0891b2', fontWeight: 700, fontSize: '0.78rem' }}>
                            USD {course.admission_fee.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 700, fontSize: '0.78rem' }}>
                            USD {course.tuition_fee.toFixed(2)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#1e40af', fontSize: '0.84rem' }}>
                            USD {total.toFixed(2)}
                          </strong>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleCopyFeeQuote(partner, course)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              background: isCopied ? '#ecfdf5' : '#fff',
                              color: isCopied ? '#059669' : '#1e40af',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            {isCopied ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                            {isCopied ? 'Quote Copied!' : 'Copy Fee Quote'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SCHOLARSHIPS CATALOG VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'scholarships' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#d97706" />
              <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#111827', fontWeight: 700 }}>
                Active Scholarships, Grants & Tuition Waivers
              </h4>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#6b7280' }}>
              {filteredScholarships.length} scholarship program(s) available
            </span>
          </div>

          {filteredScholarships.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #e5e7eb', borderRadius: '8px' }}>
              <Award size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>No scholarships found for this criteria.</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.76rem' }}>Try clearing search keywords or selecting "All Countries".</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {filteredScholarships.map(scholarship => {
                const partner = partnerUniversities.find(p => p.id === scholarship.university_id);
                const isCopied = copiedScholarshipId === scholarship.id;
                const coverageText = scholarship.coverage_percentage
                  ? `${scholarship.coverage_percentage}% Tuition Waiver`
                  : `USD ${scholarship.coverage_amount.toFixed(2)} Financial Grant`;

                return (
                  <div
                    key={scholarship.id}
                    style={{
                      borderRadius: '10px',
                      border: '1px solid #fde68a',
                      background: 'linear-gradient(180deg, #fffbeb 0%, #fff 100%)',
                      padding: '16px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                        <strong style={{ fontSize: '0.92rem', color: '#78350f' }}>
                          {scholarship.name}
                        </strong>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                          {coverageText}
                        </span>
                      </div>

                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
                        <span style={{ fontWeight: 600, color: '#1e40af' }}>
                          🏛️ {partner?.name || 'Partner Institution'}
                        </span>
                        <span style={{ marginLeft: '6px' }}>
                          🌍 {partner?.country || 'International'}
                        </span>
                      </div>

                      {scholarship.eligibility_criteria && (
                        <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', background: '#fff', border: '1px solid #fef3c7', fontSize: '0.73rem', color: '#4b5563' }}>
                          <strong style={{ color: '#92400e' }}>Eligibility: </strong>
                          {scholarship.eligibility_criteria}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #fef3c7', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyScholarship(partner, scholarship)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #d97706',
                          background: isCopied ? '#ecfdf5' : '#fff',
                          color: isCopied ? '#059669' : '#d97706',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isCopied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        {isCopied ? 'Details Copied!' : 'Copy Scholarship Pitch'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OFFICIAL UNIVERSITY BROCHURES VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'brochures' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#7c3aed" />
              <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#111827', fontWeight: 700 }}>
                Official University Brochures, Prospectuses & Student Handbooks
              </h4>
            </div>
            <span style={{ fontSize: '0.76rem', color: '#6b7280' }}>
              {filteredBrochures.length} document(s) uploaded
            </span>
          </div>

          {filteredBrochures.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', border: '1px dashed #ddd6fe', borderRadius: '8px', background: '#faf5ff' }}>
              <FileText size={36} style={{ margin: '0 auto 10px', color: '#7c3aed', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#4c1d95', fontSize: '0.9rem' }}>No official university brochures published yet.</p>
              <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: '#6b7280' }}>
                Admissions department and Admin can publish PDF brochures, prospectus sheets, and visa handbooks directly from the Admissions Workspace.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBrochures.map(brochure => {
                const publicUrl = getBrochurePublicUrl(brochure.storage_path);
                const isViewing = previewBrochureUrl === publicUrl;

                return (
                  <div
                    key={brochure.id}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #ddd6fe',
                      background: '#fff',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.88rem', color: '#4c1d95', display: 'block' }}>
                            {brochure.title}
                          </strong>
                          {brochure.description && (
                            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#6b7280' }}>
                              {brochure.description}
                            </p>
                          )}
                          <span style={{ fontSize: '0.68rem', color: '#9ca3af', display: 'block', marginTop: '3px' }}>
                            File: {brochure.file_name} • Published by Admissions
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {publicUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewBrochureUrl(isViewing ? null : publicUrl)}
                            style={{
                              fontSize: '0.74rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: isViewing ? '#374151' : '#7c3aed',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 600
                            }}
                          >
                            <Eye size={13} /> {isViewing ? 'Close Preview' : 'View PDF'}
                          </button>
                        )}
                        {publicUrl && (
                          <a
                            href={publicUrl}
                            download={brochure.file_name}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: '0.74rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#059669',
                              color: '#fff',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 600
                            }}
                          >
                            <Download size={13} /> Download PDF
                          </a>
                        )}
                      </div>
                    </div>

                    {/* PDF Embedded View */}
                    {isViewing && publicUrl && (
                      <div style={{ borderTop: '1px solid #ddd6fe', background: '#f8fafc', padding: '10px' }}>
                        <iframe
                          src={publicUrl}
                          title={brochure.title}
                          style={{ width: '100%', height: '520px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
