// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// 👇 ADD THIS IMPORT
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('sw-offline-ready'));
    },
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    }
  });

  // expose for UI to call when user clicks “Update”
  (window as any).__updateSW = updateSW;
}

registerSW({
  onOfflineReady() {
    console.log('PWA ready to work offline');
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
