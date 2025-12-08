// src/components/SyncedAssetsTable.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://localhost:7196';

export interface SyncedAsset {
  id: number;
  guid: string;
  name: string;
  client: string;
  site: string;
  model?: string | null;
  location?: string | null;
  macAddress?: string | null;
  ipAddress?: string | null;
  description?: string | null;
  createdAt: string;   // will come back as ISO string from API
  updatedAt: string;   // optional, but nice to display or sort
  isDirty: boolean;
  isDeleted: boolean;
}

const SyncedAssetsTable: React.FC = () => {
  const [data, setData] = useState<SyncedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<MRT_ColumnDef<SyncedAsset>[]>(
    () => [
      {
        header: 'Client',
        accessorKey: 'client',
      },
      {
        header: 'Site',
        accessorKey: 'site',
      },
      {
        header: 'Name',
        accessorKey: 'name',
      },
      {
        header: 'Model',
        accessorKey: 'model',
        Cell: ({ cell }) => cell.getValue<string | null>() ?? '',
      },
      {
        header: 'Location',
        accessorKey: 'location',
        Cell: ({ cell }) => cell.getValue<string | null>() ?? '',
      },
      {
        header: 'MAC',
        accessorKey: 'macAddress',
        Cell: ({ cell }) => cell.getValue<string | null>() ?? '',
      },
      {
        header: 'IP',
        accessorKey: 'ipAddress',
        Cell: ({ cell }) => cell.getValue<string | null>() ?? '',
      },
      {
        header: 'Created',
        accessorKey: 'createdAt',
        Cell: ({ cell }) => {
          const raw = cell.getValue<string>();
          return raw ? new Date(raw).toLocaleString() : '';
        },
      },
      {
        header: 'Status',
        accessorKey: 'isDirty',
        Cell: ({ cell }) => {
          const isDirty = cell.getValue<boolean>();
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: '0.75rem',
                color: '#fff',
                backgroundColor: isDirty ? '#f6ad55' : '#48bb78',
              }}
            >
              {isDirty ? 'Pending Sync' : 'Synced'}
            </span>
          );
        },
      },
    ],
    [],
  );

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);

      try {
        const resp = await fetch(`${API_BASE_URL}/api/server-assets`);
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`HTTP ${resp.status}: ${text}`);
        }

        const json = (await resp.json()) as SyncedAsset[];
        setData(json);
      } catch (err: any) {
        console.error('Error fetching server assets:', err);
        setError(err?.message ?? 'Error fetching server assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return (
    <div style={{ padding: '12px' }}>
      {error && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            borderRadius: 4,
            backgroundColor: '#fed7d7',
            color: '#742a2a',
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      <MaterialReactTable
        columns={columns}
        data={data}
        state={{ isLoading: loading }}
        enableFullScreenToggle={false}
        enableDensityToggle={false}
        initialState={{
          pagination: { pageSize: 25, pageIndex: 0 },
          sorting: [{ id: 'createdAt', desc: true }],
        }}
      />
    </div>
  );
};

export default SyncedAssetsTable;
