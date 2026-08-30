import React, { useState, useEffect } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { Layout, Eye, Save, Globe2, CheckCircle2, FileText, Settings, Award } from 'lucide-react';

export const LandingPageCms: React.FC = () => {
  const { landingPageSettings, updateLandingPageSettings } = useApplication();

  // Local Form State
  const [heroEyebrow, setHeroEyebrow] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSpan, setHeroSpan] = useState('');
  const [heroDescription, setHeroDescription] = useState('');

  const [trustPoint1, setTrustPoint1] = useState('');
  const [trustPoint2, setTrustPoint2] = useState('');
  const [trustPoint3, setTrustPoint3] = useState('');

  const [cardLabel, setCardLabel] = useState('');
  const [cardTitle, setCardTitle] = useState('');

  const [step1Title, setStep1Title] = useState('');
  const [step1Description, setStep1Description] = useState('');
  const [step2Title, setStep2Title] = useState('');
  const [step2Description, setStep2Description] = useState('');
  const [step3Title, setStep3Title] = useState('');
  const [step3Description, setStep3Description] = useState('');

  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'pillars' | 'steps' | 'story'>('hero');

  // Initialize fields when landingPageSettings is loaded
  useEffect(() => {
    if (landingPageSettings) {
      setHeroEyebrow(landingPageSettings.hero_eyebrow || '');
      setHeroTitle(landingPageSettings.hero_title || '');
      setHeroSpan(landingPageSettings.hero_span || '');
      setHeroDescription(landingPageSettings.hero_description || '');

      setTrustPoint1(landingPageSettings.trust_point_1 || '');
      setTrustPoint2(landingPageSettings.trust_point_2 || '');
      setTrustPoint3(landingPageSettings.trust_point_3 || '');

      setCardLabel(landingPageSettings.card_label || '');
      setCardTitle(landingPageSettings.card_title || '');

      setStep1Title(landingPageSettings.step_1_title || '');
      setStep1Description(landingPageSettings.step_1_description || '');
      setStep2Title(landingPageSettings.step_2_title || '');
      setStep2Description(landingPageSettings.step_2_description || '');
      setStep3Title(landingPageSettings.step_3_title || '');
      setStep3Description(landingPageSettings.step_3_description || '');

      setStoryTitle(landingPageSettings.story_title || '');
      setStoryDescription(landingPageSettings.story_description || '');
    }
  }, [landingPageSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setErrorMsg('');

    try {
      await updateLandingPageSettings({
        hero_eyebrow: heroEyebrow.trim(),
        hero_title: heroTitle.trim(),
        hero_span: heroSpan.trim(),
        hero_description: heroDescription.trim(),
        trust_point_1: trustPoint1.trim(),
        trust_point_2: trustPoint2.trim(),
        trust_point_3: trustPoint3.trim(),
        card_label: cardLabel.trim(),
        card_title: cardTitle.trim(),
        step_1_title: step1Title.trim(),
        step_1_description: step1Description.trim(),
        step_2_title: step2Title.trim(),
        step_2_description: step2Description.trim(),
        step_3_title: step3Title.trim(),
        step_3_description: step3Description.trim(),
        story_title: storyTitle.trim(),
        story_description: storyDescription.trim()
      });
      setMessage('Landing page settings updated successfully! Changes are live.');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update landing page copy.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
      
      {/* Editor Panel */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
          <Settings style={{ color: '#2563eb' }} />
          <h2 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
            Landing Page Customization & CMS
          </h2>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '20px' }}>
          Modify headers, pillars, descriptions, and timelines on the public landing page. Use the preview on the right to see exactly how changes appear before saving.
        </p>

        {message && (
          <div role="status" style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.08)', border: '1px solid rgba(5, 150, 105, 0.25)', color: '#059669', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
            🎉 {message}
          </div>
        )}

        {errorMsg && (
          <div role="alert" style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginBottom: '16px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* CMS Sub Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '16px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('hero')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: activeSubTab === 'hero' ? '#2563eb' : '#64748b',
              borderBottom: activeSubTab === 'hero' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Hero Section
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('pillars')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: activeSubTab === 'pillars' ? '#2563eb' : '#64748b',
              borderBottom: activeSubTab === 'pillars' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Trust Pillars
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('steps')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: activeSubTab === 'steps' ? '#2563eb' : '#64748b',
              borderBottom: activeSubTab === 'steps' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Journey Card
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('story')}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: activeSubTab === 'story' ? '#2563eb' : '#64748b',
              borderBottom: activeSubTab === 'story' ? '2px solid #2563eb' : 'none',
              cursor: 'pointer',
              marginBottom: '-2px'
            }}
          >
            Our Story
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Group 1: Hero Settings */}
          {activeSubTab === 'hero' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Hero Eyebrow Text</label>
                <input type="text" required value={heroEyebrow} onChange={e => setHeroEyebrow(e.target.value)} placeholder="e.g. International education guidance" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Hero Main Title Prefix</label>
                  <input type="text" required value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="e.g. Your next chapter deserves a " style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Highlight Title Span</label>
                  <input type="text" required value={heroSpan} onChange={e => setHeroSpan(e.target.value)} placeholder="e.g. clearer path." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Hero Paragraph Description</label>
                <textarea required rows={4} value={heroDescription} onChange={e => setHeroDescription(e.target.value)} placeholder="Enter the main intro description..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.8rem', resize: 'vertical' }} />
              </div>
            </div>
          )}

          {/* Group 2: Trust Pillars */}
          {activeSubTab === 'pillars' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Trust Point #1 Title</label>
                <input type="text" required value={trustPoint1} onChange={e => setTrustPoint1(e.target.value)} placeholder="e.g. Clear requirements" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Trust Point #2 Title</label>
                <input type="text" required value={trustPoint2} onChange={e => setTrustPoint2(e.target.value)} placeholder="e.g. Progress you can follow" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Trust Point #3 Title</label>
                <input type="text" required value={trustPoint3} onChange={e => setTrustPoint3(e.target.value)} placeholder="e.g. Department-led support" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
              </div>
            </div>
          )}

          {/* Group 3: Timeline Steps */}
          {activeSubTab === 'steps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Card Label Tag</label>
                  <input type="text" required value={cardLabel} onChange={e => setCardLabel(e.target.value)} placeholder="e.g. One accountable journey" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Card Heading Title</label>
                  <input type="text" required value={cardTitle} onChange={e => setCardTitle(e.target.value)} placeholder="e.g. See exactly where your application stands." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc', marginTop: '4px' }}>
                <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '10px' }}>Step 1 Config</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={step1Title} onChange={e => setStep1Title(e.target.value)} placeholder="Step 1 Title" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <input type="text" required value={step1Description} onChange={e => setStep1Description(e.target.value)} placeholder="Step 1 Description" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '10px' }}>Step 2 Config</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={step2Title} onChange={e => setStep2Title(e.target.value)} placeholder="Step 2 Title" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <input type="text" required value={step2Description} onChange={e => setStep2Description(e.target.value)} placeholder="Step 2 Description" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '10px' }}>Step 3 Config</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={step3Title} onChange={e => setStep3Title(e.target.value)} placeholder="Step 3 Title" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <input type="text" required value={step3Description} onChange={e => setStep3Description(e.target.value)} placeholder="Step 3 Description" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                </div>
              </div>
            </div>
          )}

          {/* Group 4: Our Story Section */}
          {activeSubTab === 'story' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Story Heading</label>
                <input type="text" required value={storyTitle} onChange={e => setStoryTitle(e.target.value)} placeholder="e.g. Built around a simple belief: students deserve clarity." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Story Description Copy</label>
                <textarea required rows={5} value={storyDescription} onChange={e => setStoryDescription(e.target.value)} placeholder="Enter the main story section description..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#fff', fontSize: '0.8rem', resize: 'vertical' }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px', background: '#2563eb', border: 'none' }}
          >
            <Save size={16} />
            {isSubmitting ? 'Saving & Publishing...' : 'Save & Publish Changes'}
          </button>
        </form>
      </div>

      {/* Real-time Preview Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', background: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px' }}>
            <Eye size={15} /> SIMULATED REAL-TIME PREVIEW
          </div>

          {/* Landing Mockup Structure */}
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', color: '#1e293b', border: '1px solid #cbd5e1' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0f172a' }}>GlobeScholars</span>
              <span style={{ fontSize: '0.6rem', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px' }}>Sign in</span>
            </div>

            {/* Simulated Hero Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '120px' }}>
              <span style={{ fontSize: '0.52rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Globe2 size={8} /> {heroEyebrow || 'Eyebrow Text'}
              </span>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 850, color: '#0f172a', margin: '4px 0', lineHeight: 1.2 }}>
                {heroTitle || 'Your title '}
                <span style={{ color: '#2563eb' }}>{heroSpan || 'highlighted text.'}</span>
              </h1>
              <p style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.4, margin: '2px 0 6px' }}>
                {heroDescription || 'Hero description paragraph goes here.'}
              </p>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '0.55rem', color: '#166534', background: '#dcfce7', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={8} /> {trustPoint1 || 'Strength 1'}
                </span>
                <span style={{ fontSize: '0.55rem', color: '#166534', background: '#dcfce7', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={8} /> {trustPoint2 || 'Strength 2'}
                </span>
                <span style={{ fontSize: '0.55rem', color: '#166534', background: '#dcfce7', padding: '3px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={8} /> {trustPoint3 || 'Strength 3'}
                </span>
              </div>
            </div>

            {/* Simulated Side card timeline */}
            <div style={{ marginTop: '16px', background: '#0f172a', padding: '12px', borderRadius: '8px', color: '#f8fafc' }}>
              <span style={{ fontSize: '0.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>{cardLabel || 'Card Label'}</span>
              <h3 style={{ fontSize: '0.72rem', color: '#ffffff', margin: '2px 0 8px', fontWeight: 700 }}>{cardTitle || 'Card Title'}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.58rem' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontWeight: 700 }}>1</span>
                  <div>
                    <strong>{step1Title || 'Step 1'}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.5rem' }}>{step1Description || 'desc'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontWeight: 700 }}>2</span>
                  <div>
                    <strong>{step2Title || 'Step 2'}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.5rem' }}>{step2Description || 'desc'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '4px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', fontWeight: 700 }}>3</span>
                  <div>
                    <strong>{step3Title || 'Step 3'}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.5rem' }}>{step3Description || 'desc'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Story Section */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.52rem', color: '#475569', fontWeight: 750 }}>OUR STORY</span>
              <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>{storyTitle || 'Story Heading'}</h4>
              <p style={{ fontSize: '0.55rem', color: '#64748b', lineHeight: 1.3 }}>
                {storyDescription || 'Story text...'}
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
