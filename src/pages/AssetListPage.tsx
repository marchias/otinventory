// src/pages/AssetListPage.tsx
import React, { useEffect, useState } from 'react';
import AssetList from '../components/AssetList';
import { db } from '../db';

const AssetListPage: React.FC = () => {
  const [count, setCount] = useState(0);

  const loadCount = async () => {
    const all = await db.assets.toArray();
    const visible = all.filter(a => !a.isDeleted); // hide soft-deleted
    setCount(visible.length);
  };

  useEffect(() => {
    loadCount();

    // Poll every 3s to reflect adds/edits/deletes
    const interval = setInterval(loadCount, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Local Assets ({count})</h1>
      <AssetList />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '12px 12px 56px',
    boxSizing: 'border-box' as const
  },
  title: {
    fontSize: '1.2rem',
    margin: '4px 0 8px'
  }
};

export default AssetListPage;
