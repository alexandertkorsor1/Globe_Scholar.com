import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  GraduationCap,
  Quote,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import brandLogo from '../../brand-logo.jpg';

interface PublicLandingProps {
  onSignIn: () => void;
  onApply: () => void;
}

const studentStories = [
  {
    quote: 'Every requirement was clear, and I always knew which step came next. That confidence made a difficult process feel manageable.',
    name: 'Postgraduate applicant',
    pathway: 'United Kingdom pathway',
  },
  {
    quote: 'My counselor listened to my goals before recommending options. I felt supported from the first conversation through submission.',
    name: 'Undergraduate applicant',
    pathway: 'International study pathway',
  },
  {
    quote: 'The updates were practical and timely. I could see my progress without having to chase several different people for answers.',
    name: 'Graduate applicant',
    pathway: 'North America pathway',
  },
];

const leadership = [
  {
    role: 'Founder & Chief Executive Officer',
    focus: 'Sets the organisation’s strategy and long-term commitment to ethical, student-first guidance.',
  },
  {
    role: 'Co-founder & Chief Operating Officer',
    focus: 'Leads service quality, operational accountability, and the experience students receive at every stage.',
  },
  {
    role: 'Director of Admissions',
    focus: 'Oversees application quality, eligibility review, and clear communication with partner institutions.',
  },
  {
    role: 'Director of Student Success',
    focus: 'Builds the support model that helps students move confidently from planning to enrolment.',
  },
];

import { useApplication } from '../../context/ApplicationContext';

