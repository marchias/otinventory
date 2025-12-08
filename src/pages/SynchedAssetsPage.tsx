// src/pages/ServerAssetsPage.tsx
import React from 'react';
import SyncedAssetsTable from '../components/SynchedAssetsTable'

const ServerAssetsPage: React.FC = () => {
  return (
    <div style={{ padding: '12px 12px 56px', boxSizing: 'border-box' as const }}>
      <h1 style={{ fontSize: '1.2rem', margin: '4px 0 12px' }}>
        Server Assets (Synched  with Cloud)
      </h1>
      <SyncedAssetsTable />
    </div>
  );
};

export default ServerAssetsPage;
