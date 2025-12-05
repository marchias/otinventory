// src/components/SyncStatus.tsx
import React, { useEffect, useState } from 'react';
import { syncAssets, getDirtyCount } from '../services/syncService';

const SyncStatus: React.FC = () => {
  const [dirtyCount, setDirtyCount] = useState<number>(0);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshDirtyCount();
  }, []);

  const refreshDirtyCount = async () => {
    const count = await getDirtyCount();
    setDirtyCount(count);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    const result = await syncAssets();

    setSyncing(false);

    if (result.success) {
      setMessage(
        result.syncedCount === 0
          ? 'No changes to sync.'
          : `Synced ${result.syncedCount} asset(s) successfully.`
      );
    } else {
      setMessage(`Sync failed: ${result.error ?? 'Unknown error'}`);
    }

    await refreshDirtyCount();
  };

  return (
    <div>
      <p>Pending sync: {dirtyCount}</p>

      <button
        onClick={handleSync}
        disabled={syncing || dirtyCount === 0}
        style={{ padding: '8px 12px', fontSize: '1rem', cursor: 'pointer' }}
      >
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>

      {message && <p style={{ marginTop: 8 }}>{message}</p>}
    </div>
  );
};

export default SyncStatus;
