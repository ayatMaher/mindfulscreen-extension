import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import ActivityFeed from './components/ActivityFeed';
import CategoryChart from './components/CategoryChart';
import StatsCards from './components/StatsCards';
import GoalsProgress from './components/GoalsProgress';
import SettingsPanel from './components/SettingsPanel';
import DataManager from './components/DataManager';
import WeeklyReport from './components/WeeklyReport';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SmartRecommendations from './components/SmartRecommendations';
import AdvancedSettings from './components/AdvancedSettings';
import AuthPanel from './components/AuthPanel';
import SyncSettings from './components/SyncSettings';
import { BackendService, defaultBackendConfig } from '../utils/backendConfig';
import NotificationSettings from './components/NotificationSettings';
import BreakHistory from './components/BreakHistory';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import AchievementBadges from './components/AchievementBadges';

import './popup.css';

export interface Activity {
  id: string;
  url: string;
  title: string;
  timestamp: string;
  domain: string;
  category: 'productive' | 'social' | 'entertainment' | 'shopping' | 'other';
  duration: number;
  categoryInfo: {
    emoji: string;
    color: string;
    name: string;
  };
}

export interface DailySummary {
  totalTime: number;
  categories: {
    productive: number;
    social: number;
    entertainment: number;
    shopping: number;
    other: number;
  };
}
export interface NotificationSettings {
  breakReminders: boolean;
  dailyLimits: boolean;
  categoryLimits: boolean;
  achievements: boolean;
  weeklyReports: boolean;
  snoozeDuration: number;
  enableSound: boolean;
  urgentMode: boolean;
}

export interface BreakSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  weekendsEnabled: boolean;
}

export interface UserSettings {
  breakInterval: number;
  dailyLimit: number;
  enableNotifications: boolean;
  goals: {
    dailyProductiveTime: number;
    maxSocialTime: number;
    maxEntertainmentTime?: number;
    maxShoppingTime?: number;
  };
  detailedTracking?: boolean;
  analyticsEnabled?: boolean;
  achievementNotifications?: boolean;
  weeklyReports?: boolean;
  notificationSettings?: NotificationSettings;
  breakSchedule?: BreakSchedule;
}

export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  emoji: string;
}

