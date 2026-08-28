import { DocType, StudyLevel } from '../types/database';

export interface DocumentRequirement {
  id: string;
  type: DocType;
  title: string;
  description: string;
}

export const STUDY_LEVEL_OPTIONS: Array<{
  value: StudyLevel;
  label: string;
}> = [
  { value: 'foundation', label: 'Foundation / Pathway' },
  { value: 'undergraduate', label: "Undergraduate (Bachelor's)" },
  { value: 'postgraduate', label: "Postgraduate (Master's)" },
  { value: 'doctoral', label: 'Doctoral (PhD)' },
];

export const DOCUMENT_REQUIREMENTS: Record<StudyLevel, DocumentRequirement[]> = {
  foundation: [
    { id: 'passport', type: 'passport', title: 'Passport biometric page', description: 'A clear, valid copy of the photo-information page.' },
    { id: 'passport-photo', type: 'passport_photo', title: 'Passport-size photo', description: 'A recent passport-size color photograph with a white background (Max 50 KB).' },
    { id: 'secondary-school-certificate', type: 'secondary_school_certificate', title: 'Secondary school certificate', description: 'Your final school-leaving certificate or equivalent.' },
    { id: 'secondary-school-transcript', type: 'academic_transcript', title: 'Secondary school transcript', description: 'Your complete marks sheet or academic record.' },
    { id: 'financial-statement', type: 'financial_statement', title: 'Proof of funds', description: 'A recent bank statement or official financial sponsor letter.' },
  ],
  undergraduate: [
    { id: 'passport', type: 'passport', title: 'Passport biometric page', description: 'A clear, valid copy of the photo-information page.' },
    { id: 'passport-photo', type: 'passport_photo', title: 'Passport-size photo', description: 'A recent passport-size color photograph with a white background (Max 50 KB).' },
    { id: 'secondary-school-certificate', type: 'secondary_school_certificate', title: 'Secondary school certificate', description: 'Your final school-leaving certificate or equivalent.' },
    { id: 'secondary-school-transcript', type: 'academic_transcript', title: 'Secondary school transcript', description: 'Your complete marks sheet or academic record.' },
    { id: 'personal-statement', type: 'personal_statement', title: 'Personal statement', description: 'Explain your academic goals and why you selected this programme.' },
    { id: 'financial-statement', type: 'financial_statement', title: 'Proof of funds', description: 'A recent bank statement or official financial sponsor letter.' },
  ],
  postgraduate: [
    { id: 'passport', type: 'passport', title: 'Passport biometric page', description: 'A clear, valid copy of the photo-information page.' },
    { id: 'passport-photo', type: 'passport_photo', title: 'Passport-size photo', description: 'A recent passport-size color photograph with a white background (Max 50 KB).' },
    { id: 'bachelor-degree-certificate', type: 'degree_certificate', title: "Bachelor's degree certificate", description: 'Your completed undergraduate degree certificate.' },
    { id: 'bachelor-transcript', type: 'academic_transcript', title: "Bachelor's academic transcript", description: 'Your complete undergraduate transcript or marks sheets.' },
    { id: 'personal-statement', type: 'personal_statement', title: 'Personal statement', description: 'Explain your academic goals and why you selected this programme.' },
    { id: 'recommendation-one', type: 'recommendation_letter_1', title: 'First academic recommendation', description: 'A signed recommendation letter from an academic referee.' },
    { id: 'recommendation-two', type: 'recommendation_letter_2', title: 'Second academic recommendation', description: 'A signed recommendation letter from another academic referee.' },
    { id: 'curriculum-vitae', type: 'curriculum_vitae', title: 'Curriculum vitae (CV)', description: 'An up-to-date CV or résumé.' },
    { id: 'financial-statement', type: 'financial_statement', title: 'Proof of funds', description: 'A recent bank statement or official financial sponsor letter.' },
  ],
  doctoral: [
    { id: 'passport', type: 'passport', title: 'Passport biometric page', description: 'A clear, valid copy of the photo-information page.' },
    { id: 'passport-photo', type: 'passport_photo', title: 'Passport-size photo', description: 'A recent passport-size color photograph with a white background (Max 50 KB).' },
    { id: 'graduate-degree-certificates', type: 'degree_certificate', title: "Bachelor's and Master's degree certificates", description: 'Combine your completed degree certificates into one PDF.' },
    { id: 'graduate-transcripts', type: 'academic_transcript', title: "Bachelor's and Master's transcripts", description: 'Combine all relevant university transcripts into one PDF.' },
    { id: 'research-proposal', type: 'research_proposal', title: 'Research proposal', description: 'A concise proposal describing your research question and methodology.' },
    { id: 'recommendation-one', type: 'recommendation_letter_1', title: 'First academic recommendation', description: 'A signed recommendation letter from an academic referee.' },
    { id: 'recommendation-two', type: 'recommendation_letter_2', title: 'Second academic recommendation', description: 'A signed recommendation letter from another academic referee.' },
    { id: 'curriculum-vitae', type: 'curriculum_vitae', title: 'Academic curriculum vitae', description: 'An up-to-date CV with education, research, and publications.' },
    { id: 'financial-statement', type: 'financial_statement', title: 'Proof of funds', description: 'A recent bank statement or official financial sponsor letter.' },
  ],
};
