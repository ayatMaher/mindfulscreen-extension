import React, { useState } from 'react';
import { UserSettings } from '../popup';

interface SettingsPanelProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleGoalChange = (goalKey: keyof UserSettings['goals'], value: number) => {
    const newSettings = {
      ...localSettings,
      goals: { ...localSettings.goals, [goalKey]: value }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div className="settings-card">
      <h3>⚙️ Wellness Settings</h3>

      <div className="setting-group">
        <label className="setting-label">
          <span>🔔 Break Reminders</span>
          <input
            type="checkbox"
            checked={localSettings.enableNotifications}
            onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
          />
        </label>
        <div className="setting-description">
          Get reminders to take breaks during long browsing sessions
        </div>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>⏰ Break Interval</span>
          <select
            value={localSettings.breakInterval}
            onChange={(e) => handleSettingChange('breakInterval', parseInt(e.target.value))}
          >
            <option value={30}>Every 30 minutes</option>
            <option value={45}>Every 45 minutes</option>
            <option value={60}>Every 60 minutes</option>
            <option value={90}>Every 90 minutes</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label className="setting-label">
          <span>📊 Daily Time Limit</span>
          <select
            value={localSettings.dailyLimit}
            onChange={(e) => handleSettingChange('dailyLimit', parseInt(e.target.value))}
          >
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
            <option value={300}>5 hours</option>
            <option value={360}>6 hours</option>
          </select>
        </label>
      </div>

      <div className="goals-settings">
        <h4>🎯 Daily Goals</h4>
        
        <div className="setting-group">
          <label className="setting-label">
            <span>💼 Productive Time Goal</span>
            <select
              value={localSettings.goals.dailyProductiveTime}
              onChange={(e) => handleGoalChange('dailyProductiveTime', parseInt(e.target.value))}
            >
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </label>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>👥 Social Media Limit</span>
            <select
              value={localSettings.goals.maxSocialTime}
              onChange={(e) => handleGoalChange('maxSocialTime', parseInt(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
            </select>
          </label>
        </div>
      </div>

      <div className="settings-info">
        <p>⚡ Changes are saved automatically</p>
      </div>
    </div>
  );
};

export default SettingsPanel;