const Popup: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyData, setWeeklyData] = useState<DailySummary[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'weekly' | 'data' | 'goals' | 'settings' | 'sync' | 'notifications'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [backendService] = useState(() => new BackendService(defaultBackendConfig));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // ADD THIS
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === 'local') {
        loadData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const result = await chrome.storage.local.get([
        'activities',
        `daily_${today}`,
        'userSettings',
        'achievements',
        'weeklyData'
      ]);

      const activitiesData: Activity[] = result.activities || [];
      setActivities(activitiesData.slice(-6).reverse());
      setDailySummary(result[`daily_${today}`] || null);
      setUserSettings(result.userSettings || null);
      setAchievements(result.achievements || []);

      // Check if weeklyData exists, otherwise generate sample
      let weekly = result.weeklyData;
      if (!weekly || !Array.isArray(weekly)) {
        weekly = generateSampleWeeklyData();
        await chrome.storage.local.set({ weeklyData: weekly });
      }
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ADD THIS FUNCTION
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();

    // Show success animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const clearData = async () => {
    if (window.confirm('Clear all tracking data and settings?')) {
      await chrome.storage.local.clear();
      setActivities([]);
      setDailySummary(null);
      setUserSettings(null);
      setAchievements([]);
    }
  };

  const updateSettings = async (newSettings: UserSettings) => {
    await chrome.storage.local.set({ userSettings: newSettings });
    setUserSettings(newSettings);
  };

  // Function to trigger sync in background script
  const triggerSync = () => {
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">
          <h2>🧠 MindfulScreen</h2>
          <p>Loading your wellness data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Minimal Header */}
      <header className="header">
        <h1>🧠 MindfulScreen</h1>
        <p>Digital Wellness Tracker</p>
        <div className="status-indicator">
          <span className="status-dot active"></span>
          <span>Tracking Active</span>
        </div>
      </header>

      {/* Tabs with More Menu */}
      <div className="tabs-container">
        <div className="tabs">
          {/* First 3 Main Tabs */}
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setShowMoreMenu(false);
            }}
          >
            📊 Dashboard
          </button>

          <button
            className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('goals');
              setShowMoreMenu(false);
            }}
          >
            🎯 Goals
          </button>

          <button
            className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('weekly');
              setShowMoreMenu(false);
            }}
          >
            📅 Weekly
          </button>

          {/* More Menu Button */}
          <div className="more-tab-container" ref={moreMenuRef}>
            <button
              className={`tab more-tab ${showMoreMenu ? 'active' : ''}`}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              ☰ More
            </button>

            {/* More Menu Dropdown */}
            {showMoreMenu && (
              <div className="more-menu">
                <button
                  className={`more-menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('analytics');
                    setShowMoreMenu(false);
                  }}
                >
                  <span className="menu-emoji">📈</span>
                  <span className="menu-label">Analytics</span>
                </button>

                <button
                  className={`more-menu-item ${activeTab === 'data' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('data');
                    setShowMoreMenu(false);
                  }}
                >
                  <span className="menu-emoji">📁</span>
                  <span className="menu-label">Data</span>
                </button>

                <button
                  className={`more-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('settings');
                    setShowMoreMenu(false);
                  }}
                >
                  <span className="menu-emoji">⚙️</span>
                  <span className="menu-label">Settings</span>
                </button>

                <button
                  className={`more-menu-item ${activeTab === 'sync' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('sync');
                    setShowMoreMenu(false);
                  }}
                >
                  <span className="menu-emoji">☁️</span>
                  <span className="menu-label">Sync</span>
                </button>

                <button
                  className={`more-menu-item ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowMoreMenu(false);
                  }}
                >
                  <span className="menu-emoji">🔔</span>
                  <span className="menu-label">Notifications</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <div className="card summary-card">
            <StatsCards dailySummary={dailySummary} />
          </div>

          {dailySummary && (
            <div className="card category-card">
              <CategoryChart dailySummary={dailySummary} />
            </div>
          )}

          <div className="card activity-card">
            <ActivityFeed activities={activities} />
          </div>

          {achievements.length > 0 && (
            <div className="achievements-card">
              <h3>🎉 Recent Achievements</h3>
              <div className="achievements-list">
                {achievements.slice(-2).map(achievement => (
                  <div key={achievement.id} className="achievement-item">
                    <span className="achievement-emoji">{achievement.emoji}</span>
                    <div className="achievement-info">
                      <div className="achievement-title">{achievement.title}</div>
                      <div className="achievement-desc">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          <div className="card">
            <AdvancedAnalytics
              weeklyData={weeklyData}
              activities={activities}
            />
          </div>

          <div className="card">
            <AchievementBadges backendService={backendService} />
          </div>

          {userSettings && (
            <div className="card">
              <SmartRecommendations
                activities={activities}
                dailySummary={dailySummary}
                settings={userSettings}
              />
            </div>
          )}

          <div className="card activity-card">
            <ActivityFeed activities={activities} />
          </div>
        </>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && userSettings && (
        <div className="card goals-card">
          <GoalsProgress dailySummary={dailySummary} settings={userSettings} />
        </div>
      )}

      {/* Weekly Tab */}
      {activeTab === 'weekly' && (
        <WeeklyReport weeklyData={weeklyData} />
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <DataManager activities={activities} dailySummary={dailySummary} />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && userSettings && (
        <>
          <div className="card">
            <SettingsPanel settings={userSettings} onSettingsChange={updateSettings} />
          </div>
          <div className="card">
            <AdvancedSettings settings={userSettings} onSettingsChange={updateSettings} />
          </div>
        </>
      )}

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <>
          <div className="card">
            <AuthPanel
              backendService={backendService}
              onAuthChange={setIsAuthenticated}
            />
          </div>

          <div className="card">
            <SyncSettings
              backendService={backendService}
              onSyncChange={(enabled) => {
                if (enabled) {
                  triggerSync();
                }
              }}
            />
          </div>
        </>
      )}

      {activeTab === 'notifications' && userSettings && (
        <>
          <div className="card">
            <NotificationSettings
              settings={userSettings}
              onSettingsChange={updateSettings}
            />
          </div>
          <div className="card">
            <BreakHistory />
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="actions">
        <button
          className={`btn btn-primary ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
        <button className="btn btn-secondary" onClick={clearData}>
          🗑️ Clear Data
        </button>
      </div>

      <footer className="footer">
        <p>MindfulScreen • Your Digital Wellness Companion</p>
      </footer>
    </div>
  );
};

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}

const generateSampleWeeklyData = (): DailySummary[] => {
  return Array.from({ length: 7 }, (_, i) => ({
    totalTime: Math.floor(Math.random() * 14400) + 3600, // 1-4 hours
    categories: {
      productive: Math.floor(Math.random() * 7200) + 1800,
      social: Math.floor(Math.random() * 3600),
      entertainment: Math.floor(Math.random() * 5400),
      shopping: Math.floor(Math.random() * 1800),
      other: Math.floor(Math.random() * 3600)
    }
  }));
};

export default Popup;