import React, { useRef, useState } from 'react';
import { Camera, Trash2, Upload, AlertTriangle, Check, Sparkles } from 'lucide-react';
import {
  MAX_AVATAR_SIZE_BYTES,
  MAX_AVATAR_SIZE_LABEL,
  validateAvatarFile,
  compressImageToAvatar,
  readFileAsDataUrl
} from '../../lib/image-utils';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: number; // width & height in px, default 80
  editable?: boolean;
  onAvatarChange?: (dataUrl: string | null) => Promise<void> | void;
  showDetails?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  name,
  size = 80,
  editable = false,
  onAvatarChange,
  showDetails = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingOversizedFile, setPendingOversizedFile] = useState<File | null>(null);

  const initials = (name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setSuccessMessage('');
    setPendingOversizedFile(null);

    const validation = validateAvatarFile(file);

    if (!validation.valid) {
      if (file.type.startsWith('image/') && validation.sizeBytes > MAX_AVATAR_SIZE_BYTES) {
        setErrorMessage(
          `Image is ${validation.sizeKb} KB (exceeds ${MAX_AVATAR_SIZE_LABEL} limit). You can auto-compress it below.`
        );
        setPendingOversizedFile(file);
      } else {
        setErrorMessage(validation.error || 'Invalid file.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Valid <= 50KB image
    try {
      setLoading(true);
      const dataUrl = await readFileAsDataUrl(file);
      await onAvatarChange?.(dataUrl);
      setSuccessMessage(`Profile picture updated (${validation.sizeKb} KB)!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile picture.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAutoCompress = async () => {
    if (!pendingOversizedFile) return;

    try {
      setLoading(true);
      setErrorMessage('');
      const compressed = await compressImageToAvatar(pendingOversizedFile);

      if (compressed.sizeBytes > MAX_AVATAR_SIZE_BYTES) {
        setErrorMessage(`Could not compress below ${MAX_AVATAR_SIZE_LABEL}. Please choose a smaller image.`);
        return;
      }

      await onAvatarChange?.(compressed.dataUrl);
      setPendingOversizedFile(null);
      setSuccessMessage(`Optimized & saved (${compressed.sizeKb} KB)!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Compression failed. Please select a smaller photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;
    try {
      setLoading(true);
      setErrorMessage('');
      await onAvatarChange?.(null);
      setSuccessMessage('Profile photo removed.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Failed to remove photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {/* Avatar Circle */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: `${Math.round(size * 0.38)}px`,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span>{initials}</span>
          )}

          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                color: '#fff',
              }}
            >
              Saving...
            </div>
          )}
        </div>

        {/* Edit Button Badge */}
        {editable && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title="Upload profile picture (Max 50KB)"
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: `${Math.max(26, Math.round(size * 0.35))}px`,
              height: `${Math.max(26, Math.round(size * 0.35))}px`,
              borderRadius: '50%',
              background: '#2563eb',
              color: '#ffffff',
              border: '2px solid #ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Camera size={Math.max(13, Math.round(size * 0.18))} />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      )}

      {/* Action Controls & Size Guidelines */}
      {editable && showDetails && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.74rem',
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: '8px',
              }}
            >
              <Upload size={13} />
              {avatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={loading}
                className="btn btn-danger btn-sm"
                style={{
                  fontSize: '0.74rem',
                  padding: '5px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                }}
              >
                <Trash2 size={13} />
                Remove
              </button>
            )}
          </div>

          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Strict Max Size: <strong style={{ color: '#38bdf8' }}>50 KB</strong> (PNG, JPG, WebP)
          </span>

          {/* Oversized Image Auto-Compress Prompt */}
          {pendingOversizedFile && (
            <div
              style={{
                marginTop: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: '#fbbf24', textAlign: 'center' }}>
                Would you like to auto-compress this image to fit under 50KB?
              </span>
              <button
                type="button"
                onClick={handleAutoCompress}
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: '#d97706',
                  borderColor: '#b45309',
                }}
              >
                <Sparkles size={13} />
                Auto-Compress & Save (&lt;50KB)
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '4px',
                maxWidth: '100%',
                boxSizing: 'border-box',
              }}
            >
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '4px',
              }}
            >
              <Check size={13} />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
