import React, { useState } from 'react';
import {
  Bell,
  Contrast,
  LayoutPanelTop,
  Mail,
  Save,
  ShieldCheck,
  X,
} from 'lucide-react';

export interface DepartmentSettingsPreferences {
  compactMode: boolean;
  highContrast: boolean;
  inAppNotifications: boolean;
  emailDigest: boolean;
  defaultView: 'standard' | 'compact';
}

export const DEFAULT_DEPARTMENT_SETTINGS: DepartmentSettingsPreferences = {
  compactMode: false,
  highContrast: false,
  inAppNotifications: true,
  emailDigest: true,
  defaultView: 'standard',
};

interface DepartmentSettingsModalProps {
  department: string;
  userName?: string;
  preferences: DepartmentSettingsPreferences;
  onClose: () => void;
  onSave: (preferences: DepartmentSettingsPreferences) => void;
}

const PreferenceRow: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ icon, title, description, checked, onChange }) => (
  <label className="settings-preference-row">
    <span className="settings-preference-icon">{icon}</span>
    <span className="settings-preference-copy">
      <strong>{title}</strong>
      <small>{description}</small>
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={title}
    />
  </label>
);

export const DepartmentSettingsModal: React.FC<
  DepartmentSettingsModalProps
> = ({ department, userName, preferences, onClose, onSave }) => {
  const [draft, setDraft] = useState(preferences);

  const update = (changes: Partial<DepartmentSettingsPreferences>) => {
    setDraft((current) => ({ ...current, ...changes }));
  };

  return (
    <div className="modal-overlay" role="presentation">
      <section
        className="modal-content department-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-settings-title"
      >
        <header className="settings-modal-header">
          <div>
            <span className="settings-eyebrow">{department} workspace</span>
            <h2 id="department-settings-title">Workspace settings</h2>
            <p>
              Personalize the dashboard for {userName || 'your'} day-to-day
              work. These preferences are saved on this device.
            </p>
          </div>
          <button
            type="button"
            className="settings-close-button"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </header>

        <div className="settings-section">
          <div className="settings-section-title">
            <LayoutPanelTop size={18} />
            <div>
              <h3>Workspace</h3>
              <p>Make information easier to scan during busy periods.</p>
            </div>
          </div>

          <label className="form-label" htmlFor="default-workspace-view">
            Default workspace density
          </label>
          <select
            id="default-workspace-view"
            className="form-input"
            value={draft.defaultView}
            onChange={(event) =>
              update({
                defaultView: event.target.value as 'standard' | 'compact',
              })
            }
          >
            <option value="standard">Standard — balanced spacing</option>
            <option value="compact">Compact — see more information</option>
          </select>

          <PreferenceRow
            icon={<LayoutPanelTop size={18} />}
            title="Compact navigation"
            description="Reduce spacing in menus and workspace panels."
            checked={draft.compactMode}
            onChange={(compactMode) => update({ compactMode })}
          />
          <PreferenceRow
            icon={<Contrast size={18} />}
            title="High-contrast text"
            description="Increase text and border contrast for improved readability."
            checked={draft.highContrast}
            onChange={(highContrast) => update({ highContrast })}
          />
        </div>

        <div className="settings-section">
          <div className="settings-section-title">
            <Bell size={18} />
            <div>
              <h3>Notifications</h3>
              <p>Control how the department keeps you informed.</p>
            </div>
          </div>
          <PreferenceRow
            icon={<Bell size={18} />}
            title="In-app alerts"
            description="Show alerts for actions, approvals, and assignments."
            checked={draft.inAppNotifications}
            onChange={(inAppNotifications) => update({ inAppNotifications })}
          />
          <PreferenceRow
            icon={<Mail size={18} />}
            title="Daily email summary"
            description="Receive a daily summary of the department work queue."
            checked={draft.emailDigest}
            onChange={(emailDigest) => update({ emailDigest })}
          />
        </div>

        <div className="settings-security-note">
          <ShieldCheck size={18} />
          <span>
            Your role and access permissions are managed by an administrator.
          </span>
        </div>

        <footer className="settings-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(draft)}>
            <Save size={16} />
            Save settings
          </button>
        </footer>
      </section>
    </div>
  );
};
