// src/components/AssetForm.tsx
import React, { useEffect, useState, type ChangeEvent } from 'react';
import { db } from '../db';
import type { Asset } from '../types';
import CameraCapture from './CameraCapture';
import type { GlobalSettings } from '../services/settingsService';
import { compressImageFromDataUrl } from '../utils/imageUtils';

interface AssetFormProps {
  globalSettings?: GlobalSettings;
  existingAsset?: Asset;
  onSaved?: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({
  globalSettings,
  existingAsset,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const [assetId, setAssetId] = useState<number | undefined>(undefined);
  const [guid, setGuid] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing asset when editing
  useEffect(() => {
    if (existingAsset) {
      setAssetId(existingAsset.id);
      setGuid(existingAsset.guid);
      setCreatedAt(
        typeof existingAsset.createdAt === 'string'
          ? existingAsset.createdAt
          : existingAsset.createdAt
            ? new Date(existingAsset.createdAt).toISOString()
            : null
      );
      setName(existingAsset.name ?? '');
      setModel(existingAsset.model ?? '');
      setLocation(existingAsset.location ?? '');
      setMacAddress(existingAsset.macAddress ?? '');
      setIpAddress(existingAsset.IPAddress ?? '');
      setDescription(existingAsset.description ?? '');
      setImageDataUrl(existingAsset.imageDataUrl ?? null);
    } else {
      // New asset
      setAssetId(undefined);
      setGuid(null);
      setCreatedAt(null);
      setName('');
      setModel('');
      setLocation('');
      setMacAddress('');
      setIpAddress('');
      setDescription('');
      setImageDataUrl(null);
    }
  }, [existingAsset]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;
      try {
        const compressed = await compressImageFromDataUrl(rawDataUrl);
        setImageDataUrl(compressed);
      } catch (err) {
        console.warn('Failed to compress image:', err);
        setImageDataUrl(rawDataUrl);
      }
    };
    reader.readAsDataURL(file);

    // Allow re-selecting the same file
    e.target.value = '';
  };

  const handleCaptureFromCamera = (dataUrl: string) => {
    setImageDataUrl(dataUrl);
  };

  const handleClearImage = () => {
    setImageDataUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Name is required.');
      return;
    }

    if (!globalSettings) {
      alert(
        'Client and Site are not configured. Please set them in Settings before adding assets.'
      );
      return;
    }

    setSaving(true);
    try {
      const nowIso = new Date().toISOString();

      const assetGuid = guid ?? crypto.randomUUID();
      const created = createdAt ?? nowIso;

      const asset: Asset = {
        id: assetId,
        guid: assetGuid,
        name: name.trim(),
        model: model.trim() || null,
        location: location.trim() || null,
        macAddress: macAddress.trim() || null,
        IPAddress: ipAddress.trim() || null,
        description: description.trim() || null,
        imageDataUrl: imageDataUrl ?? null,
        createdAt: created,
        updatedAt: nowIso,
        isDirty: true,
        isDeleted: false,
        client: globalSettings.client,
        site: globalSettings.site
      };

      if (assetId != null) {
        await db.assets.update(assetId, asset);
      } else {
        const newId = await db.assets.add(asset);
        setAssetId(newId);
        setGuid(assetGuid);
        setCreatedAt(created);
      }

      onSaved?.();

      // For new items, clear the form after save
      if (!existingAsset) {
        setName('');
        setModel('');
        setLocation('');
        setMacAddress('');
        setIpAddress('');
        setDescription('');
        setImageDataUrl(null);
        setAssetId(undefined);
        setGuid(null);
        setCreatedAt(null);
      }
    } catch (err) {
      console.error('Error saving asset:', err);
      alert('Error saving asset. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Global context banner */}
      <div style={styles.globalContextBox}>
        {globalSettings ? (
          <>
            <div style={styles.contextLabel}>Inventory Context</div>
            <div style={styles.contextValue}>
              Client: <strong>{globalSettings.client}</strong>
            </div>
            <div style={styles.contextValue}>
              Site: <strong>{globalSettings.site}</strong>
            </div>
          </>
        ) : (
          <div style={styles.contextWarning}>
            Client and Site are not set. Go to <strong>Settings</strong> to
            configure them before inventorying assets.
          </div>
        )}
      </div>

      <label style={styles.label}>
        Device Name
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={styles.input}
          placeholder="Asset name"
          autoComplete="off"
          required
        />
        {!name.trim() && (
          <span style={{ fontSize: '0.75rem', color: '#e53e3e' }}>
            Device Name is required.
          </span>
        )}
      </label>

      <label style={styles.label}>
        Location
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          style={styles.input}
          placeholder="e.g. MCC Room, Panel 3"
          autoComplete="off"
        />
      </label>

      <label style={styles.label}>
        Model
        <input
          type="text"
          value={model}
          onChange={e => setModel(e.target.value)}
          style={styles.input}
          placeholder="e.g. PLC-5, Switch-24p"
          autoComplete="off"
        />
      </label>

      <label style={styles.label}>
        MAC Address
        <input
          type="text"
          value={macAddress}
          onChange={e => setMacAddress(e.target.value)}
          style={styles.input}
          placeholder="e.g. 00-1A-2B-3C-4D-5E"
          autoComplete="off"
        />
      </label>

      <label style={styles.label}>
        IP Address
        <input
          type="text"
          value={ipAddress}
          onChange={e => setIpAddress(e.target.value)}
          style={styles.input}
          placeholder="e.g. 10.1.2.50"
          autoComplete="off"
        />
      </label>

      <label style={styles.label}>
        Description
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={styles.textarea}
          placeholder="Optional description"
          rows={3}
        />
      </label>

      {/* Image controls */}
      <div style={styles.imageSection}>
        <div style={styles.imageHeaderRow}>
          <span style={styles.imageLabel}>Asset Photo</span>
          {imageDataUrl && (
            <button
              type="button"
              onClick={handleClearImage}
              style={styles.linkButton}
            >
              Remove
            </button>
          )}
        </div>

        {imageDataUrl ? (
          <div style={styles.imagePreviewBox}>
            <img src={imageDataUrl} alt="Asset" style={styles.imagePreview} />
          </div>
        ) : (
          <div style={styles.imagePlaceholder}>
            <span style={{ fontSize: '0.8rem', color: '#718096' }}>
              No image captured
            </span>
          </div>
        )}

        <div style={styles.imageButtonsRow}>
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            style={styles.secondaryButton}
          >
            📷 Take Photo
          </button>
          <label style={styles.secondaryButtonLabel}>
            📁 Choose File
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div style={styles.actionsRow}>
        <button
          type="submit"
          style={styles.primaryButton}
          disabled={saving || !name.trim() || !globalSettings}
        >
          {saving ? 'Saving...' : existingAsset ? 'Update Asset' : 'Save Asset'}
        </button>
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={dataUrl => {
            handleCaptureFromCamera(dataUrl);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  label: {
    fontSize: '0.9rem',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: 4,
    border: '1px solid #cbd5e0',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: 4,
    border: '1px solid #cbd5e0',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  globalContextBox: {
    padding: '8px 10px',
    borderRadius: 6,
    backgroundColor: '#edf2f7',
    border: '1px solid #e2e8f0',
    fontSize: '0.8rem'
  },
  contextLabel: {
    fontWeight: 600,
    marginBottom: 4,
    color: '#4a5568'
  },
  contextValue: {
    color: '#2d3748'
  },
  contextWarning: {
    color: '#c05621'
  },
  imageSection: {
    marginTop: 4
  },
  imageHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  imageLabel: {
    fontSize: '0.9rem',
    fontWeight: 500
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 4,
    border: '1px dashed #cbd5e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fafc'
  },
  imagePreviewBox: {
    width: '100%',
    maxHeight: 220,
    overflow: 'hidden',
    borderRadius: 4,
    border: '1px solid #cbd5e0',
    backgroundColor: '#000'
  },
  imagePreview: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'contain'
  },
  imageButtonsRow: {
    display: 'flex',
    gap: 8,
    marginTop: 6
  },
  secondaryButton: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #cbd5e0',
    backgroundColor: '#edf2f7',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textAlign: 'center'
  },
  secondaryButtonLabel: {
    flex: 1,
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid #cbd5e0',
    backgroundColor: '#edf2f7',
    cursor: 'pointer',
    fontSize: '0.85rem',
    textAlign: 'center',
    display: 'inline-block'
  },
  linkButton: {
    border: 'none',
    background: 'none',
    color: '#e53e3e',
    cursor: 'pointer',
    fontSize: '0.8rem',
    textDecoration: 'underline'
  },
  actionsRow: {
    marginTop: 10,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  primaryButton: {
    padding: '8px 14px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: '#2b6cb0',
    color: '#fff',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }
};

export default AssetForm;
