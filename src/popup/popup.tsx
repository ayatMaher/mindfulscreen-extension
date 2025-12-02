import React, { useEffect, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'weekly' | 'data' | 'goals' | 'settings'>('dashboard')
  const [loading, setLoading] = useState(true);

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
      setWeeklyData(result.weeklyData || generateSampleWeeklyData());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

    {/* Clean Tabs */}
    <div className="tabs">
      <button 
        className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        📊 Dashboard
      </button>
      <button 
    className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
    onClick={() => setActiveTab('analytics')}
  >
    📈 Analytics
  </button>
      <button 
        className={`tab ${activeTab === 'goals' ? 'active' : ''}`}
        onClick={() => setActiveTab('goals')}
      >
        🎯 Goals
      </button>
        <button 
  className={`tab ${activeTab === 'weekly' ? 'active' : ''}`}
  onClick={() => setActiveTab('weekly')}
>
  📅 Weekly
</button>
      <button 
        className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        ⚙️ Settings
      </button>
    
<button 
  className={`tab ${activeTab === 'data' ? 'active' : ''}`}
  onClick={() => setActiveTab('data')}
>
  📁 Data
</button>
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

{activeTab === 'analytics' && (
  <>
    <div className="card">
      <AnalyticsDashboard 
        activities={activities}
        dailySummary={dailySummary}
        weeklyData={weeklyData}
      />
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

    {activeTab === 'weekly' && (
  <WeeklyReport weeklyData={weeklyData} />
)}

{activeTab === 'data' && (
  <DataManager activities={activities} dailySummary={dailySummary} />
)}

    {/* Action Buttons */}
    <div className="actions">
      <button className="btn btn-primary" onClick={loadData}>
        🔄 Refresh
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