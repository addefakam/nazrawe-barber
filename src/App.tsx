import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { registerServiceWorker } from './registerServiceWorker';
import { Dashboard } from './components/Dashboard';
import { IncomeLog } from './components/IncomeLog';
import { ExpenseLog } from './components/ExpenseLog';
import { Ledger } from './components/Ledger';
import { Settings } from './components/Settings';
import { translations } from './utils/translations';

// Initialize PWA Offline Service Worker
registerServiceWorker();

type Tab = 'dashboard' | 'log' | 'expense' | 'ledger' | 'settings';

const AppContent: React.FC = () => {
  const { theme, toggleTheme, language, toggleLanguage } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('log');

  const t = translations[language];

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, id: Date.now() });
  };

  // Auto-dismiss toast after 3.5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="app-shell">
      {/* Toast Notification */}
      {toast && (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <span>
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <div style={{ flex: 1 }}>{toast.message}</div>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ fontSize: '12px', opacity: 0.5, cursor: 'pointer', padding: '2px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* App Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">✂️</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 className="app-title">{t.appName}</h1>
            {language === 'am' && (
              <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', marginTop: '-2px', fontWeight: 600 }}>
                Nazrawe Barber
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Bilingual Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            style={{
              padding: '6px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1.5px solid hsla(var(--border-glass) / 0.12)',
              background: 'hsla(var(--bg-surface) / 0.4)',
              color: 'hsl(var(--text-primary))',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{language === 'en' ? '🇪🇹 አማርኛ' : '🇺🇸 English'}</span>
          </button>
          
          <button
            type="button"
            onClick={toggleTheme}
            style={{ fontSize: '20px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            title="Switch theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="app-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'log'       && <IncomeLog onSuccess={triggerToast} />}
        {activeTab === 'expense'   && <ExpenseLog onSuccess={triggerToast} />}
        {activeTab === 'ledger'    && <Ledger onSuccess={triggerToast} />}
        {activeTab === 'settings'  && <Settings onSuccess={triggerToast} />}
      </main>

      {/* Bottom Navigation Tabs — 5 tabs */}
      <nav className="tab-bar">
        <div
          className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>{t.summary}</span>
        </div>

        <div
          className={`tab-item ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <span className="tab-icon">➕</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>{t.addIncome}</span>
        </div>

        <div
          className={`tab-item ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
          style={{ color: activeTab === 'expense' ? 'hsl(var(--color-danger))' : undefined }}
        >
          <span className="tab-icon">💸</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>{t.addExpense}</span>
        </div>

        <div
          className={`tab-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <span className="tab-icon">📋</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>{t.records}</span>
        </div>

        <div
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>{t.settings}</span>
        </div>
      </nav>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
