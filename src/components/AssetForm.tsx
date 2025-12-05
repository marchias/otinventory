// src/components/AssetForm.tsx
import React, { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Asset } from '../types';
import CameraCapture from './CameraCapture';
import { compressImageFromDataUrl } from '../utils/imageUtils';

interface AssetFormProps {
  onCreated?: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({ onCreated }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Ref to hidden file input (for Choose File)
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
    const rawDataUrl = reader.result as string;
    const compressed = await compressImageFromDataUrl(rawDataUrl);
    setImageDataUrl(compressed);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const now = new Date().toISOString();

    const asset: Asset = {
      guid: uuidv4(),
      name: name.trim(),
      location: location.trim(),
      description: description.trim() || undefined,
      imageDataUrl,
      createdAt: now,
      updatedAt: now,
      isDirty: true
    };

    try {
      await db.assets.add(asset);
      setName('');
      setLocation('');
      setDescription('');
      setImageDataUrl(undefined);
      if (onCreated) onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={styles.form}>     
        <label style={styles.label}>
          Name
          <input
            style={styles.input}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>

        <label style={styles.label}>
          Location
          <input
            style={styles.input}
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </label>

        <label style={styles.label}>
          Description
          <textarea
            style={styles.textarea}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </label>

        <div style={{ marginTop: 8, marginBottom: 8 }}>
          <div style={{ marginBottom: 4 }}>Picture</div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setShowCamera(true)}
            >
              📷 Take Photo
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => fileInputRef.current?.click()}
            >
              🖼️ Choose File
            </button>
          </div>

          {/* Hidden file input for gallery / file picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>

        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt="Preview"
            style={{ maxWidth: '200px', marginTop: '8px', borderRadius: '4px' }}
          />
        )}

        <button type="submit" disabled={saving} style={styles.primaryButton}>
          {saving ? 'Saving...' : 'Save Asset'}
        </button>
      </form>

      {showCamera && (
        <CameraCapture
          onCapture={dataUrl => setImageDataUrl(dataUrl)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    maxWidth: '400px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    marginTop: '4px',
    boxSizing: 'border-box' as const
  },
  textarea: {
    width: '100%',
    padding: '6px 8px',
    marginTop: '4px',
    minHeight: '60px',
    boxSizing: 'border-box' as const
  },
  primaryButton: {
    marginTop: '12px',
    padding: '8px 16px',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '6px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    border: '1px solid #ccc',
    background: '#f5f5f5'
  }
};

export default AssetForm;
