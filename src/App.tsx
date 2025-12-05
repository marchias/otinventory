import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AssetListPage from './pages/AssetListPage';
import AddAssetPage from './pages/AddAssetPage';
import SynchAssetsPage from './pages/SynchAssetsPage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useDirtyCount } from './hooks/useDirtyCount';

const App: React.FC = () => {
  const online = useOnlineStatus();
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleOfflineReady = () => setOfflineReady(true);
    const handleUpdateAvailable = () => setUpdateAvailable(true);

    window.addEventListener('sw-offline-ready', handleOfflineReady);
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-offline-ready', handleOfflineReady);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleDismissOfflineReady = () => setOfflineReady(false);

  const handleUpdateApp = () => {
    const updater = (window as any).__updateSW as
      | ((reloadPage?: boolean) => Promise<void>)
      | undefined;

    if (updater) {
      updater(true); // reload after updating SW
    } else {
      // fallback: just reload
      window.location.reload();
    }
  };

  return (
    <div style={styles.appShell}>
      {/* Offline / Online banner */}
      {!online && (
        <div style={styles.bannerOffline}>
          You&apos;re offline. Sync is disabled until network is restored.
        </div>
      )}
      {online && (
        <div style={styles.bannerOnline}>
          Online. Sync is available.
        </div>
      )}

      {/* Offline-ready toast */}
      {offlineReady && (
        <div style={styles.toast}>
          <span>The app is ready to work offline.</span>
          <button
            type="button"
            onClick={handleDismissOfflineReady}
            style={styles.toastButton}
          >
            OK
          </button>
        </div>
      )}

      {/* Update available banner */}
      {updateAvailable && (
        <div style={styles.updateBanner}>
          <span>A new version of this app is available.</span>
          <button
            type="button"
            onClick={handleUpdateApp}
            style={styles.updateButton}
          >
            Update
          </button>
        </div>
      )}

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<AssetListPage />} />
          <Route path="/add" element={<AddAssetPage />} />
          <Route path="/synch" element={<SynchAssetsPage />} />
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

  const isAssets =
    location.pathname === '/' || location.pathname === '/assets';
  const isAdd = location.pathname === '/add';
  const isSynch = location.pathname === '/synch';

  return (
    <nav style={styles.nav}>
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          ...styles.navButton,
          ...(isAssets ? styles.navButtonActive : {})
        }}
      >
        <div>📋</div>
        <div style={styles.navLabel}>Assets</div>
      </button>

      <button
        type="button"
        onClick={() => navigate('/add')}
        style={{
          ...styles.navButton,
          ...(isAdd ? styles.navButtonActive : {})
        }}
      >
        <div>➕</div>
        <div style={styles.navLabel}>Add</div>
      </button>

      <button
        type="button"
        onClick={() => navigate('/synch')}
        style={{
          ...styles.navButton,
          ...(isSynch ? styles.navButtonActive : {})
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* sync icon */}
          <div style={{ width: 22, height: 22 }}>
            <svg
              width="22"
              height="22"
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
          </div>
          {/* badge */}
          {dirtyCount > 0 && (
            <span style={styles.badge}>
              {dirtyCount > 99 ? '99+' : dirtyCount}
            </span>
          )}
        </div>
        <div style={styles.navLabel}>Synch</div>
      </button>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appShell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    maxWidth: 600,
    margin: '0 auto',
    backgroundColor: '#f7fafc',
    position: 'relative'
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 56 // space for nav
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 600,
    margin: '0 auto',
    display: 'flex',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff'
  },
  navButton: {
    flex: 1,
    padding: '6px 4px',
    border: 'none',
    background: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    cursor: 'pointer'
  },
  navButtonActive: {
    backgroundColor: '#e6fffa'
  },
  navLabel: {
    marginTop: 2,
    fontSize: '0.75rem'
  },
  badge: {
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
  },
  bannerOffline: {
    backgroundColor: '#fed7d7',
    color: '#742a2a',
    padding: '4px 8px',
    fontSize: '0.8rem',
    textAlign: 'center'
  },
  bannerOnline: {
    backgroundColor: '#c6f6d5',
    color: '#22543d',
    padding: '4px 8px',
    fontSize: '0.8rem',
    textAlign: 'center'
  },
  toast: {
    position: 'fixed',
    bottom: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#2d3748',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999
  },
  toastButton: {
    border: 'none',
    background: 'none',
    color: '#90cdf4',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  updateBanner: {
    position: 'fixed',
    bottom: 70,
    left: 0,
    right: 0,
    margin: '0 auto',
    maxWidth: 600,
    backgroundColor: '#3182ce',
    color: '#fff',
    padding: '8px 12px',
    fontSize: '0.8rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 9998
  },
  updateButton: {
    border: 'none',
    backgroundColor: '#e2e8f0',
    color: '#2b6cb0',
    padding: '4px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.8rem'
  }
};

export default App;
