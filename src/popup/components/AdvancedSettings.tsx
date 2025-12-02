// src/popup/components/AdvancedSettings.tsx
import React, { useState } from 'react';
import { UserSettings } from '../popup';

interface AdvancedSettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>({
    ...settings,
    goals: {
      dailyProductiveTime: settings.goals.dailyProductiveTime,
      maxSocialTime: settings.goals.maxSocialTime,
      maxEntertainmentTime: settings.goals.maxEntertainmentTime || 120,
      maxShoppingTime: settings.goals.maxShoppingTime || 60
    },
    detailedTracking: settings.detailedTracking || false,
    analyticsEnabled: settings.analyticsEnabled !== false, // default to true
    achievementNotifications: settings.achievementNotifications !== false, // default to true
    weeklyReports: settings.weeklyReports !== false // default to true
  });

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleGoalChange = (goalKey: keyof UserSettings['goals'], value: number) => {
    const newSettings = {
      ...localSettings,
      goals: { 
        ...localSettings.goals, 
        [goalKey]: value 
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="advanced-settings-card">
      <h3>⚙️ Advanced Settings</h3>

      <div className="settings-section">
        <h4>📊 Tracking Preferences</h4>
        
        <div className="setting-group">
          <label className="setting-label">
            <span>🔍 Detailed Tracking</span>
            <input
              type="checkbox"
              checked={localSettings.detailedTracking || false}
              onChange={(e) => handleSettingChange('detailedTracking', e.target.checked)}
            />
          </label>
          <div className="setting-description">
            Track individual page visits (more accurate but uses more memory)
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>📈 Analytics Collection</span>
            <input
              type="checkbox"
              checked={localSettings.analyticsEnabled !== false}
              onChange={(e) => handleSettingChange('analyticsEnabled', e.target.checked)}
            />
          </label>
          <div className="setting-description">
            Help improve MindfulScreen by sharing anonymous usage data
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h4>🎯 Advanced Goals</h4>
        
        <div className="setting-group">
          <label className="setting-label">
            <span>🎮 Entertainment Limit</span>
            <select
              value={localSettings.goals.maxEntertainmentTime || 120}
              onChange={(e) => handleGoalChange('maxEntertainmentTime', parseInt(e.target.value))}
            >
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </label>
          <div className="setting-description">
            Maximum daily entertainment time
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>🛒 Shopping Limit</span>
            <select
              value={localSettings.goals.maxShoppingTime || 60}
              onChange={(e) => handleGoalChange('maxShoppingTime', parseInt(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
            </select>
          </label>
          <div className="setting-description">
            Maximum daily shopping time
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h4>🔔 Notification Preferences</h4>
        
        <div className="setting-group">
          <label className="setting-label">
            <span>💡 Achievement Notifications</span>
            <input
              type="checkbox"
              checked={localSettings.achievementNotifications !== false}
              onChange={(e) => handleSettingChange('achievementNotifications', e.target.checked)}
            />
          </label>
          <div className="setting-description">
            Show notifications when you unlock achievements
          </div>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>📈 Weekly Report</span>
            <input
              type="checkbox"
              checked={localSettings.weeklyReports !== false}
              onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
            />
          </label>
          <div className="setting-description">
            Receive a weekly summary every Monday
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => {
            const defaultSettings: UserSettings = {
              breakInterval: 60,
              dailyLimit: 240,
              enableNotifications: true,
              goals: {
                dailyProductiveTime: 120,
                maxSocialTime: 60,
                maxEntertainmentTime: 120,
                maxShoppingTime: 60
              },
              detailedTracking: false,
              analyticsEnabled: true,
              achievementNotifications: true,
              weeklyReports: true
            };
            setLocalSettings(defaultSettings);
            onSettingsChange(defaultSettings);
          }}
        >
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default AdvancedSettings;