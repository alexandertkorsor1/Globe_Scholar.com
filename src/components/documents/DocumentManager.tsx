import React, { useRef, useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  History,
  Lock,
  ExternalLink,
  Plus,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { ApplicationDocument, DocType } from '../../types/database';
import {
  isPassportPhotoType,
  compressPassportPhotoFile,
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_LABEL,
} from '../../lib/image-utils';

interface DocumentManagerProps {
  applicationId: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ applicationId }) => {
  const { documents, addDocument, updateDocumentVersion, verifyDocument, toggleMissingDocFlag } = useApplication();
  const { currentProfile } = useAuth();

  const [selectedDoc, setSelectedDoc] = useState<ApplicationDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocType, setNewDocType] = useState<DocType>('academic_transcript');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionSummary, setVersionSummary] = useState('');

  const appDocs = documents.filter(d => d.application_id === applicationId);

  const canVerify = ['admin', 'data_applications'].includes(currentProfile.department);

  const handleUploadNew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert('Please select a document file first.');
      return;
    }

    let fileToUpload = selectedFile;
    const isPassportPhoto = isPassportPhotoType(newDocType) || newDocType === 'passport_photo';

    if (isPassportPhoto) {
      if (selectedFile.size > MAX_AVATAR_SIZE_BYTES) {
        if (selectedFile.type.startsWith('image/')) {
          try {
            const compressed = await compressPassportPhotoFile(selectedFile);
            fileToUpload = compressed.file;
          } catch {
            alert(`Passport picture exceeds strict 50 KB limit (${(selectedFile.size / 1024).toFixed(1)} KB). Please select an image under 50 KB.`);
            return;
          }
        } else {
          alert(`Passport picture exceeds strict 50 KB limit (${(selectedFile.size / 1024).toFixed(1)} KB). Please upload a photo under 50 KB.`);
          return;
        }
      }
    }

    try {
      await addDocument(
        applicationId,
        newDocType,
        fileToUpload
      );

      setSelectedFile(null);
      setShowUploadModal(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('DOCUMENT UPLOAD ERROR:', error);

      alert(
        `Document upload failed:\n\n${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const handleNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !versionSummary) return;
    updateDocumentVersion(selectedDoc.id, versionSummary);
    setVersionSummary('');
    setShowVersionModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText style={{ color: '#06b6d4', width: '18px', height: '18px' }} />
            Application Document Management & Signed Storage
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Document versioning, verification status, and signed Supabase storage URLs.
          </p>
        </div>

        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm">
          <Upload style={{ width: '14px', height: '14px' }} />
          Upload Document
        </button>
      </div>

      {/* Documents Table */}
      <div className="custom-table-container glass-panel">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Document Type</th>
              <th>File Name</th>
              <th>Version</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appDocs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                  No documents uploaded for this application yet.
                </td>
              </tr>
            ) : (
              appDocs.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <span className="badge badge-under_review" style={{ fontSize: '0.65rem' }}>
                      {doc.document_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{doc.file_name}</div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {(doc.file_size / 1024 / 1024).toFixed(2)} MB • PDF
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-submitted" style={{ fontSize: '0.65rem' }}>
                      v{doc.current_version} ({doc.versions?.length || 1} iterations)
                    </span>
                  </td>
                  <td>
                    {doc.is_missing ? (
                      <span className="badge badge-documents_missing">
                        <AlertCircle style={{ width: '10px', height: '10px' }} /> Missing / Rejected
                      </span>
                    ) : (
                      <span className="badge badge-documents_verified">
                        <CheckCircle style={{ width: '10px', height: '10px' }} /> Uploaded
                      </span>
                    )}
                  </td>
                  <td>
                    {doc.is_verified ? (
                      <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>
                        ✓ Verified by {doc.verified_by_name || 'Data Team'}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                        Pending Verification
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      
                      {/* Version History Button */}
                      <button
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowVersionModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        title="View Version History & Upload New Version"
                      >
                        <History style={{ width: '12px', height: '12px' }} />
                        Versions
                      </button>

                      {/* Verify Toggle (Authorized for Data & Apps / Admin) */}
                      {canVerify && (
                        <button
                          onClick={() => verifyDocument(doc.id, !doc.is_verified)}
                          className={`btn btn-sm ${doc.is_verified ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          {doc.is_verified ? 'Unverify' : 'Mark Verified'}
                        </button>
                      )}

                      {/* Toggle Missing Flag */}
                      {canVerify && (
                        <button
                          onClick={() => toggleMissingDocFlag(doc.id, !doc.is_missing)}
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          {doc.is_missing ? 'Clear Flag' : 'Flag Missing'}
                        </button>
                      )}

                      {/* Signed URL Preview */}
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Signed Supabase Token Access granted!\nURL: ${doc.signed_url || 'https://supabase.storage/v1/signed-token'}\nAccess expires in 15 minutes.`);
                        }}
                        style={{ color: '#06b6d4', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                      >
                        <Eye style={{ width: '12px', height: '12px' }} />
                        Signed Link
                      </a>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Upload New Document */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '420px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '16px' }}>Upload Application Document</h3>
            <form onSubmit={handleUploadNew} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Document Category</label>
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value as DocType)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="passport_photo">Passport-Size Photo (Max 50 KB)</option>
                  <option value="passport">Passport Biometric Page</option>
                  <option value="academic_transcript">Official Academic Transcript</option>
                  <option value="english_proficiency">IELTS / TOEFL Score Certificate</option>
                  <option value="recommendation_letter">Academic Letter of Recommendation</option>
                  <option value="financial_statement">Bank Statement / Proof of Funds</option>
                  <option value="personal_statement">Personal Statement Essay</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  Select Document File
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    border: '1px solid var(--border-color)'
                  }}
                />

                {selectedFile && (
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '0.75rem',
                      color: '#34d399'
                    }}
                  >
                    Selected: {selectedFile.name}
                    {' '}({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Upload & Sign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Document Version History */}
      {showVersionModal && selectedDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '560px', padding: '24px', background: '#0f172a' }}>
            <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '6px' }}>
              Document Version History: {selectedDoc.file_name}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '16px' }}>
              Audit compliance records tracking all historical uploads and replacements.
            </p>

            <div className="custom-table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ver</th>
                    <th>Uploaded By</th>
                    <th>Timestamp</th>
                    <th>Change Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDoc.versions?.map(v => (
                    <tr key={v.id}>
                      <td><span className="badge badge-submitted">v{v.version_number}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{v.uploaded_by_name}</td>
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(v.uploaded_at).toLocaleDateString()}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{v.change_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Upload Next Version Form */}
            <form onSubmit={handleNewVersion} style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: '#6366f1', marginBottom: '8px' }}>
                Upload Version {selectedDoc.current_version + 1} Replacement
              </h4>
              <input
                type="text"
                required
                placeholder="Reason / Change summary for this version update..."
                value={versionSummary}
                onChange={e => setVersionSummary(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--border-color)', marginBottom: '10px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowVersionModal(false)} className="btn btn-secondary btn-sm">Close</button>
                <button type="submit" className="btn btn-primary btn-sm">Save New Version</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
