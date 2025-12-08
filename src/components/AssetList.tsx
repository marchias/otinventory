// src/components/AssetList.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { db } from '../db';
import type { Asset } from '../types';
import type { ChangeEvent, FormEvent } from 'react';

type ViewMode = 'tiles' | 'table';
type SortColumn = 'name' | 'location' | 'description' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table'); // default to table
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadAssets = async () => {
    const allAssets = await db.assets.toArray();
    // Hide soft-deleted assets
    setAssets(allAssets.filter(a => !a.isDeleted));
  };

  useEffect(() => {
    loadAssets();

    // Simple polling to keep list refreshed
    const interval = setInterval(loadAssets, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (asset: Asset) => {
    if (!asset.id) return;

    const confirmed = window.confirm(
      `Delete asset "${asset.name}" from this device?`
    );
    if (!confirmed) return;

    const now = new Date().toISOString();

    // Soft delete: mark as deleted + dirty for sync, but hide in UI
    await db.assets.update(asset.id, {
      isDeleted: true,
      isDirty: true,
      updatedAt: now
    });

    await loadAssets();
  };

  const handleEditSaved = async () => {
    setEditingAsset(null);
    await loadAssets();
  };

  const handleSort = (column: SortColumn) => {
    setSortDirection(prev =>
      sortColumn === column ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'
    );
    setSortColumn(column);
  };

  const sortedAssets = useMemo(() => {
    const copy = [...assets];
    copy.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortColumn) {
        case 'name':
          aVal = a.name ?? '';
          bVal = b.name ?? '';
          break;
        case 'location':
          aVal = a.location ?? '';
          bVal = b.location ?? '';
          break;
        case 'description':
          aVal = a.description ?? '';
          bVal = b.description ?? '';
          break;
        case 'createdAt': {
          const aStr =
            typeof a.createdAt === 'string'
              ? a.createdAt
              : a.createdAt
                ? new Date(a.createdAt).toISOString()
                : '';
          const bStr =
            typeof b.createdAt === 'string'
              ? b.createdAt
              : b.createdAt
                ? new Date(b.createdAt).toISOString()
                : '';
          aVal = aStr;
          bVal = bStr;
          break;
        }
        case 'status':
          // 0 = synced, 1 = dirty
          aVal = a.isDirty ? 1 : 0;
          bVal = b.isDirty ? 1 : 0;
          break;
      }

      let cmp = 0;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return copy;
  }, [assets, sortColumn, sortDirection]);

  const hasAssets = sortedAssets.length > 0;

  return (
    <div>
      <div style={styles.headerRow}>
        {hasAssets && (
          <div style={styles.viewToggle}>
            <button
              type="button"
              onClick={() => setViewMode('tiles')}
              style={{
                ...styles.toggleButton,
                ...(viewMode === 'tiles' ? styles.toggleButtonActive : {})
              }}
              aria-pressed={viewMode === 'tiles'}
              title="Tile view"
            >
              <span style={styles.iconGrid} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                ...styles.toggleButton,
                ...(viewMode === 'table' ? styles.toggleButtonActive : {})
              }}
              aria-pressed={viewMode === 'table'}
              title="Table view"
            >
              <span style={styles.iconList} />
            </button>
          </div>
        )}
      </div>

      {!hasAssets && <p>No assets captured yet.</p>}

      {hasAssets &&
        viewMode === 'tiles' &&
        renderTiles(sortedAssets, setPreviewImageUrl, setEditingAsset, handleDelete)}

      {hasAssets &&
        viewMode === 'table' &&
        renderTable(
          sortedAssets,
          setPreviewImageUrl,
          setEditingAsset,
          handleDelete,
          sortColumn,
          sortDirection,
          handleSort
        )}

      {previewImageUrl && (
        <div style={styles.overlay} onClick={() => setPreviewImageUrl(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <img
              src={previewImageUrl}
              alt="Asset"
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 4 }}
            />
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                style={styles.closeButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAsset && (
        <EditAssetModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};

// ---- Helpers ----

function renderSortIndicator(
  column: SortColumn,
  sortColumn: SortColumn,
  sortDirection: SortDirection
) {
  if (column !== sortColumn) return null;
  return (
    <span style={styles.sortIndicator}>
      {sortDirection === 'asc' ? '▲' : '▼'}
    </span>
  );
}

// ---- Tile view ----

function renderTiles(
  assets: Asset[],
  setPreviewImageUrl: (url: string) => void,
  setEditingAsset: (asset: Asset) => void,
  handleDelete: (asset: Asset) => void
) {
  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {assets.map(asset => {
        const createdAtStr =
          typeof asset.createdAt === 'string'
            ? asset.createdAt
            : asset.createdAt
              ? new Date(asset.createdAt).toISOString()
              : '';

        const createdAtDisplay = createdAtStr
          ? new Date(createdAtStr).toLocaleString()
          : '—';

        return (
          <li key={asset.guid} style={styles.tileItem}>
            <div style={styles.tileHeaderRow}>
              <strong>{asset.name}</strong>
              <span
                style={{
                  ...styles.tag,
                  backgroundColor: asset.isDirty ? '#f6ad55' : '#48bb78'
                }}
              >
                {asset.isDirty ? 'Pending Sync' : 'Synced'}
              </span>
            </div>
            {asset.location && (
              <div>
                <small>Location: {asset.location}</small>
              </div>
            )}
            {asset.description && (
              <div>
                <small>{asset.description}</small>
              </div>
            )}
            <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
              {asset.imageDataUrl && (
                <button
                  type="button"
                  style={styles.linkButton}
                  onClick={() => setPreviewImageUrl(asset.imageDataUrl!)}
                >
                  View Picture
                </button>
              )}
              <button
                type="button"
                style={styles.linkButton}
                onClick={() => setEditingAsset(asset)}
              >
                Edit
              </button>
              <button
                type="button"
                style={{ ...styles.linkButton, color: '#e53e3e' }}
                onClick={() => handleDelete(asset)}
              >
                Delete
              </button>
            </div>
            <small>Created: {createdAtDisplay}</small>
          </li>
        );
      })}
    </ul>
  );
}

// ---- Table view ----

function renderTable(
  assets: Asset[],
  setPreviewImageUrl: (url: string) => void,
  setEditingAsset: (asset: Asset) => void,
  handleDelete: (asset: Asset) => void,
  sortColumn: SortColumn,
  sortDirection: SortDirection,
  handleSort: (column: SortColumn) => void
) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th
              style={styles.thClickable}
              onClick={() => handleSort('name')}
            >
              Name {renderSortIndicator('name', sortColumn, sortDirection)}
            </th>
            <th
              style={styles.thClickable}
              onClick={() => handleSort('location')}
            >
              Location{' '}
              {renderSortIndicator('location', sortColumn, sortDirection)}
            </th>
            <th
              style={styles.thClickable}
              onClick={() => handleSort('description')}
            >
              Description{' '}
              {renderSortIndicator('description', sortColumn, sortDirection)}
            </th>
            <th
              style={styles.thClickable}
              onClick={() => handleSort('createdAt')}
            >
              Created{' '}
              {renderSortIndicator('createdAt', sortColumn, sortDirection)}
            </th>
            <th
              style={styles.thClickable}
              onClick={() => handleSort('status')}
            >
              Status {renderSortIndicator('status', sortColumn, sortDirection)}
            </th>
            <th style={styles.th}>Picture</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.map(asset => {
            const createdAtStr =
              typeof asset.createdAt === 'string'
                ? asset.createdAt
                : asset.createdAt
                  ? new Date(asset.createdAt).toISOString()
                  : '';

            const createdAtDisplay = createdAtStr
              ? new Date(createdAtStr).toLocaleString()
              : '—';

            const descriptionShort = asset.description
              ? asset.description.length > 50
                ? asset.description.slice(0, 50) + '…'
                : asset.description
              : '';

            return (
              <tr key={asset.guid}>
                <td style={styles.td}>{asset.name}</td>
                <td style={styles.td}>{asset.location ?? ''}</td>
                <td style={styles.td}>{descriptionShort}</td>
                <td style={styles.td}>{createdAtDisplay}</td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.tag,
                      backgroundColor: asset.isDirty ? '#f6ad55' : '#48bb78'
                    }}
                  >
                    {asset.isDirty ? 'Pending Sync' : 'Synced'}
                  </span>
                </td>
                <td style={styles.td}>
                  {asset.imageDataUrl ? (
                    <button
                      type="button"
                      style={styles.linkButton}
                      onClick={() => setPreviewImageUrl(asset.imageDataUrl!)}
                    >
                      View Picture
                    </button>
                  ) : (
                    <span style={{ color: '#999' }}>—</span>
                  )}
                </td>
                <td style={styles.td}>
                  <button
                    type="button"
                    style={styles.linkButton}
                    onClick={() => setEditingAsset(asset)}
                  >
                    Edit
                  </button>
                  {' | '}
                  <button
                    type="button"
                    style={{ ...styles.linkButton, color: '#e53e3e' }}
                    onClick={() => handleDelete(asset)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---- Edit modal ----

interface EditAssetModalProps {
  asset: Asset;
  onClose: () => void;
  onSaved: () => void;
}

const EditAssetModal: React.FC<EditAssetModalProps> = ({
  asset,
  onClose,
  onSaved
}) => {
  const [name, setName] = useState<string>(asset.name ?? '');
  const [location, setLocation] = useState<string>(asset.location ?? '');
  const [description, setDescription] = useState<string>(
    asset.description ?? ''
  );
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(
    asset.imageDataUrl ?? null
  );
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleRemovePicture = () => {
    setImageDataUrl(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!asset.id) {
      onClose();
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();

    await db.assets.update(asset.id, {
      name: name.trim(),
      location: location.trim() || null,
      description: description.trim() || null,
      imageDataUrl: imageDataUrl ?? null,
      updatedAt: now,
      isDirty: true // mark for sync
    });

    setSaving(false);
    await onSaved();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Edit Asset</h3>
        <form onSubmit={handleSubmit}>
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
                onClick={() => fileInputRef.current?.click()}
              >
                Change Picture
              </button>
              {imageDataUrl && (
                <button
                  type="button"
                  style={{ ...styles.secondaryButton, color: '#e53e3e' }}
                  onClick={handleRemovePicture}
                >
                  Remove Picture
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />

            {imageDataUrl && (
              <img
                src={imageDataUrl}
                alt="Preview"
                style={{
                  maxWidth: '200px',
                  marginTop: '8px',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>

          <div style={styles.buttonsRow}>
            <button
              type="button"
              onClick={onClose}
              style={styles.secondaryButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={styles.primaryButton}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Styles ----

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  viewToggle: {
    display: 'flex',
    gap: 4
  },
  toggleButton: {
    border: '1px solid #ccc',
    background: '#f7f7f7',
    borderRadius: 4,
    padding: 4,
    cursor: 'pointer'
  },
  toggleButtonActive: {
    background: '#e2e8f0',
    borderColor: '#718096'
  },
  iconGrid: {
    display: 'inline-block',
    width: 14,
    height: 14,
    backgroundImage:
      'linear-gradient(to right, #444 50%, transparent 50%), linear-gradient(to right, #444 50%, transparent 50%), linear-gradient(to bottom, #444 50%, transparent 50%), linear-gradient(to bottom, #444 50%, transparent 50%)',
    backgroundSize: '50% 2px, 50% 2px, 2px 50%, 2px 50%',
    backgroundPosition: '0 0, 100% 100%, 0 0, 100% 100%',
    backgroundRepeat: 'no-repeat'
  },
  iconList: {
    display: 'inline-block',
    width: 16,
    height: 12,
    backgroundImage:
      'linear-gradient(#444 2px, transparent 2px), linear-gradient(#444 2px, transparent 2px), linear-gradient(#444 2px, transparent 2px)',
    backgroundSize: '100% 2px',
    backgroundPosition: '0 0, 0 5px, 0 10px',
    backgroundRepeat: 'no-repeat'
  },

  sortIndicator: {
    marginLeft: 4,
    fontSize: '0.7rem'
  },

  // Tile view styles
  tileItem: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '8px',
    marginBottom: '8px'
  },
  tileHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    alignItems: 'center'
  },
  tag: {
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '999px',
    fontSize: '0.75rem'
  },

  // Table view styles
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap'
  },
  thClickable: {
    textAlign: 'left',
    padding: '6px 8px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none'
  },
  td: {
    padding: '6px 8px',
    borderBottom: '1px solid #edf2f7',
    fontSize: '0.85rem',
    verticalAlign: 'top'
  },

  // Overlay / modal shared
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    boxSizing: 'border-box' as const,
    overflowY: 'auto'
  },
  closeButton: {
    padding: '6px 12px',
    cursor: 'pointer'
  },
  linkButton: {
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'none',
    color: '#3182ce',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },

  // Form styles reused in modal
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
  buttonsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12
  },
  primaryButton: {
    padding: '6px 12px',
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

export default AssetList;
