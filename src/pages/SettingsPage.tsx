import React, { useEffect, useState } from 'react';
import { getGlobalSettings, saveGlobalSettings } from '../services/settingsService';

const SettingsPage: React.FC = () => {
  const [client, setClient] = useState('');
  const [site, setSite] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getGlobalSettings();
    if (current) {
      setClient(current.client);
      setSite(current.site);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !site.trim()) return;
    saveGlobalSettings({ client: client.trim(), site: site.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '12px 12px 64px' }}>
      <h1 style={{ fontSize: '1.2rem', margin: '4px 0 12px' }}>Site Settings</h1>
      <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>
        These values will be applied to every asset you inventory on this device.
      </p>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: '0.9rem' }}>
          Client
          <input
            type="text"
            value={client}
            onChange={e => setClient(e.target.value)}
            style={{ width: '100%', marginTop: 4 }}
            placeholder="e.g. Acme Refinery"
          />
        </label>
        <label style={{ fontSize: '0.9rem' }}>
          Site
          <input
            type="text"
            value={site}
            onChange={e => setSite(e.target.value)}
            style={{ width: '100%', marginTop: 4 }}
            placeholder="e.g. Unit 3 – North Plant"
          />
        </label>
        <button
          type="submit"
          style={{ padding: '8px 12px', cursor: 'pointer', marginTop: 8 }}
          disabled={!client.trim() || !site.trim()}
        >
          Save
        </button>
        {saved && (
          <div style={{ fontSize: '0.8rem', color: '#2f855a' }}>
            Settings saved. New assets will use this Client and Site.
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
