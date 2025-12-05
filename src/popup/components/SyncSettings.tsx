// src/popup/components/SyncSettings.tsx
import React, { useState, useEffect } from 'react';
import { BackendService } from '../../utils/backendConfig';

interface SyncSettingsProps {
  backendService: BackendService;
  onSyncChange: (enabled: boolean) => void;
}

const SyncSettings: React.FC<SyncSettingsProps> = ({ backendService, onSyncChange }) => {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState(15);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await chrome.storage.local.get(['syncSettings', 'lastSyncTime']);
    const settings = result.syncSettings || { enabled: false, interval: 15 };
    setSyncEnabled(settings.enabled);
    setSyncInterval(settings.interval);
    setLastSync(result.lastSyncTime || null);
  };

  const saveSettings = async (enabled: boolean, interval: number) => {
    const settings = { enabled, interval };
    await chrome.storage.local.set({ syncSettings: settings });
    setSyncEnabled(enabled);
    setSyncInterval(interval);
    onSyncChange(enabled);

    if (enabled && backendService.isAuthenticated()) {
      // Schedule sync
      scheduleSync(interval);
    }
  };

  const scheduleSync = (interval: number) => {
    chrome.alarms.create('syncData', {
      periodInMinutes: interval
    });
  };

  const handleManualSync = async () => {
    if (!backendService.isAuthenticated()) return;

    setSyncing(true);
    setSyncStatus('syncing');

    try {
      // Get current data
      const today = new Date().toISOString().split('T')[0];
      const result = await chrome.storage.local.get(['activities', `daily_${today}`]);

      const success = await backendService.syncData(
        result.activities || [],
        result[`daily_${today}`] || null
      );

      if (success) {
        const now = new Date().toLocaleTimeString();
        await chrome.storage.local.set({ lastSyncTime: now });
        setLastSync(now);
        setSyncStatus('success');
        // Clear success status after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
        alert('Data synced successfully!');
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
        alert('Sync failed. Please try again.');
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    return `Last sync: ${lastSync}`;
  };

  return (
    <div className="sync-settings-card">
      <h3>☁️ Cloud Sync Settings</h3>

      <div className="sync-status">
        <div className="sync-status-item">
          <span className="sync-label">Cloud Sync</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={(e) => saveSettings(e.target.checked, syncInterval)}
              disabled={!backendService.isAuthenticated()}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {!backendService.isAuthenticated() && (
          <div className="sync-warning">
            <span className="warning-emoji">⚠️</span>
            <span className="warning-text">Sign in to enable cloud sync</span>
          </div>
        )}
      </div>

      {syncEnabled && backendService.isAuthenticated() && (
        <>
          <div className="sync-controls">
            <div className="form-group">
              <label>Sync Interval</label>
              <select
                value={syncInterval}
                onChange={(e) => saveSettings(syncEnabled, parseInt(e.target.value))}
                disabled={syncing}
              >
                <option value={5}>Every 5 minutes</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
            </div>

            <div className="sync-actions">
              <button
                className={`btn btn-secondary ${syncStatus === 'success' ? 'success' : ''} ${syncStatus === 'error' ? 'error' : ''}`}
                onClick={handleManualSync}
                disabled={syncing || !backendService.isAuthenticated()}
              >
                {syncing ? '🔄 Syncing...' :
                  syncStatus === 'success' ? '✅ Synced!' :
                    syncStatus === 'error' ? '❌ Failed' : '🔄 Sync Now'}
              </button>

              <div className="last-sync">
                {formatLastSync()}
              </div>
            </div>
          </div>

          <div className="sync-info">
            <h4>📦 Sync Status</h4>
            <ul>
              <li>✅ Activities: Synced daily</li>
              <li>✅ Daily summaries: Synced in real-time</li>
              <li>✅ Goals and settings: Backed up</li>
              <li>✅ Achievements: Preserved</li>
            </ul>
          </div>
        </>
      )}

      <div className="sync-benefits">
        <h4>✨ Why Enable Sync?</h4>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-emoji">💾</span>
            <span className="benefit-title">Backup</span>
            <span className="benefit-desc">Never lose your data</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-emoji">📱</span>
            <span className="benefit-title">Multi-Device</span>
            <span className="benefit-desc">Access anywhere</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-emoji">📈</span>
            <span className="benefit-title">Advanced Stats</span>
            <span className="benefit-desc">Get deeper insights</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-emoji">🔒</span>
            <span className="benefit-title">Security</span>
            <span className="benefit-desc">Encrypted storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncSettings;