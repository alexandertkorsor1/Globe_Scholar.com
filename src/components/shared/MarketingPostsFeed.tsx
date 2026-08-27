import React, { useState } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  Tag,
  Share2,
  Calendar,
  User,
  Copy,
  Check,
  Search,
  Filter,
  Sparkles,
  Radio,
  X,
  AlertCircle
} from 'lucide-react';
import { MarketingPost, MarketingPostCategory, MarketingPostPlatform } from '../../types/database';

interface MarketingPostsFeedProps {
  allowCreate?: boolean;
  departmentTitle?: string;
}

const CATEGORY_CONFIG: Record<MarketingPostCategory, { label: string; color: string; bg: string; border: string }> = {
  campaign: { label: 'General Campaign', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  webinar: { label: 'Global Webinar', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  fee_waiver: { label: 'Fee Waiver Alert', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  scholarship_drive: { label: 'Scholarship Drive', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  announcement: { label: 'Marketing Bulletin', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  social_ad: { label: 'Social Ad Campaign', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
};

const PLATFORM_CONFIG: Record<MarketingPostPlatform, { label: string; icon: string }> = {
  all: { label: 'All Channels', icon: '🌐' },
  facebook: { label: 'Facebook', icon: '📘' },
  instagram: { label: 'Instagram', icon: '📸' },
  tiktok: { label: 'TikTok', icon: '🎵' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  general: { label: 'Website / Portal', icon: '📢' },
};

export const MarketingPostsFeed: React.FC<MarketingPostsFeedProps> = ({
  allowCreate = false,
  departmentTitle = 'Cross-Department'
}) => {
  const { marketingPosts, addMarketingPost, deleteMarketingPost } = useApplication();
  const { currentProfile } = useAuth();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MarketingPostCategory>('campaign');
  const [platform, setPlatform] = useState<MarketingPostPlatform>('all');
  const [externalLink, setExternalLink] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please provide a title and content.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await addMarketingPost({
        title,
        content,
        category,
        platform,
        external_link: externalLink || null,
        target_audience: targetAudience || null,
        author_name: currentProfile.full_name || 'Marketing Team',
        author_role: 'Marketing Specialist'
      });

      setShowCreateModal(false);
      setTitle('');
      setContent('');
      setExternalLink('');
      setTargetAudience('');
      setCategory('campaign');
      setPlatform('all');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketing post?')) return;
    try {
      await deleteMarketingPost(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  };

  const handleCopyPitch = (post: MarketingPost) => {
    const pitch = `📢 [Marketing Update: ${post.title}]\nCategory: ${CATEGORY_CONFIG[post.category]?.label || post.category}\nChannel: ${PLATFORM_CONFIG[post.platform]?.label || post.platform}\n\n${post.content}${post.external_link ? `\n\n🔗 Link: ${post.external_link}` : ''}`;
    navigator.clipboard.writeText(pitch);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredPosts = marketingPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.target_audience && post.target_audience.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '22px 26px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #db2777, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(219,39,119,0.25)' }}>
                <Megaphone size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#111827', fontWeight: 700 }}>
                  Marketing Updates, Campaigns & Promotional Bulletins
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
                  Live broadcast stream of all marketing drives, webinars, fee waivers, and social campaigns. Shared across Marketing, Admissions, and Counseling.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: '#ecfdf5', color: '#059669', fontWeight: 600, border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Radio size={12} className="animate-pulse" /> Live Realtime Sync
            </span>

            {allowCreate && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.78rem', padding: '8px 14px' }}
              >
                <Plus size={14} /> Publish New Marketing Post
              </button>
            )}
          </div>
        </div>

        {/* Filter / Search Controls */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search marketing campaign, webinar, waiver, keyword..."
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

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {['all', 'campaign', 'webinar', 'fee_waiver', 'scholarship_drive', 'announcement', 'social_ad'].map(catKey => {
              const label = catKey === 'all' ? 'All Updates' : CATEGORY_CONFIG[catKey as MarketingPostCategory]?.label;
              const isSelected = selectedCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: isSelected ? '1px solid #db2777' : '1px solid #e5e7eb',
                    background: isSelected ? '#db2777' : '#fff',
                    color: isSelected ? '#fff' : '#4b5563',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feed List */}
      {filteredPosts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: '#9ca3af', borderRadius: '12px' }}>
          <Megaphone size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h4 style={{ margin: 0, color: '#374151', fontSize: '0.95rem' }}>No Marketing Posts Found</h4>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or category filter.'
              : allowCreate
                ? 'Click "Publish New Marketing Post" above to post your first marketing update!'
                : 'Marketing department has not published any active updates yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredPosts.map(post => {
            const catStyle = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.campaign;
            const platformStyle = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.all;
            const isCopied = copiedId === post.id;
            const dateFormatted = new Date(post.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={post.id}
                style={{
                  borderRadius: '12px',
                  border: `1px solid ${catStyle.border}`,
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                {/* Card Top */}
                <div style={{ padding: '18px' }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '12px', background: catStyle.bg, color: catStyle.color, fontWeight: 700, border: `1px solid ${catStyle.border}` }}>
                        {catStyle.label}
                      </span>
                      <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '12px', background: '#f3f4f6', color: '#374151', fontWeight: 600 }}>
                        {platformStyle.icon} {platformStyle.label}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{dateFormatted}</span>
                  </div>

                  {/* Title & Audience */}
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', color: '#111827', fontWeight: 700 }}>
                    {post.title}
                  </h4>

                  {post.target_audience && (
                    <div style={{ fontSize: '0.72rem', color: '#d97706', marginBottom: '8px', fontWeight: 600 }}>
                      🎯 Audience: {post.target_audience}
                    </div>
                  )}

                  {/* Body Content */}
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4b5563', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {post.content}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} />
                    <span>Posted by {post.author_name} ({post.author_role})</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {post.external_link && (
                      <a
                        href={post.external_link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                      >
                        <ExternalLink size={12} /> Link
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyPitch(post)}
                      style={{
                        fontSize: '0.72rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: isCopied ? '#ecfdf5' : '#fff',
                        color: isCopied ? '#059669' : '#374151',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}
                    >
                      {isCopied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                      {isCopied ? 'Copied' : 'Copy Pitch'}
                    </button>

                    {allowCreate && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          color: '#dc2626',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Delete marketing post"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Marketing Post */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '560px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} color="#db2777" />
                Publish Marketing Update / Campaign
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.78rem', marginBottom: '12px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  Campaign / Bulletin Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 50% Application Fee Waiver Drive for September 2026 Intake"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as MarketingPostCategory)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <option value="campaign">General Campaign</option>
                    <option value="webinar">Global Webinar</option>
                    <option value="fee_waiver">Fee Waiver Alert</option>
                    <option value="scholarship_drive">Scholarship Drive</option>
                    <option value="announcement">Marketing Bulletin</option>
                    <option value="social_ad">Social Ad Campaign</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Platform / Channel *
                  </label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value as MarketingPostPlatform)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem', background: '#fff' }}
                  >
                    <option value="all">🌐 All Channels</option>
                    <option value="facebook">📘 Facebook</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="tiktok">🎵 TikTok</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="general">📢 Website / Portal</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  Target Audience (Optional)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  placeholder="e.g. STEM applicants from Nigeria, Ghana, Kenya"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  External Link / Registration URL (Optional)
                </label>
                <input
                  type="url"
                  value={externalLink}
                  onChange={e => setExternalLink(e.target.value)}
                  placeholder="e.g. https://meet.google.com/xyz or https://instagram.com/p/123"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                  Post Message / Offer Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Describe the campaign, promo offer, waiver code, webinar date/time, or requirements so Admissions and Counseling staff have exact details when talking to students..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.82rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#db2777', borderColor: '#db2777' }}
                >
                  {submitting ? 'Publishing...' : '🚀 Broadcast & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
