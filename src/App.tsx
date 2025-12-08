// src/App.tsx
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AssetListPage from './pages/AssetListPage';
import AddAssetPage from './pages/AddAssetPage';
import SynchAssetsPage from './pages/SynchAssetsPage';
import { useDirtyCount } from './hooks/useDirtyCount';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import SettingsPage from './pages/SettingsPage';
import SynchedAssetsPage from './pages/SynchedAssetsPage';

const AppShell: React.FC = () => {
  const online = useOnlineStatus();

  return (
    <div className="app-root">
      {/* Online/offline banner */}
      <div
        className="app-banner"
        style={{
          backgroundColor: online ? '#c6f6d5' : '#fed7d7',
          color: online ? '#22543d' : '#742a2a'
        }}
      >
        {online ? 'Online — Sync available.' : 'Offline — Sync disabled.'}
      </div>

      <div className="app-content">
        <Routes>
          <Route path="/" element={<AssetListPage />} />
          <Route path="/add" element={<AddAssetPage />} />
          <Route path="/synch" element={<SynchAssetsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/synched-assets" element={<SynchedAssetsPage />} />
        </Routes>
      </div>

      <BottomNav />
    </div>
  );
};

  const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dirtyCount = useDirtyCount(3000);
  const isSettings = location.pathname === '/settings';
  const isAssets =
  location.pathname === '/' || location.pathname === '/assets';
  const isAdd = location.pathname === '/add';
  const isSynch = location.pathname === '/synch';

  return (
    <nav className="app-nav">
      <button
        type="button"
        onClick={() => navigate('/')}
        className={`app-nav-button ${isAssets ? 'app-nav-button-active' : ''}`}
      >
        <div>📋</div>
        <div className="app-nav-label">Assets</div>
      </button>

      <button
        type="button"
        onClick={() => navigate('/add')}
        className={`app-nav-button ${isAdd ? 'app-nav-button-active' : ''}`}
      >
        <div>➕</div>
        <div className="app-nav-label">Add</div>
      </button>

      <button
        type="button"
        onClick={() => navigate('/synch')}
        className={`app-nav-button ${isSynch ? 'app-nav-button-active' : ''}`}
      >
        <div style={{ position: 'relative' }}>
          {/* Sync icon */}
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0114.36-3.36L23 10"></path>
            <path d="M20.49 15a9 9 0 01-14.36 3.36L1 14"></path>
          </svg>
          {dirtyCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -8,
                backgroundColor: '#e53e3e',
                color: '#fff',
                borderRadius: '999px',
                padding: '0 4px',
                fontSize: '0.6rem',
                minWidth: 14,
                textAlign: 'center'
              }}
            >
              {dirtyCount > 99 ? '99+' : dirtyCount}
            </span>
          )}
        </div>
        <div className="app-nav-label">Sync</div>
      </button>
      <button
      type="button"
      onClick={() => navigate('/settings')}
      className={`app-nav-button ${isSettings ? 'app-nav-button-active' : ''}`}
    >
      <div>⚙️</div>
      <div className="app-nav-label">Settings</div>
    </button>
   <button
    type="button"
    onClick={() => navigate('/synched-assets')}
    className={`app-nav-button ${isSettings ? 'app-nav-button-active' : ''}`}
  >
    <div className="nav-icon-grid-svg"></div>
    <div className="app-nav-label">Synched</div>
  </button>

    </nav>
  );
};

export default AppShell;
