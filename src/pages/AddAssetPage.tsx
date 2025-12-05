import React from 'react';
import AssetForm from '../components/AssetForm';

const AddAssetPage: React.FC = () => {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Add Asset</h1>
      <AssetForm />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '12px 12px 56px', // bottom padding for tab bar
    boxSizing: 'border-box' as const
  },
  title: {
    fontSize: '1.2rem',
    margin: '4px 0 8px'
  }
};

export default AddAssetPage;