export const PublicLanding: React.FC<PublicLandingProps> = ({
  onSignIn,
  onApply,
}) => {
  const { landingPageSettings } = useApplication();

  const content = {
    hero_eyebrow: landingPageSettings?.hero_eyebrow || 'International education guidance',
    hero_title: landingPageSettings?.hero_title || 'Your next chapter deserves a ',
    hero_span: landingPageSettings?.hero_span || 'clearer path.',
    hero_description: landingPageSettings?.hero_description || 'Globe Scholars Pathways, LLC. brings students, counselors, admissions, and finance together in one transparent journey—from your first question to your final enrolment step.',
    trust_point_1: landingPageSettings?.trust_point_1 || 'Clear requirements',
    trust_point_2: landingPageSettings?.trust_point_2 || 'Progress you can follow',
    trust_point_3: landingPageSettings?.trust_point_3 || 'Department-led support',
    card_label: landingPageSettings?.card_label || 'One accountable journey',
    card_title: landingPageSettings?.card_title || 'See exactly where your application stands.',
    step_1_title: landingPageSettings?.step_1_title || 'Apply with confidence',
    step_1_description: landingPageSettings?.step_1_description || 'Guided documents and eligibility',
    step_2_title: landingPageSettings?.step_2_title || 'Receive expert review',
    step_2_description: landingPageSettings?.step_2_description || 'Counseling and admissions support',
    step_3_title: landingPageSettings?.step_3_title || 'Move forward prepared',
    step_3_description: landingPageSettings?.step_3_description || 'Clear decisions and next steps',
    story_title: landingPageSettings?.story_title || 'Built around a simple belief: students deserve clarity.',
    story_description: landingPageSettings?.story_description || 'Globe Scholars Pathways, LLC. was created to make international education guidance more personal, accountable, and easy to follow. Our team combines local understanding with a structured process, so each student receives the right support at the right time.',
    
    // Value guides
    value_header: landingPageSettings?.value_header || 'What guides our work',
    value_1_title: landingPageSettings?.value_1_title || 'Ethical guidance',
    value_1_description: landingPageSettings?.value_1_description || 'Advice, requirements, and decisions are explained clearly and handled with care.',
    value_2_title: landingPageSettings?.value_2_title || 'Human support',
    value_2_description: landingPageSettings?.value_2_description || 'Students are supported by real people and accountable departments, not left to navigate alone.',
    value_3_title: landingPageSettings?.value_3_title || 'Student-first outcomes',
    value_3_description: landingPageSettings?.value_3_description || 'Every recommendation begins with the student’s academic goals, readiness, and long-term success.',

    // Student stories
    stories_title: landingPageSettings?.stories_title || 'Guidance that students can feel at every stage.',
    stories_description: landingPageSettings?.stories_description || 'Our process is designed to replace uncertainty with clear action, trusted support, and timely updates.',
    story_1_quote: landingPageSettings?.story_1_quote || 'Every requirement was clear, and I always knew which step came next. That confidence made a difficult process feel manageable.',
    story_1_name: landingPageSettings?.story_1_name || 'Postgraduate applicant',
    story_1_pathway: landingPageSettings?.story_1_pathway || 'United Kingdom pathway',
    story_2_quote: landingPageSettings?.story_2_quote || 'My counselor listened to my goals before recommending options. I felt supported from the first conversation through submission.',
    story_2_name: landingPageSettings?.story_2_name || 'Undergraduate applicant',
    story_2_pathway: landingPageSettings?.story_2_pathway || 'International study pathway',
    story_3_quote: landingPageSettings?.story_3_quote || 'The updates were practical and timely. I could see my progress without having to chase several different people for answers.',
    story_3_name: landingPageSettings?.story_3_name || 'Graduate applicant',
    story_3_pathway: landingPageSettings?.story_3_pathway || 'North America pathway',
    story_1_image_url: landingPageSettings?.story_1_image_url || null,
    story_2_image_url: landingPageSettings?.story_2_image_url || null,
    story_3_image_url: landingPageSettings?.story_3_image_url || null,

    // Leadership
    leadership_title: landingPageSettings?.leadership_title || 'Experienced leadership. Shared accountability.',
    leadership_description: landingPageSettings?.leadership_description || 'Our leadership team sets the standards for student care, operational quality, and responsible international education guidance.',
    leader_1_role: landingPageSettings?.leader_1_role || 'Founder & Chief Executive Officer',
    leader_1_focus: landingPageSettings?.leader_1_focus || 'Sets the organisation’s strategy and long-term commitment to ethical, student-first guidance.',
    leader_1_image_url: landingPageSettings?.leader_1_image_url || null,
    leader_2_role: landingPageSettings?.leader_2_role || 'Co-founder & Chief Operating Officer',
    leader_2_focus: landingPageSettings?.leader_2_focus || 'Leads service quality, operational accountability, and the experience students receive at every stage.',
    leader_2_image_url: landingPageSettings?.leader_2_image_url || null,
    leader_3_role: landingPageSettings?.leader_3_role || 'Director of Admissions',
    leader_3_focus: landingPageSettings?.leader_3_focus || 'Oversees application quality, eligibility review, and clear communication with partner institutions.',
    leader_3_image_url: landingPageSettings?.leader_3_image_url || null,
    leader_4_role: landingPageSettings?.leader_4_role || 'Director of Student Success',
    leader_4_focus: landingPageSettings?.leader_4_focus || 'Builds the support model that helps students move confidently from planning to enrolment.',
    leader_4_image_url: landingPageSettings?.leader_4_image_url || null,

    // Footer
    footer_copy: landingPageSettings?.footer_copy || '© 2026 Globe Scholars Pathways, LLC. Student guidance with purpose.'
  };

  return (
    <main className="public-site">
      <style>{`
      .public-site { min-height: 100vh; background: #f7f9fc; color: #15213a; font-family: var(--font-body, Inter, Arial, sans-serif); }
      .public-shell { width: min(1160px, calc(100% - 40px)); margin: 0 auto; }
      .public-nav { height: 82px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
      .public-brand { display: inline-flex; align-items: center; color: #15213a; }
      .public-brand-logo { display:block; width: 225px; height: 88px; object-fit: contain; object-position: left center; }
      .public-nav-links { display: flex; align-items: center; gap: 24px; color: #52627b; font-size: .88rem; font-weight: 650; }
      .public-link { color: inherit; text-decoration: none; cursor: pointer; background: none; border: 0; font: inherit; }
      .public-signin { border: 1px solid #cbd5e1; background: #fff; color: #1e3a8a; padding: 10px 15px; border-radius: 9px; font-weight: 750; cursor: pointer; }
      .public-hero { padding: 68px 0 78px; overflow: hidden; }
      .public-hero-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr); align-items: center; gap: 64px; }
      .public-eyebrow { display: inline-flex; gap: 7px; align-items: center; padding: 7px 11px; background: #e8efff; color: #2856bd; border-radius: 999px; font-size: .76rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
      .public-hero h1 { margin: 18px 0; max-width: 700px; font: 800 clamp(2.45rem, 5.1vw, 4.55rem)/1.06 var(--font-heading, Inter, Arial, sans-serif); letter-spacing: -.05em; color: #13203a; }
      .public-hero h1 span { color: #2f62e8; }
      .public-lead { max-width: 620px; margin: 0; font-size: 1.09rem; line-height: 1.7; color: #5b6a81; }
      .public-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
      .public-primary { background: #2f62e8; color: #fff; border: 0; border-radius: 10px; padding: 13px 18px; font: 750 .93rem inherit; display: inline-flex; gap: 8px; align-items: center; cursor: pointer; box-shadow: 0 12px 22px rgba(47,98,232,.24); }
      .public-secondary { background: #fff; color: #1e3a8a; border: 1px solid #cbd5e1; border-radius: 10px; padding: 13px 18px; font: 750 .93rem inherit; cursor: pointer; }
      .public-trust { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 28px; color: #53627a; font-size: .78rem; font-weight: 650; }
      .public-trust span { display: inline-flex; gap: 6px; align-items: center; }
      .public-hero-card { position: relative; border-radius: 22px; padding: 28px; background: radial-gradient(circle at 82% 5%, #dae5ff 0, transparent 34%), #172d5d; color: #fff; box-shadow: 0 25px 60px rgba(34,63,130,.2); }
      .public-card-label { margin: 0; font-size: .74rem; color: #bfceff; text-transform: uppercase; letter-spacing: .08em; font-weight: 800; }
      .public-card-title { margin: 12px 0 25px; font: 750 1.42rem/1.3 var(--font-heading, Inter, Arial, sans-serif); }
      .public-route { display: grid; gap: 12px; }
      .public-route-row { display: grid; grid-template-columns: 32px 1fr auto; gap: 11px; align-items: center; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 12px; }
      .public-route-number { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 50%; background: #547cf2; font-weight: 800; font-size: .78rem; }
      .public-route-row strong { display:block; font-size:.84rem; }.public-route-row small { color:#c7d5ff; font-size:.71rem; }.public-route-row svg { color:#7ee0b1; }
      .public-section { padding: 86px 0; }.public-section-tint { background: #edf3ff; }
      .public-section-header { max-width: 700px; margin-bottom: 34px; }.public-section-header h2 { margin: 10px 0; color:#14213d; font: 800 clamp(1.8rem, 3vw, 2.65rem)/1.15 var(--font-heading, Inter, Arial, sans-serif); letter-spacing: -.035em; }.public-section-header p { margin:0; color:#607089; line-height:1.65; }
      .public-story-grid { display:grid; grid-template-columns: .85fr 1.15fr; gap:54px; align-items:center; }.public-story-panel { background:#fff; border:1px solid #dce5f5; padding:30px; border-radius:18px; box-shadow: 0 12px 30px rgba(47,70,120,.06); }.public-story-panel h3 { margin:0 0 13px; font-size:1.2rem; }.public-story-panel p { color:#53627a; line-height:1.65; margin:0 0 14px; }
      .public-values { display:grid; gap:15px; }.public-value { display:flex; align-items:flex-start; gap:12px; }.public-value-icon { margin-top:1px; width:33px; height:33px; flex:0 0 auto; display:grid; place-items:center; color:#2860d5; background:#e9f0ff; border-radius:9px; }.public-value strong { display:block; font-size:.9rem; margin-bottom:3px; }.public-value span { font-size:.8rem; color:#64748b; line-height:1.45; }
      .public-stories { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
      .public-quote { padding:24px; background:#fff; border:1px solid #dce5f5; border-radius:16px; display:flex; flex-direction:column; justify-content:space-between; }
      .public-quote svg { color:#4c75e8; }
      .public-quote blockquote { margin:15px 0 18px; color:#34445e; font-size:.91rem; line-height:1.65; flex:1; }
      .public-quote-footer { display:flex; align-items:center; gap:12px; border-top:1px solid #f1f5f9; padding-top:14px; margin-top:6px; }
      .public-quote-avatar { width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #cbd5e1; flex-shrink:0; }
      .public-quote-placeholder { width:42px; height:42px; border-radius:50%; background:#e8efff; color:#2856bd; display:grid; place-items:center; font-weight:750; font-size:.85rem; flex-shrink:0; }
      .public-quote-info strong { display:block; color:#243452; font-size:.84rem; margin-bottom:2px; }
      .public-quote-info span { display:block; color:#73829a; font-size:.76rem; }
      .public-leadership { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
      .public-leader { padding:22px; background:#fff; border:1px solid #dce5f5; border-radius:15px; }
      .public-leader-photo { width:52px; height:52px; border-radius:12px; object-fit:cover; margin-bottom:16px; border:2px solid #cbd5e1; display:block; box-shadow:0 4px 10px rgba(0,0,0,0.06); }
      .public-leader-mark { width:42px; height:42px; border-radius:10px; display:grid; place-items:center; margin-bottom:16px; background:#e7edff; color:#315ed4; }
      .public-leader h3 { margin:0 0 9px; font-size:.94rem; line-height:1.35; }
      .public-leader p { color:#66758c; line-height:1.55; font-size:.79rem; margin:0; }
      .public-cta { padding:62px 0; background:#182d5c; color:#fff; }.public-cta-grid { display:flex; align-items:center; justify-content:space-between; gap:24px; }.public-cta h2 { margin:0 0 8px; font:800 clamp(1.7rem,3vw,2.45rem)/1.15 var(--font-heading, Inter, Arial, sans-serif); }.public-cta p { margin:0; color:#c6d3fa; line-height:1.55; }.public-cta .public-primary { background:#fff; color:#1f4fc3; box-shadow:none; }
      .public-footer { padding:30px 0; color:#73829a; font-size:.76rem; }.public-footer-row { display:flex; align-items:center; justify-content:space-between; gap:16px; }.public-footer-row strong { color:#43536d; }
      @media (max-width: 850px) { .public-nav-links { display:none; }.public-hero { padding:35px 0 55px; }.public-hero-grid,.public-story-grid { grid-template-columns:1fr; gap:32px; }.public-hero-card { max-width:600px; }.public-stories { grid-template-columns:1fr; }.public-leadership { grid-template-columns:repeat(2,1fr); }.public-cta-grid { align-items:flex-start; flex-direction:column; } }
      @media (max-width: 520px) { .public-shell { width:min(100% - 28px, 1160px); }.public-nav { height:70px; }.public-brand-logo { width: 177px; height: 70px; }.public-signin { padding:9px 11px; }.public-hero h1 { font-size:2.55rem; }.public-leadership { grid-template-columns:1fr; }.public-footer-row { align-items:flex-start; flex-direction:column; }.public-hero-card { padding:21px; } }
    `}</style>

    <div className="public-shell">
      <nav className="public-nav" aria-label="Public site navigation">
        <div className="public-brand">
          <img className="public-brand-logo" src={brandLogo} alt="Globe Scholars Pathways, LLC." />
        </div>
        <div className="public-nav-links">
          <a className="public-link" href="#our-story">Our story</a>
          <a className="public-link" href="#student-stories">Student stories</a>
          <a className="public-link" href="#leadership">Leadership</a>
        </div>
        <button className="public-signin" type="button" onClick={onSignIn}>Sign in</button>
      </nav>

      <section className="public-hero">
        <div className="public-hero-grid">
          <div>
            <span className="public-eyebrow"><Globe2 size={14} /> {content.hero_eyebrow}</span>
            <h1>{content.hero_title}<span>{content.hero_span}</span></h1>
            <p className="public-lead">{content.hero_description}</p>
            <div className="public-trust">
              <span><CheckCircle2 size={15} color="#268458" /> {content.trust_point_1}</span>
              <span><CheckCircle2 size={15} color="#268458" /> {content.trust_point_2}</span>
              <span><CheckCircle2 size={15} color="#268458" /> {content.trust_point_3}</span>
            </div>
          </div>
          <aside className="public-hero-card" aria-label="Application journey overview">
            <p className="public-card-label">{content.card_label}</p>
            <h2 className="public-card-title">{content.card_title}</h2>
            <div className="public-route">
              <div className="public-route-row"><span className="public-route-number">1</span><span><strong>{content.step_1_title}</strong><small>{content.step_1_description}</small></span><CheckCircle2 size={17} /></div>
              <div className="public-route-row"><span className="public-route-number">2</span><span><strong>{content.step_2_title}</strong><small>{content.step_2_description}</small></span><CheckCircle2 size={17} /></div>
              <div className="public-route-row"><span className="public-route-number">3</span><span><strong>{content.step_3_title}</strong><small>{content.step_3_description}</small></span><CheckCircle2 size={17} /></div>
            </div>
          </aside>
        </div>
      </section>
    </div>

    <section id="our-story" className="public-section public-section-tint">
      <div className="public-shell public-story-grid">
        <div className="public-section-header">
          <span className="public-eyebrow">Our story</span>
          <h2>{content.story_title}</h2>
          <p>{content.story_description}</p>
        </div>
        <div className="public-story-panel">
          <h3>{content.value_header}</h3>
          <div className="public-values">
            <div className="public-value"><span className="public-value-icon"><ShieldCheck size={18} /></span><span><strong>{content.value_1_title}</strong>{content.value_1_description}</span></div>
            <div className="public-value"><span className="public-value-icon"><UsersRound size={18} /></span><span><strong>{content.value_2_title}</strong>{content.value_2_description}</span></div>
            <div className="public-value"><span className="public-value-icon"><GraduationCap size={18} /></span><span><strong>{content.value_3_title}</strong>{content.value_3_description}</span></div>
          </div>
        </div>
      </div>
    </section>

    <section id="student-stories" className="public-section">
      <div className="public-shell">
        <div className="public-section-header">
          <span className="public-eyebrow">Student stories</span>
          <h2>{content.stories_title}</h2>
          <p>{content.stories_description}</p>
        </div>
        <div className="public-stories">
          
          {/* Story 1 */}
          <article className="public-quote">
            <div>
              <Quote size={22} />
              <blockquote>“{content.story_1_quote}”</blockquote>
            </div>
            <footer className="public-quote-footer">
              {content.story_1_image_url ? (
                <img src={content.story_1_image_url} alt={content.story_1_name} className="public-quote-avatar" />
              ) : (
                <div className="public-quote-placeholder">{content.story_1_name?.charAt(0) || 'S'}</div>
              )}
              <div className="public-quote-info">
                <strong>{content.story_1_name}</strong>
                <span>{content.story_1_pathway}</span>
              </div>
            </footer>
          </article>

          {/* Story 2 */}
          <article className="public-quote">
            <div>
              <Quote size={22} />
              <blockquote>“{content.story_2_quote}”</blockquote>
            </div>
            <footer className="public-quote-footer">
              {content.story_2_image_url ? (
                <img src={content.story_2_image_url} alt={content.story_2_name} className="public-quote-avatar" />
              ) : (
                <div className="public-quote-placeholder">{content.story_2_name?.charAt(0) || 'S'}</div>
              )}
              <div className="public-quote-info">
                <strong>{content.story_2_name}</strong>
                <span>{content.story_2_pathway}</span>
              </div>
            </footer>
          </article>

          {/* Story 3 */}
          <article className="public-quote">
            <div>
              <Quote size={22} />
              <blockquote>“{content.story_3_quote}”</blockquote>
            </div>
            <footer className="public-quote-footer">
              {content.story_3_image_url ? (
                <img src={content.story_3_image_url} alt={content.story_3_name} className="public-quote-avatar" />
              ) : (
                <div className="public-quote-placeholder">{content.story_3_name?.charAt(0) || 'S'}</div>
              )}
              <div className="public-quote-info">
                <strong>{content.story_3_name}</strong>
                <span>{content.story_3_pathway}</span>
              </div>
            </footer>
          </article>

        </div>
      </div>
    </section>

    <section id="leadership" className="public-section public-section-tint">
      <div className="public-shell">
        <div className="public-section-header">
          <span className="public-eyebrow">Leadership</span>
          <h2>{content.leadership_title}</h2>
          <p>{content.leadership_description}</p>
        </div>
        <div className="public-leadership">
          
          {/* Leader 1 */}
          <article className="public-leader">
            {content.leader_1_image_url ? (
              <img src={content.leader_1_image_url} alt={content.leader_1_role} className="public-leader-photo" />
            ) : (
              <span className="public-leader-mark"><UsersRound size={19} /></span>
            )}
            <h3>{content.leader_1_role}</h3>
            <p>{content.leader_1_focus}</p>
          </article>

          {/* Leader 2 */}
          <article className="public-leader">
            {content.leader_2_image_url ? (
              <img src={content.leader_2_image_url} alt={content.leader_2_role} className="public-leader-photo" />
            ) : (
              <span className="public-leader-mark"><UsersRound size={19} /></span>
            )}
            <h3>{content.leader_2_role}</h3>
            <p>{content.leader_2_focus}</p>
          </article>

          {/* Leader 3 */}
          <article className="public-leader">
            {content.leader_3_image_url ? (
              <img src={content.leader_3_image_url} alt={content.leader_3_role} className="public-leader-photo" />
            ) : (
              <span className="public-leader-mark"><UsersRound size={19} /></span>
            )}
            <h3>{content.leader_3_role}</h3>
            <p>{content.leader_3_focus}</p>
          </article>

          {/* Leader 4 */}
          <article className="public-leader">
            {content.leader_4_image_url ? (
              <img src={content.leader_4_image_url} alt={content.leader_4_role} className="public-leader-photo" />
            ) : (
              <span className="public-leader-mark"><UsersRound size={19} /></span>
            )}
            <h3>{content.leader_4_role}</h3>
            <p>{content.leader_4_focus}</p>
          </article>

        </div>
      </div>
    </section>

    <footer className="public-footer"><div className="public-shell public-footer-row"><strong>Globe Scholars Pathways, LLC.</strong><span>{content.footer_copy}</span></div></footer>
  </main>
  );
};
