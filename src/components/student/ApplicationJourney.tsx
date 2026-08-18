import React from 'react';
import {
  Building2,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  Landmark,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import {
  Application,
  ApplicationStatus,
  ApplicationStatusHistory,
  DepartmentType,
} from '../../types/database';

interface JourneyStage {
  id: string;
  department: DepartmentType | null;
  team: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'submission',
    department: null,
    team: 'Student Services',
    title: 'Application submission',
    description: 'Your application and required documents are received.',
    icon: <Send size={18} />,
  },
  {
    id: 'counseling',
    department: 'counseling',
    team: 'Counseling',
    title: 'Academic pathway review',
    description: 'A counselor checks your programme and study pathway.',
    icon: <UserRoundCheck size={18} />,
  },
  {
    id: 'documents',
    department: 'data_applications',
    team: 'Data & Applications',
    title: 'Document verification',
    description: 'Your records are checked for completeness and authenticity.',
    icon: <FileCheck2 size={18} />,
  },
  {
    id: 'admissions',
    department: 'admissions',
    team: 'Admissions',
    title: 'Admissions assessment',
    description: 'The admissions team evaluates academic eligibility.',
    icon: <ShieldCheck size={18} />,
  },
  {
    id: 'finance',
    department: 'finance',
    team: 'Finance',
    title: 'Financial clearance',
    description: 'Fees and financial documentation are reviewed.',
    icon: <Landmark size={18} />,
  },
  {
    id: 'operations',
    department: 'operations',
    team: 'Operations',
    title: 'Institution submission',
    description: 'Your completed application is prepared for the institution.',
    icon: <Building2 size={18} />,
  },
];

const STATUS_POSITION: Record<ApplicationStatus, number> = {
  draft: 0,
  submitted: 1,
  under_review: 1,
  documents_missing: 2,
  documents_verified: 3,
  admissions_review: 3,
  ready_for_processing: 4,
  submitted_to_institution: 5,
  decision_pending: JOURNEY_STAGES.length,
  approved: JOURNEY_STAGES.length,
  rejected: 3,
};

interface ApplicationJourneyProps {
  application: Application;
  statusHistory: ApplicationStatusHistory[];
}

export const ApplicationJourney: React.FC<ApplicationJourneyProps> = ({
  application,
  statusHistory,
}) => {
  const position = STATUS_POSITION[application.status] ?? 0;
  const isRejected = application.status === 'rejected';
  const completedStages = isRejected
    ? Math.min(position, JOURNEY_STAGES.length)
    : Math.min(position, JOURNEY_STAGES.length);
  const currentStage = isRejected ? position : position;
  const latestHistory = [...statusHistory].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
  )[0];

  return (
    <section className="glass-panel application-journey" aria-labelledby="application-journey-title">
      <header className="application-journey-header">
        <div>
          <span className="settings-eyebrow">Department workflow</span>
          <h3 id="application-journey-title">Your application journey</h3>
          <p>
            Each required department signs off before your application moves to
            the next stage.
          </p>
        </div>
        <div className="application-journey-summary">
          <strong>{completedStages} of {JOURNEY_STAGES.length}</strong>
          <span>department stages complete</span>
        </div>
      </header>

      {latestHistory && (
        <div className="application-journey-update">
          <Clock3 size={16} />
          <span>
            Latest update: {latestHistory.note || 'Application status updated.'}
          </span>
        </div>
      )}

      <div className="application-journey-stages">
        {JOURNEY_STAGES.map((stage, index) => {
          const historyEntry = stage.department
            ? statusHistory.find((entry) => entry.department === stage.department)
            : undefined;
          const isCompleted = index < completedStages || application.status === 'approved';
          const isCurrent = !isRejected && index === currentStage && !isCompleted;
          const isNotRequired = isRejected && index > currentStage;
          const state = isCompleted
            ? 'complete'
            : isCurrent
              ? 'current'
              : isNotRequired
                ? 'not-required'
                : 'pending';

          return (
            <article key={stage.id} className={`application-journey-stage is-${state}`}>
              <div className="application-journey-icon" aria-hidden="true">
                {isCompleted ? <CheckCircle2 size={20} /> : isCurrent ? <Clock3 size={20} /> : <Circle size={20} />}
              </div>
              <div className="application-journey-stage-copy">
                <div className="application-journey-stage-heading">
                  <span className="application-journey-team-icon">{stage.icon}</span>
                  <div>
                    <span className="application-journey-team">{stage.team}</span>
                    <h4>{stage.title}</h4>
                  </div>
                </div>
                <p>{stage.description}</p>
                {isCompleted && (
                  <span className="application-journey-signoff">
                    <CheckCircle2 size={14} />
                    {historyEntry
                      ? `Signed off by ${historyEntry.changed_by_name}`
                      : `${stage.team} review complete`}
                  </span>
                )}
                {isCurrent && (
                  <span className="application-journey-current">Currently with {stage.team}</span>
                )}
                {isNotRequired && (
                  <span className="application-journey-not-required">Not required after this decision</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
