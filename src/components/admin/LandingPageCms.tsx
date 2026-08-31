import React, { useState, useEffect } from 'react';
import { useApplication } from '../../context/ApplicationContext';
import { compressImageToAvatar } from '../../lib/image-utils';
import { Settings, Save, Eye, Globe2, CheckCircle2, ShieldCheck, UsersRound, GraduationCap, Quote, Upload, Trash2, User } from 'lucide-react';

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

  // Value guides
  const [valueHeader, setValueHeader] = useState('');
  const [value1Title, setValue1Title] = useState('');
  const [value1Description, setValue1Description] = useState('');
  const [value2Title, setValue2Title] = useState('');
  const [value2Description, setValue2Description] = useState('');
  const [value3Title, setValue3Title] = useState('');
  const [value3Description, setValue3Description] = useState('');

  // Student stories
  const [storiesTitle, setStoriesTitle] = useState('');
  const [storiesDescription, setStoriesDescription] = useState('');
  const [story1Quote, setStory1Quote] = useState('');
  const [story1Name, setStory1Name] = useState('');
  const [story1Pathway, setStory1Pathway] = useState('');
  const [story1ImageUrl, setStory1ImageUrl] = useState<string>('');

  const [story2Quote, setStory2Quote] = useState('');
  const [story2Name, setStory2Name] = useState('');
  const [story2Pathway, setStory2Pathway] = useState('');
  const [story2ImageUrl, setStory2ImageUrl] = useState<string>('');

  const [story3Quote, setStory3Quote] = useState('');
  const [story3Name, setStory3Name] = useState('');
  const [story3Pathway, setStory3Pathway] = useState('');
  const [story3ImageUrl, setStory3ImageUrl] = useState<string>('');

  // Leadership
  const [leadershipTitle, setLeadershipTitle] = useState('');
  const [leadershipDescription, setLeadershipDescription] = useState('');
  const [leader1Role, setLeader1Role] = useState('');
  const [leader1Focus, setLeader1Focus] = useState('');
  const [leader1ImageUrl, setLeader1ImageUrl] = useState<string>('');

  const [leader2Role, setLeader2Role] = useState('');
  const [leader2Focus, setLeader2Focus] = useState('');
  const [leader2ImageUrl, setLeader2ImageUrl] = useState<string>('');

  const [leader3Role, setLeader3Role] = useState('');
  const [leader3Focus, setLeader3Focus] = useState('');
  const [leader3ImageUrl, setLeader3ImageUrl] = useState<string>('');

  const [leader4Role, setLeader4Role] = useState('');
  const [leader4Focus, setLeader4Focus] = useState('');
  const [leader4ImageUrl, setLeader4ImageUrl] = useState<string>('');

  // Footer copy
  const [footerCopy, setFooterCopy] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'values' | 'steps' | 'story' | 'stories' | 'leadership'>('hero');

  // Helper for image uploads with client-side compression
  const handleImageFileChange = async (
    file: File,
    setter: (url: string) => void
  ) => {
    try {
      const { dataUrl } = await compressImageToAvatar(file, 80 * 1024);
      setter(dataUrl);
    } catch (err) {
      console.warn('Compression failed, falling back to direct reader:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

      // Value guides
      setValueHeader(landingPageSettings.value_header || 'What guides our work');
      setValue1Title(landingPageSettings.value_1_title || 'Ethical guidance');
      setValue1Description(landingPageSettings.value_1_description || 'Advice, requirements, and decisions are explained clearly and handled with care.');
      setValue2Title(landingPageSettings.value_2_title || 'Human support');
      setValue2Description(landingPageSettings.value_2_description || 'Students are supported by real people and accountable departments, not left to navigate alone.');
      setValue3Title(landingPageSettings.value_3_title || 'Student-first outcomes');
      setValue3Description(landingPageSettings.value_3_description || 'Every recommendation begins with the student’s academic goals, readiness, and long-term success.');

      // Testimonials (Student Stories)
      setStoriesTitle(landingPageSettings.stories_title || 'Guidance that students can feel at every stage.');
      setStoriesDescription(landingPageSettings.stories_description || 'Our process is designed to replace uncertainty with clear action, trusted support, and timely updates.');
      setStory1Quote(landingPageSettings.story_1_quote || 'Every requirement was clear, and I always knew which step came next. That confidence made a difficult process feel manageable.');
      setStory1Name(landingPageSettings.story_1_name || 'Postgraduate applicant');
      setStory1Pathway(landingPageSettings.story_1_pathway || 'United Kingdom pathway');
      setStory1ImageUrl(landingPageSettings.story_1_image_url || '');

      setStory2Quote(landingPageSettings.story_2_quote || 'My counselor listened to my goals before recommending options. I felt supported from the first conversation through submission.');
      setStory2Name(landingPageSettings.story_2_name || 'Undergraduate applicant');
      setStory2Pathway(landingPageSettings.story_2_pathway || 'International study pathway');
      setStory2ImageUrl(landingPageSettings.story_2_image_url || '');

      setStory3Quote(landingPageSettings.story_3_quote || 'The updates were practical and timely. I could see my progress without having to chase several different people for answers.');
      setStory3Name(landingPageSettings.story_3_name || 'Graduate applicant');
      setStory3Pathway(landingPageSettings.story_3_pathway || 'North America pathway');
      setStory3ImageUrl(landingPageSettings.story_3_image_url || '');

      // Leadership
      setLeadershipTitle(landingPageSettings.leadership_title || 'Experienced leadership. Shared accountability.');
      setLeadershipDescription(landingPageSettings.leadership_description || 'Our leadership team sets the standards for student care, operational quality, and responsible international education guidance.');
      setLeader1Role(landingPageSettings.leader_1_role || 'Founder & Chief Executive Officer');
      setLeader1Focus(landingPageSettings.leader_1_focus || 'Sets the organisation’s strategy and long-term commitment to ethical, student-first guidance.');
      setLeader1ImageUrl(landingPageSettings.leader_1_image_url || '');

      setLeader2Role(landingPageSettings.leader_2_role || 'Co-founder & Chief Operating Officer');
      setLeader2Focus(landingPageSettings.leader_2_focus || 'Leads service quality, operational accountability, and the experience students receive at every stage.');
      setLeader2ImageUrl(landingPageSettings.leader_2_image_url || '');

      setLeader3Role(landingPageSettings.leader_3_role || 'Director of Admissions');
      setLeader3Focus(landingPageSettings.leader_3_focus || 'Oversees application quality, eligibility review, and clear communication with partner institutions.');
      setLeader3ImageUrl(landingPageSettings.leader_3_image_url || '');

      setLeader4Role(landingPageSettings.leader_4_role || 'Director of Student Success');
      setLeader4Focus(landingPageSettings.leader_4_focus || 'Builds the support model that helps students move confidently from planning to enrolment.');
      setLeader4ImageUrl(landingPageSettings.leader_4_image_url || '');

      // Footer
      setFooterCopy(landingPageSettings.footer_copy || '© 2026 Globe Scholars Pathways, LLC. Student guidance with purpose.');
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
        story_description: storyDescription.trim(),

        value_header: valueHeader.trim(),
        value_1_title: value1Title.trim(),
        value_1_description: value1Description.trim(),
        value_2_title: value2Title.trim(),
        value_2_description: value2Description.trim(),
        value_3_title: value3Title.trim(),
        value_3_description: value3Description.trim(),

        stories_title: storiesTitle.trim(),
        stories_description: storiesDescription.trim(),
        story_1_quote: story1Quote.trim(),
        story_1_name: story1Name.trim(),
        story_1_pathway: story1Pathway.trim(),
        story_1_image_url: story1ImageUrl || null,
        story_2_quote: story2Quote.trim(),
        story_2_name: story2Name.trim(),
        story_2_pathway: story2Pathway.trim(),
        story_2_image_url: story2ImageUrl || null,
        story_3_quote: story3Quote.trim(),
        story_3_name: story3Name.trim(),
        story_3_pathway: story3Pathway.trim(),
        story_3_image_url: story3ImageUrl || null,

        leadership_title: leadershipTitle.trim(),
        leadership_description: leadershipDescription.trim(),
        leader_1_role: leader1Role.trim(),
        leader_1_focus: leader1Focus.trim(),
        leader_1_image_url: leader1ImageUrl || null,
        leader_2_role: leader2Role.trim(),
        leader_2_focus: leader2Focus.trim(),
        leader_2_image_url: leader2ImageUrl || null,
        leader_3_role: leader3Role.trim(),
        leader_3_focus: leader3Focus.trim(),
        leader_3_image_url: leader3ImageUrl || null,
        leader_4_role: leader4Role.trim(),
        leader_4_focus: leader4Focus.trim(),
        leader_4_image_url: leader4ImageUrl || null,

        footer_copy: footerCopy.trim()
      });
      setMessage('Landing page settings and photos updated successfully! Changes are live.');
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
          Modify copy, student testimonial photos, leadership headshots, and values on the public landing page. Use the real-time preview on the right.
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
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { id: 'hero', label: 'Hero Copy' },
            { id: 'steps', label: 'Timeline Card' },
            { id: 'story', label: 'Our Story' },
            { id: 'values', label: 'Trust Values' },
            { id: 'stories', label: 'Student Stories & Photos' },
            { id: 'leadership', label: 'Leaders & Headshots' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              style={{
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: activeSubTab === tab.id ? '#2563eb' : '#64748b',
                borderBottom: activeSubTab === tab.id ? '2px solid #2563eb' : 'none',
                cursor: 'pointer',
                marginBottom: '-2px'
              }}
            >
              {tab.label}
            </button>
          ))}
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
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '4px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', marginBottom: '10px' }}>Core Trust Pillars (Below Hero)</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={trustPoint1} onChange={e => setTrustPoint1(e.target.value)} placeholder="Trust point 1" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  <input type="text" required value={trustPoint2} onChange={e => setTrustPoint2(e.target.value)} placeholder="Trust point 2" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                  <input type="text" required value={trustPoint3} onChange={e => setTrustPoint3(e.target.value)} placeholder="Trust point 3" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
            </div>
          )}

          {/* Group 2: Timeline Steps */}
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

          {/* Group 3: Our Story Section */}
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

          {/* Group 4: Trust Values guides */}
          {activeSubTab === 'values' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Values Panel Header</label>
                <input type="text" required value={valueHeader} onChange={e => setValueHeader(e.target.value)} placeholder="e.g. What guides our work" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '8px' }}>Value 1 (Ethical Guidance)</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={value1Title} onChange={e => setValue1Title(e.target.value)} placeholder="Value 1 Title" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <textarea required rows={2} value={value1Description} onChange={e => setValue1Description(e.target.value)} placeholder="Value 1 Description" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '8px' }}>Value 2 (Human Support)</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={value2Title} onChange={e => setValue2Title(e.target.value)} placeholder="Value 2 Title" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <textarea required rows={2} value={value2Description} onChange={e => setValue2Description(e.target.value)} placeholder="Value 2 Description" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '8px' }}>Value 3 (Student-first Outcomes)</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input type="text" required value={value3Title} onChange={e => setValue3Title(e.target.value)} placeholder="Value 3 Title" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <textarea required rows={2} value={value3Description} onChange={e => setValue3Description(e.target.value)} placeholder="Value 3 Description" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>
              </div>
            </div>
          )}

          {/* Group 5: Student Stories & Photos */}
          {activeSubTab === 'stories' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Stories Section Title</label>
                  <input type="text" required value={storiesTitle} onChange={e => setStoriesTitle(e.target.value)} placeholder="Stories Section Title" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Stories Section Description</label>
                  <input type="text" required value={storiesDescription} onChange={e => setStoriesDescription(e.target.value)} placeholder="Stories Section Description" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              {/* Student 1 Card */}
              <div style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '10px', background: '#f8fafc', marginTop: '4px' }}>
                <strong style={{ fontSize: '0.8rem', color: '#2563eb', display: 'block', marginBottom: '10px' }}>Testimonial #1 Profile & Quote</strong>
                
                {/* Photo selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #cbd5e1', flexShrink: 0 }}>
                    {story1ImageUrl ? (
                      <img src={story1ImageUrl} alt="Student 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={22} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', padding: '5px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#1e293b' }}>
                      <Upload size={12} /> Upload Student Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setStory1ImageUrl); }} />
                    </label>
                    {story1ImageUrl && (
                      <button type="button" onClick={() => setStory1ImageUrl('')} style={{ marginLeft: '8px', fontSize: '0.72rem', padding: '5px 8px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea required rows={2} value={story1Quote} onChange={e => setStory1Quote(e.target.value)} placeholder="Quote text" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="text" required value={story1Name} onChange={e => setStory1Name(e.target.value)} placeholder="Applicant label / Name" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                    <input type="text" required value={story1Pathway} onChange={e => setStory1Pathway(e.target.value)} placeholder="Study pathway location" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  </div>
                </div>
              </div>

              {/* Student 2 Card */}
              <div style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '10px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.8rem', color: '#2563eb', display: 'block', marginBottom: '10px' }}>Testimonial #2 Profile & Quote</strong>
                
                {/* Photo selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #cbd5e1', flexShrink: 0 }}>
                    {story2ImageUrl ? (
                      <img src={story2ImageUrl} alt="Student 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={22} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', padding: '5px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#1e293b' }}>
                      <Upload size={12} /> Upload Student Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setStory2ImageUrl); }} />
                    </label>
                    {story2ImageUrl && (
                      <button type="button" onClick={() => setStory2ImageUrl('')} style={{ marginLeft: '8px', fontSize: '0.72rem', padding: '5px 8px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea required rows={2} value={story2Quote} onChange={e => setStory2Quote(e.target.value)} placeholder="Quote text" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="text" required value={story2Name} onChange={e => setStory2Name(e.target.value)} placeholder="Applicant label / Name" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                    <input type="text" required value={story2Pathway} onChange={e => setStory2Pathway(e.target.value)} placeholder="Study pathway location" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  </div>
                </div>
              </div>

              {/* Student 3 Card */}
              <div style={{ border: '1px solid #cbd5e1', padding: '14px', borderRadius: '10px', background: '#f8fafc' }}>
                <strong style={{ fontSize: '0.8rem', color: '#2563eb', display: 'block', marginBottom: '10px' }}>Testimonial #3 Profile & Quote</strong>
                
                {/* Photo selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #cbd5e1', flexShrink: 0 }}>
                    {story3ImageUrl ? (
                      <img src={story3ImageUrl} alt="Student 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={22} color="#94a3b8" />
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', padding: '5px 10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#1e293b' }}>
                      <Upload size={12} /> Upload Student Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setStory3ImageUrl); }} />
                    </label>
                    {story3ImageUrl && (
                      <button type="button" onClick={() => setStory3ImageUrl('')} style={{ marginLeft: '8px', fontSize: '0.72rem', padding: '5px 8px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea required rows={2} value={story3Quote} onChange={e => setStory3Quote(e.target.value)} placeholder="Quote text" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input type="text" required value={story3Name} onChange={e => setStory3Name(e.target.value)} placeholder="Applicant label / Name" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                    <input type="text" required value={story3Pathway} onChange={e => setStory3Pathway(e.target.value)} placeholder="Study pathway location" style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Group 6: Leadership and Footer */}
          {activeSubTab === 'leadership' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Leadership Title</label>
                <input type="text" required value={leadershipTitle} onChange={e => setLeadershipTitle(e.target.value)} placeholder="Leadership section heading" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Leadership Description</label>
                <textarea required rows={2} value={leadershipDescription} onChange={e => setLeadershipDescription(e.target.value)} placeholder="Leadership section subtext paragraph" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                
                {/* Leader 1 */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '6px' }}>Leader 1</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {leader1ImageUrl ? (
                        <img src={leader1ImageUrl} alt="Leader 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UsersRound size={18} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '3px 7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>
                        <Upload size={10} /> Photo
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setLeader1ImageUrl); }} />
                      </label>
                      {leader1ImageUrl && (
                        <button type="button" onClick={() => setLeader1ImageUrl('')} style={{ marginLeft: '4px', fontSize: '0.68rem', padding: '3px 5px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '5px', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input type="text" required value={leader1Role} onChange={e => setLeader1Role(e.target.value)} placeholder="Role Name" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '6px' }} />
                  <textarea required rows={3} value={leader1Focus} onChange={e => setLeader1Focus(e.target.value)} placeholder="Focus context description" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>

                {/* Leader 2 */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '6px' }}>Leader 2</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {leader2ImageUrl ? (
                        <img src={leader2ImageUrl} alt="Leader 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UsersRound size={18} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '3px 7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>
                        <Upload size={10} /> Photo
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setLeader2ImageUrl); }} />
                      </label>
                      {leader2ImageUrl && (
                        <button type="button" onClick={() => setLeader2ImageUrl('')} style={{ marginLeft: '4px', fontSize: '0.68rem', padding: '3px 5px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '5px', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input type="text" required value={leader2Role} onChange={e => setLeader2Role(e.target.value)} placeholder="Role Name" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '6px' }} />
                  <textarea required rows={3} value={leader2Focus} onChange={e => setLeader2Focus(e.target.value)} placeholder="Focus context description" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>

                {/* Leader 3 */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '6px' }}>Leader 3</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {leader3ImageUrl ? (
                        <img src={leader3ImageUrl} alt="Leader 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UsersRound size={18} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '3px 7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>
                        <Upload size={10} /> Photo
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setLeader3ImageUrl); }} />
                      </label>
                      {leader3ImageUrl && (
                        <button type="button" onClick={() => setLeader3ImageUrl('')} style={{ marginLeft: '4px', fontSize: '0.68rem', padding: '3px 5px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '5px', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input type="text" required value={leader3Role} onChange={e => setLeader3Role(e.target.value)} placeholder="Role Name" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '6px' }} />
                  <textarea required rows={3} value={leader3Focus} onChange={e => setLeader3Focus(e.target.value)} placeholder="Focus context description" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>

                {/* Leader 4 */}
                <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', background: '#f8fafc' }}>
                  <strong style={{ fontSize: '0.78rem', color: '#2563eb', display: 'block', marginBottom: '6px' }}>Leader 4</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px dashed #cbd5e1' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      {leader4ImageUrl ? (
                        <img src={leader4ImageUrl} alt="Leader 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <UsersRound size={18} color="#94a3b8" />
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', padding: '3px 7px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '5px', cursor: 'pointer', fontWeight: 600 }}>
                        <Upload size={10} /> Photo
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFileChange(f, setLeader4ImageUrl); }} />
                      </label>
                      {leader4ImageUrl && (
                        <button type="button" onClick={() => setLeader4ImageUrl('')} style={{ marginLeft: '4px', fontSize: '0.68rem', padding: '3px 5px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '5px', color: '#dc2626', cursor: 'pointer' }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <input type="text" required value={leader4Role} onChange={e => setLeader4Role(e.target.value)} placeholder="Role Name" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', marginBottom: '6px' }} />
                  <textarea required rows={3} value={leader4Focus} onChange={e => setLeader4Focus(e.target.value)} placeholder="Focus context description" style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem', resize: 'vertical' }} />
                </div>

              </div>

              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', marginTop: '6px' }}>
                <label style={{ fontSize: '0.75rem', color: '#475569', display: 'block', marginBottom: '4px', fontWeight: 650 }}>Copyright Info Footer Note</label>
                <input type="text" required value={footerCopy} onChange={e => setFooterCopy(e.target.value)} placeholder="e.g. © 2026 Globe Scholars Pathways, LLC." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
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
          <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', color: '#1e293b', border: '1px solid #cbd5e1', maxHeight: '650px', overflowY: 'auto' }}>
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0f172a' }}>GlobeScholars</span>
              <span style={{ fontSize: '0.6rem', color: '#64748b', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px' }}>Sign in</span>
            </div>

            {/* Simulated Hero Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

            {/* Simulated Story & Values Section */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.52rem', color: '#475569', fontWeight: 750 }}>OUR STORY</span>
                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>{storyTitle || 'Story Heading'}</h4>
                <p style={{ fontSize: '0.55rem', color: '#64748b', lineHeight: 1.3 }}>
                  {storyDescription || 'Story text...'}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.52rem', color: '#2563eb', fontWeight: 750 }}>{valueHeader}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontSize: '0.55rem' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.58rem' }}><ShieldCheck size={8} style={{ color: '#2563eb', marginRight: '3px' }} /> {value1Title}</strong>
                    <span style={{ color: '#64748b' }}>{value1Description}</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.58rem' }}><UsersRound size={8} style={{ color: '#2563eb', marginRight: '3px' }} /> {value2Title}</strong>
                    <span style={{ color: '#64748b' }}>{value2Description}</span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.58rem' }}><GraduationCap size={8} style={{ color: '#2563eb', marginRight: '3px' }} /> {value3Title}</strong>
                    <span style={{ color: '#64748b' }}>{value3Description}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Testimonials Stories with Photos */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.52rem', color: '#475569', fontWeight: 750 }}>TESTIMONIALS</span>
              <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>{storiesTitle}</h4>
              <p style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: '8px' }}>{storiesDescription}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', background: '#fff' }}>
                  <Quote size={8} style={{ color: '#2563eb', marginBottom: '2px' }} />
                  <p style={{ margin: '0 0 6px', fontSize: '0.52rem', fontStyle: 'italic', color: '#334155' }}>“{story1Quote}”</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {story1ImageUrl ? (
                      <img src={story1ImageUrl} alt={story1Name} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4rem', color: '#2563eb', fontWeight: 700 }}>
                        {story1Name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <span style={{ fontSize: '0.48rem', color: '#64748b' }}><strong>{story1Name}</strong> - {story1Pathway}</span>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', background: '#fff' }}>
                  <Quote size={8} style={{ color: '#2563eb', marginBottom: '2px' }} />
                  <p style={{ margin: '0 0 6px', fontSize: '0.52rem', fontStyle: 'italic', color: '#334155' }}>“{story2Quote}”</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {story2ImageUrl ? (
                      <img src={story2ImageUrl} alt={story2Name} style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.4rem', color: '#2563eb', fontWeight: 700 }}>
                        {story2Name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <span style={{ fontSize: '0.48rem', color: '#64748b' }}><strong>{story2Name}</strong> - {story2Pathway}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Leadership with Headshots */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.52rem', color: '#475569', fontWeight: 750 }}>LEADERSHIP</span>
              <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0f172a', margin: '3px 0' }}>{leadershipTitle}</h4>
              <p style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: '8px' }}>{leadershipDescription}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.5rem' }}>
                <div style={{ border: '1px solid #e2e8f0', padding: '6px', borderRadius: '6px', background: '#f8fafc' }}>
                  {leader1ImageUrl ? (
                    <img src={leader1ImageUrl} alt={leader1Role} style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover', marginBottom: '3px', display: 'block' }} />
                  ) : null}
                  <strong>{leader1Role}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.45rem', color: '#64748b' }}>{leader1Focus}</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', padding: '6px', borderRadius: '6px', background: '#f8fafc' }}>
                  {leader2ImageUrl ? (
                    <img src={leader2ImageUrl} alt={leader2Role} style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover', marginBottom: '3px', display: 'block' }} />
                  ) : null}
                  <strong>{leader2Role}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.45rem', color: '#64748b' }}>{leader2Focus}</p>
                </div>
              </div>
            </div>

            {/* Simulated Footer */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.48rem', color: '#94a3b8' }}>
              <strong>Globe Scholars Pathways, LLC.</strong>
              <span>{footerCopy}</span>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
