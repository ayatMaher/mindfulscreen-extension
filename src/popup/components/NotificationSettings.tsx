import React, { useState } from 'react';
import { UserSettings } from '../popup';

// Define interfaces for the component
interface NotificationSettingsData {
  breakReminders: boolean;
  dailyLimits: boolean;
  categoryLimits: boolean;
  achievements: boolean;
  weeklyReports: boolean;
  snoozeDuration: number;
  enableSound: boolean;
  urgentMode: boolean;
}

interface BreakScheduleData {
  enabled: boolean;
  startTime: string;
  endTime: string;
  weekendsEnabled: boolean;
}

interface NotificationSettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  // Default values for notification settings
  const defaultNotificationSettings: NotificationSettingsData = {
    breakReminders: true,
    dailyLimits: true,
    categoryLimits: true,
    achievements: true,
    weeklyReports: true,
    snoozeDuration: 10,
    enableSound: false,
    urgentMode: false
  };

  const defaultBreakSchedule: BreakScheduleData = {
    enabled: false,
    startTime: '09:00',
    endTime: '18:00',
    weekendsEnabled: false
  };

  const [localSettings, setLocalSettings] = useState<UserSettings>({
    ...settings,
    notificationSettings: settings.notificationSettings || defaultNotificationSettings,
    breakSchedule: settings.breakSchedule || defaultBreakSchedule
  });

  const handleNotificationChange = (key: keyof NotificationSettingsData, value: any) => {
    const newSettings = {
      ...localSettings,
      notificationSettings: {
        ...(localSettings.notificationSettings || defaultNotificationSettings),
        [key]: value
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleScheduleChange = (key: keyof BreakScheduleData, value: any) => {
    const newSettings = {
      ...localSettings,
      breakSchedule: {
        ...(localSettings.breakSchedule || defaultBreakSchedule),
        [key]: value
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  // Safe access to settings with fallbacks
  const notificationSettings = localSettings.notificationSettings || defaultNotificationSettings;
  const breakSchedule = localSettings.breakSchedule || defaultBreakSchedule;

  return (
    <div className="notification-settings-card">
      <h3>🔔 Notification Settings</h3>

      <div className="settings-section">
        <h4>📱 Notification Types</h4>
        
        {[
          { key: 'breakReminders', label: 'Break Reminders', emoji: '🌿' },
          { key: 'dailyLimits', label: 'Daily Limits', emoji: '⏰' },
          { key: 'categoryLimits', label: 'Category Limits', emoji: '📊' },
          { key: 'achievements', label: 'Achievements', emoji: '🏆' },
          { key: 'weeklyReports', label: 'Weekly Reports', emoji: '📈' }
        ].map(({ key, label, emoji }) => (
          <div key={key} className="setting-group">
            <label className="setting-label">
              <span>{emoji} {label}</span>
              <input
                type="checkbox"
                checked={notificationSettings[key as keyof NotificationSettingsData] as boolean}
                onChange={(e) => handleNotificationChange(key as keyof NotificationSettingsData, e.target.checked)}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h4>⏱️ Break Schedule</h4>
        
        <div className="setting-group">
          <label className="setting-label">
            <span>Enable Scheduled Breaks</span>
            <input
              type="checkbox"
              checked={breakSchedule.enabled}
              onChange={(e) => handleScheduleChange('enabled', e.target.checked)}
            />
          </label>
          <div className="setting-description">
            Only show break reminders during specified hours
          </div>
        </div>

        {breakSchedule.enabled && (
          <>
            <div className="time-inputs">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={breakSchedule.startTime}
                  onChange={(e) => handleScheduleChange('startTime', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={breakSchedule.endTime}
                  onChange={(e) => handleScheduleChange('endTime', e.target.value)}
                />
              </div>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                <span>Include Weekends</span>
                <input
                  type="checkbox"
                  checked={breakSchedule.weekendsEnabled}
                  onChange={(e) => handleScheduleChange('weekendsEnabled', e.target.checked)}
                />
              </label>
            </div>
          </>
        )}
      </div>

      <div className="settings-section">
        <h4>🔧 Advanced Options</h4>
        
        <div className="setting-group">
          <label className="setting-label">
            <span>Snooze Duration (minutes)</span>
            <select
              value={notificationSettings.snoozeDuration}
              onChange={(e) => handleNotificationChange('snoozeDuration', parseInt(e.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </label>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>🔊 Enable Sound</span>
            <input
              type="checkbox"
              checked={notificationSettings.enableSound}
              onChange={(e) => handleNotificationChange('enableSound', e.target.checked)}
            />
          </label>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <span>🚨 Urgent Mode</span>
            <input
              type="checkbox"
              checked={notificationSettings.urgentMode}
              onChange={(e) => handleNotificationChange('urgentMode', e.target.checked)}
            />
          </label>
          <div className="setting-description">
            More prominent notifications for critical alerts
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;