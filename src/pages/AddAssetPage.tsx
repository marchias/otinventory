import React from 'react';
import AssetForm from '../components/AssetForm';
import { getGlobalSettings } from '../services/settingsService';

const AddAssetPage: React.FC = () => {
  const settings = getGlobalSettings();

  return (
    <div style={{ padding: '12px 12px 64px' }}>
      <h1 style={{ fontSize: '1.2rem', margin: '4px 0 4px' }}>Add Asset</h1>
      {settings ? (
        <div style={{ fontSize: '0.8rem', color: '#4a5568', marginBottom: 8 }}>
          Client: <strong>{settings.client}</strong> | Site:{' '}
          <strong>{settings.site}</strong>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#c05621', marginBottom: 8 }}>
          Client and Site not set. Go to <strong>Settings</strong> to configure
          before inventorying assets.
        </div>
      )}

      <AssetForm globalSettings={settings ?? undefined} />
    </div>
  );
};

export default AddAssetPage;
